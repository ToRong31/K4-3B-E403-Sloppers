import logging
from typing import Any

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


def _load_default_documents(lab_id: str) -> list[dict[str, Any]]:
    return [
        {
            "lab_id": lab_id,
            "checkpoint_id": "cp1",
            "ref_id": "lab://K4-L3B-DAY05-06/v1/cp1/item-1",
            "title": "Canvas 7 dòng",
            "content": (
                "Hoàn thành Canvas 7 dòng: Track đề bài, Job executor, Pain 1 câu, "
                "Bằng chứng đầu, Lát cắt 1 câu, Ranh giới AI, Phân công có tên."
            ),
        },
        {
            "lab_id": lab_id,
            "checkpoint_id": "cp2",
            "ref_id": "lab://K4-L3B-DAY05-06/v1/cp2/item-1",
            "title": "Flow & Mockup sản phẩm",
            "content": (
                "Thiết kế flow trải nghiệm người dùng và mockup UI/UX có thể "
                "tương tác được (Figma / HTML)."
            ),
        },
        {
            "lab_id": lab_id,
            "checkpoint_id": "cp3",
            "ref_id": "lab://K4-L3B-DAY05-06/v1/cp3/item-1",
            "title": "Golden Set & AI Rubric",
            "content": (
                "Chuẩn bị ít nhất 20 test case đa dạng và xây dựng AI Rubric "
                "để kiểm thử độ chính xác."
            ),
        },
        {
            "lab_id": lab_id,
            "checkpoint_id": "cp4",
            "ref_id": "lab://K4-L3B-DAY05-06/v1/cp4/item-1",
            "title": "Evidence Log 20 Users",
            "content": (
                "Khảo sát thực tế ít nhất 20 người dùng mục tiêu, trích dẫn "
                "ít nhất 5 quote nguyên văn."
            ),
        },
        {
            "lab_id": lab_id,
            "checkpoint_id": "cp5",
            "ref_id": "lab://K4-L3B-DAY05-06/v1/cp5/item-1",
            "title": "Slide & Presentation Demo",
            "content": (
                "Tổng hợp slide thuyết trình và chuẩn bị kịch bản demo sản phẩm "
                "trước hội đồng chấm thi."
            ),
        },
    ]


class ChatService:
    def __init__(self, graph: Any, llm: Any = None) -> None:
        self.graph = graph
        self.llm = llm

    def process_message(self, request: ChatRequest) -> ChatResponse:
        group_id = request.group_id or "Sloppers"
        user_id = request.user_id or "Trọng"
        lab_id = request.lab_id or "K4-L3B-DAY05-06-MINI-HACKATHON"

        tasks = _normalize_tasks(request.tasks, group_id)
        documents = (
            request.documents
            if request.documents is not None
            else _load_default_documents(lab_id)
        )
        state = {
            "user_id": user_id,
            "group_id": group_id,
            "thread_id": request.thread_id or "thread-1",
            "lab_id": lab_id,
            "question": request.message,
            "task_id": request.task_id,
            "tasks": tasks,
            "documents": documents,
        }
        result = self.graph.invoke(state)

        if self.llm is None:
            raise ChatModelInvocationError("Trợ lý AI chưa được cấu hình.")

        try:
            from langchain_core.messages import HumanMessage, SystemMessage

            my_tasks = [
                task
                for task in tasks
                if (task.get("owner_id") or task.get("owner")) == user_id
            ]
            task_lines = []
            for task in my_tasks:
                criteria = "; ".join(task.get("completion_criteria", [])) or "chưa có"
                dependencies = ", ".join(task.get("depends_on", [])) or "không có"
                task_lines.append(
                    f"- [{task.get('status', 'todo').upper()}] {task.get('title')}\n"
                    f"  Đầu ra: {task.get('deliverable', 'N/A')}\n"
                    f"  Tiêu chí hoàn thành: {criteria}\n"
                    f"  Phụ thuộc: {dependencies}"
                )
            tasks_summary = "\n".join(task_lines) or "- Chưa có task nào được giao."
            system_prompt = (
                "Bạn là Trợ lý Lab AI 1:1 của VLearn LabSpace.\n"
                "Bạn hỗ trợ học viên trong bài Mini Hackathon Day 5-6.\n\n"
                "NGỮ CẢNH ĐƯỢC PHÉP:\n"
                f"- Học viên: {user_id}\n"
                f"- Nhóm: {group_id}\n"
                f"- Số task của học viên: {len(my_tasks)}\n"
                f"- Task thực tế được giao cho học viên:\n{tasks_summary}\n\n"
                "QUY TẮC:\n"
                "1. Trả lời bằng tiếng Việt, súc tích và thực tế.\n"
                "2. Chỉ dựa trên ngữ cảnh được cung cấp; không bịa dữ liệu.\n"
                "3. Không tự đổi owner, trạng thái task hoặc checklist canonical.\n"
                "4. Nếu thiếu dữ liệu, nói rõ cần bổ sung gì.\n"
                "5. Không giải hộ toàn bộ bài; chỉ hướng dẫn cách thực hiện."
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
