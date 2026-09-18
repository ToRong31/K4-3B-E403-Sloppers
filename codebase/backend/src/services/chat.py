import logging
from typing import Any

from src.infrastructure.lab_manifest_store import LabManifestStore
from src.models.schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)


class ChatModelInvocationError(RuntimeError):
    """Raised when private chat cannot obtain a real model response."""


def _normalize_tasks(
    tasks: list[dict[str, Any]], group_id: str
) -> list[dict[str, Any]]:
    normalized = []
    for source in tasks:
        task = dict(source)
        task["owner_id"] = task.get("owner_id") or task.get("owner") or ""
        task["group_id"] = task.get("group_id") or group_id
        normalized.append(task)
    return normalized


def _load_documents_from_manifest(
    lab_id: str, store: LabManifestStore | None = None
) -> tuple[list[dict[str, Any]], dict[str, Any] | None]:
    """Load canonical lab manifest matching lab_id and extract document chunks dynamically."""
    if store is None:
        return [], None

    manifest = store.get(lab_id, version=1)
    if manifest and manifest.get("checkpoints"):
        actual_lab_id = manifest.get("lab_id") or lab_id
        docs: list[dict[str, Any]] = []
        for cp in manifest.get("checkpoints", []):
            for item in cp.get("items", []):
                docs.append(
                    {
                        "lab_id": actual_lab_id,
                        "checkpoint_id": cp.get("checkpoint_id"),
                        "checkpoint_order": cp.get("checkpoint_order"),
                        "ref_id": item.get("ref_id"),
                        "title": item.get("title"),
                        "content": item.get("content"),
                        "source_type": item.get("source_type"),
                    }
                )
        return docs, manifest

    return [], None


class ChatService:
    def __init__(
        self,
        graph: Any,
        llm: Any = None,
        lab_manifest_store: LabManifestStore | None = None,
    ) -> None:
        self.graph = graph
        self.llm = llm
        self.lab_manifest_store = lab_manifest_store or LabManifestStore()

    def process_message(self, request: ChatRequest) -> ChatResponse:
        group_id = (request.group_id or "").strip()
        user_id = (request.user_id or "").strip()
        lab_id = (request.lab_id or "").strip()

        tasks = _normalize_tasks(request.tasks, group_id)
        documents, manifest = (
            (request.documents, None)
            if request.documents is not None
            else _load_documents_from_manifest(lab_id, self.lab_manifest_store)
        )
        if manifest is None and lab_id and self.lab_manifest_store is not None:
            manifest = self.lab_manifest_store.get(lab_id, version=1)

        state = {
            "user_id": user_id or "user",
            "group_id": group_id or "group",
            "thread_id": request.thread_id or f"{group_id}:{user_id}",
            "lab_id": lab_id or "default-lab",
            "question": request.message,
            "task_id": request.task_id,
            "tasks": tasks,
            "documents": documents,
            "lab_manifest": manifest,
        }
        result = self.graph.invoke(state)

        if self.llm is None:
            raise ChatModelInvocationError("Trợ lý AI chưa được cấu hình.")

        try:
            from langchain_core.messages import HumanMessage, SystemMessage

            # 1. Structure canonical lab checkpoints overview strictly for the active lab
            lab_title = (
                manifest.get("title")
                if manifest and manifest.get("title")
                else (f"Bài LAB {lab_id}" if lab_id else "Bài LAB hiện tại")
            )
            lab_sections = []
            if manifest and manifest.get("checkpoints"):
                for cp in manifest.get("checkpoints", []):
                    cp_tag = str(cp.get("checkpoint_id", "")).upper()
                    cp_name = cp.get("title", "")
                    items_bullets = [
                        f"    - {it.get('title')}: {it.get('content')}"
                        for it in cp.get("items", [])
                    ]
                    lab_sections.append(
                        f"  + [{cp_tag}] {cp_name}\n" + "\n".join(items_bullets)
                    )
                lab_overview = "\n".join(lab_sections)
            elif documents:
                doc_lines = [
                    f"  - [{d.get('checkpoint_id', 'REQ')}] {d.get('title', '')}: {d.get('content', '')}"
                    for d in documents[:15]
                ]
                lab_overview = "\n".join(doc_lines)
            else:
                lab_overview = "  - Chưa có tệp đặc tả JSON nào cho bài LAB này."

            # 2. Team tasks summary
            team_task_lines = []
            for t in tasks:
                t_owner = t.get("owner_id") or t.get("owner") or "Chưa phân công"
                t_status = t.get("status", "todo").upper()
                team_task_lines.append(
                    f"  - [{t_status}] {t.get('title')} (Phụ trách: {t_owner})"
                )
            team_summary = (
                "\n".join(team_task_lines)
                or "  - Chưa có task nào trong kế hoạch nhóm."
            )

            # 3. User's specific assigned tasks
            my_tasks = [
                task
                for task in tasks
                if user_id and (task.get("owner_id") or task.get("owner")) == user_id
            ]
            task_lines = []
            for task in my_tasks:
                criteria = "; ".join(task.get("completion_criteria", [])) or "chưa có"
                dependencies = ", ".join(task.get("depends_on", [])) or "không có"
                refs = ", ".join(task.get("reference_ids", [])) or "chưa gắn"
                task_lines.append(
                    f"- [{task.get('status', 'todo').upper()}] {task.get('title')}\n"
                    f"  Đầu ra: {task.get('deliverable', 'N/A')}\n"
                    f"  Tiêu chí hoàn thành: {criteria}\n"
                    f"  Phụ thuộc: {dependencies}\n"
                    f"  Nguồn LAB: {refs}"
                )
            tasks_summary = (
                "\n".join(task_lines) or "- Chưa có task nào được giao."
            )

            student_label = user_id if user_id else "học viên"
            group_label = f" (thuộc nhóm {group_id})" if group_id else ""
            system_prompt = (
                "Bạn là Trợ lý Lab AI 1:1 của VLearn LabSpace.\n"
                f"Bạn hỗ trợ cá nhân {student_label}{group_label} trong {lab_title}.\n\n"
                "THÔNG TIN ĐẶC TẢ BÀI LAB CHÍNH THỨC:\n"
                f"{lab_overview}\n\n"
                "TIẾN ĐỘ & PHÂN CÔNG TOÀN NHÓM:\n"
                f"{team_summary}\n\n"
                "TASK THỰC TẾ ĐƯỢC GIAO CHO HỌC VIÊN:\n"
                f"- Số task của học viên: {len(my_tasks)}\n"
                f"{tasks_summary}\n\n"
                "QUY TẮC PHÂN TÍCH & TƯ VẤN:\n"
                "1. Trả lời bằng tiếng Việt thân thiện, rõ ràng, thực tế và đúng trọng tâm câu hỏi.\n"
                "2. Khi học viên hỏi về bài LAB (đề bài, lab cần làm gì, có những checkpoint nào, yêu cầu chung là gì): Hãy phân tích dựa trên THÔNG TIN ĐẶC TẢ BÀI LAB CHÍNH THỨC ở trên để giải thích rõ mục tiêu và các deliverables cần nộp. Tuyệt đối không suy đoán sang bài LAB khác nếu không khớp mã lab_id.\n"
                "3. Khi học viên hỏi về việc của mình ('Tôi cần làm gì?', 'Task của tôi là gì?'): Liệt kê chính xác các task của riêng học viên, giải thích task đó thuộc checkpoint nào và đóng góp gì vào kết quả bài thi của nhóm.\n"
                "4. Khi học viên hỏi cách làm task ('Task này làm thế nào?', 'Làm sao để hoàn thành?'): Hãy hướng dẫn phương pháp, các bước thực hiện, gợi ý kỹ thuật hoặc công cụ, và nhắc học viên bám sát tiêu chí hoàn thành (completion criteria); tuyệt đối không giải hộ hoặc viết code hoàn chỉnh thay học viên.\n"
                "5. Khi hỏi về tiến độ nhóm: Hãy dựa vào TIẾN ĐỘ & PHÂN CÔNG TOÀN NHÓM để phân tích xem nhóm còn bao nhiêu task chưa xong, mốc nào sắp đến hạn và cần ưu tiên giải quyết phần nào.\n"
                "6. Chỉ dựa trên dữ liệu chính thức được cung cấp, không bịa đặt thông tin; không tự ý đổi owner hay trạng thái task."
            )
            ai_reply = self.llm.invoke(
                [
                    SystemMessage(content=system_prompt),
                    HumanMessage(content=request.message),
                ]
            )
            llm_text = (
                ai_reply.content if hasattr(ai_reply, "content") else str(ai_reply)
            )
            if isinstance(llm_text, list):
                llm_text = "".join(str(part) for part in llm_text)
            if not llm_text or not llm_text.strip():
                raise ValueError("Model returned an empty response")
        except Exception as exc:
            logger.exception("Private chat model invocation failed")
            raise ChatModelInvocationError(
                "Không thể nhận phản hồi từ mô hình AI. Vui lòng thử lại."
            ) from exc

        data = dict(result.get("data", {}))
        data["answer_source"] = "llm"
        model_name = getattr(self.llm, "model_name", None) or getattr(
            self.llm, "model", None
        )
        if model_name:
            data["model"] = str(model_name)

        return ChatResponse(
            status="ready",
            answer=llm_text.strip(),
            task_ids=result.get("task_ids", []),
            reference_ids=result.get("reference_ids", []),
            suggested_next_action=result.get("suggested_next_action"),
            data=data,
        )
