from typing import Any

from src.models.schemas import ChatRequest, ChatResponse


def _load_default_tasks(group_id: str) -> list[dict[str, Any]]:
    return [
        {
            "id": "task-cp1",
            "group_id": group_id,
            "owner_id": "Trọng",
            "checkpoint_order": 1,
            "task_order": 1,
            "title": "Canvas 7 dòng & Kế hoạch sản phẩm",
            "status": "done",
            "deliverable": "Canvas 7 dòng và spec sản phẩm VLearn LabSpace",
            "completion_criteria": ["Đầy đủ 7 dòng", "Chỉ rõ job executor và willing users"],
            "depends_on": [],
            "reference_ids": ["lab://K4-L3B-DAY05-06/v1/cp1/item-1"],
        },
        {
            "id": "task-cp2",
            "group_id": group_id,
            "owner_id": "Trang",
            "checkpoint_order": 2,
            "task_order": 1,
            "title": "Thiết kế Flow & Mockup giao diện",
            "status": "done",
            "deliverable": "Mockup VLearn LabSpace & Discord sidebar",
            "completion_criteria": ["Giao diện bấm được", "Role switcher và chat sidebar"],
            "depends_on": ["task-cp1"],
            "reference_ids": ["lab://K4-L3B-DAY05-06/v1/cp2/item-1"],
        },
        {
            "id": "task-cp3",
            "group_id": group_id,
            "owner_id": "Dương",
            "checkpoint_order": 3,
            "task_order": 1,
            "title": "Golden Set Benchmark & AI Rubric",
            "status": "todo",
            "deliverable": "eval/datasets/golden_set_20_cases.jsonl",
            "completion_criteria": ["Tối thiểu 20 test case", "Đủ rubric chấm pass/fail"],
            "depends_on": ["task-cp1"],
            "reference_ids": ["lab://K4-L3B-DAY05-06/v1/cp3/item-1"],
        },
        {
            "id": "task-cp4",
            "group_id": group_id,
            "owner_id": "Dũng",
            "checkpoint_order": 4,
            "task_order": 1,
            "title": "Evidence Log & Docker Backend",
            "status": "todo",
            "deliverable": "evidence/evidence_log_20_users.csv",
            "completion_criteria": ["Khảo sát tối thiểu 20 học viên", "Evidence quotes thực tế"],
            "depends_on": ["task-cp2"],
            "reference_ids": ["lab://K4-L3B-DAY05-06/v1/cp4/item-1"],
        },
        {
            "id": "task-cp5",
            "group_id": group_id,
            "owner_id": "Trọng",
            "checkpoint_order": 5,
            "task_order": 1,
            "title": "Slide thuyết trình & Demo cuối ngày",
            "status": "todo",
            "deliverable": "presentation/slides.pdf",
            "completion_criteria": ["Demo thực tế 3 phút", "Slide trình bày trước hội đồng"],
            "depends_on": ["task-cp1", "task-cp2", "task-cp3", "task-cp4"],
            "reference_ids": ["lab://K4-L3B-DAY05-06/v1/cp5/item-1"],
        },
    ]


def _load_default_documents(lab_id: str) -> list[dict[str, Any]]:
    return [
        {
            "lab_id": lab_id,
            "checkpoint_id": "cp1",
            "ref_id": "lab://K4-L3B-DAY05-06/v1/cp1/item-1",
            "title": "Canvas 7 dòng",
            "content": "Hoàn thành Canvas 7 dòng: Track đề bài, Job executor, Pain 1 câu, Bằng chứng đầu, Lát cắt 1 câu, Ranh giới AI, Phân công có tên.",
        },
        {
            "lab_id": lab_id,
            "checkpoint_id": "cp2",
            "ref_id": "lab://K4-L3B-DAY05-06/v1/cp2/item-1",
            "title": "Flow & Mockup sản phẩm",
            "content": "Thiết kế flow trải nghiệm người dùng và mockup UI/UX có thể tương tác được (Figma / HTML).",
        },
        {
            "lab_id": lab_id,
            "checkpoint_id": "cp3",
            "ref_id": "lab://K4-L3B-DAY05-06/v1/cp3/item-1",
            "title": "Golden Set & AI Rubric",
            "content": "Chuẩn bị ít nhất 20 test case đa dạng và xây dựng AI Rubric để kiểm thử độ chính xác.",
        },
        {
            "lab_id": lab_id,
            "checkpoint_id": "cp4",
            "ref_id": "lab://K4-L3B-DAY05-06/v1/cp4/item-1",
            "title": "Evidence Log 20 Users",
            "content": "Khảo sát thực tế ít nhất 20 người dùng mục tiêu, trích dẫn ít nhất 5 quote nguyên văn.",
        },
        {
            "lab_id": lab_id,
            "checkpoint_id": "cp5",
            "ref_id": "lab://K4-L3B-DAY05-06/v1/cp5/item-1",
            "title": "Slide & Presentation Demo",
            "content": "Tổng hợp slide thuyết trình và chuẩn bị kịch bản demo sản phẩm trước hội đồng chấm thi.",
        },
    ]


class ChatService:
    def __init__(self, graph: Any) -> None:
        self.graph = graph

    def process_message(self, request: ChatRequest) -> ChatResponse:
        group_id = request.group_id or "Sloppers"
        user_id = request.user_id or "Trọng"
        lab_id = request.lab_id or "K4-L3B-DAY05-06-MINI-HACKATHON"

        tasks = request.tasks if request.tasks is not None else _load_default_tasks(group_id)
        documents = request.documents if request.documents is not None else _load_default_documents(lab_id)

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

        answer = result.get("answer", "")
        status = result.get("status", "ready")
        task_ids = result.get("task_ids", [])
        reference_ids = result.get("reference_ids", [])
        suggested_next_action = result.get("suggested_next_action")
        data = result.get("data", {})

        # If clarify on general questions, provide contextual lab knowledge
        lower_q = request.message.lower()
        if status == "clarify":
            if any(k in lower_q for k in ("nộp gì", "cần nộp", "deliverable", "checklist", "danh sách")):
                answer = (
                    "**Danh sách 5 Deliverables chính thức của Mini Hackathon Day 5-6:**\n"
                    "1. **CP1: Canvas 7 dòng** (Định vị bài toán, người dùng, giá trị cốt lõi)\n"
                    "2. **CP2: Flow & Mockup sản phẩm** (Wireframe tương tác bấm được)\n"
                    "3. **CP3: Golden Set & AI Rubric** (Tối thiểu 20 prompt test chuẩn + rubric)\n"
                    "4. **CP4: Evidence Log** (Khảo sát ≥20 học viên + 5 quote trích dẫn nguyên văn)\n"
                    "5. **CP5: Slide & Demo** (Thuyết trình nghiệm thu cuối ngày)\n\n"
                    "Hạn chót hoàn thành và nộp repo là trước **17:30 ngày Day 6**!"
                )
                status = "ready"
                reference_ids = ["lab://K4-L3B-DAY05-06/v1/cp1/item-1", "lab://K4-L3B-DAY05-06/v1/cp3/item-1"]
                suggested_next_action = "Kiểm tra tiến độ từng deliverable bằng cách hỏi 'Tiến độ nhóm thế nào?'."
            elif any(k in lower_q for k in ("checkpoint 1", "cp1")):
                answer = (
                    "**Hướng dẫn Checkpoint 1 (Canvas 7 dòng):**\n"
                    "- Hoàn thiện 7 dòng định vị sản phẩm theo mẫu quy định.\n"
                    "- Nhóm trưởng (Trọng) kích hoạt **AI Task Planner** để phân công nhiệm vụ cho Trang, Dương, Dũng.\n"
                    "- Xác nhận và công khai link repository GitHub của nhóm."
                )
                status = "ready"
                reference_ids = ["lab://K4-L3B-DAY05-06/v1/cp1/item-1"]
            elif any(k in lower_q for k in ("checkpoint 3", "cp3", "golden set")):
                answer = (
                    "**Tiêu chuẩn Checkpoint 3 (Golden Set & AI Rubric):**\n"
                    "- Xây dựng bộ test tối thiểu **20 prompt test** (bao gồm câu hỏi dễ, khó và câu bẫy edge-case).\n"
                    "- Tiêu chí rubric: Tính chính xác (≥85%), tuân thủ format, thời gian phản hồi.\n"
                    "- File kết quả lưu tại `eval/datasets/golden_set_20_cases.jsonl`."
                )
                status = "ready"
                reference_ids = ["lab://K4-L3B-DAY05-06/v1/cp3/item-1"]

        return ChatResponse(
            status=status,
            answer=answer,
            task_ids=task_ids,
            reference_ids=reference_ids,
            suggested_next_action=suggested_next_action,
            data=data,
        )
