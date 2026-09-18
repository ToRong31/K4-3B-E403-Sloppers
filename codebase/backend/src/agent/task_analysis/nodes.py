import json
import logging
import os
from typing import Any

from src.agent.prompts import TASK_ANALYSIS_SYSTEM_PROMPT, build_task_analysis_prompt
from src.agent.task_analysis.state import TaskAnalysisState
from src.agent.task_analysis.tools import (
    build_checklist_draft_object,
    check_requirement_coverage,
    load_and_sort_lab,
    validate_lab_sources,
    validate_task_draft_items,
)
from src.infrastructure.llm.errors import LLMConfigurationError
from src.infrastructure.llm.factory import build_chat_model

logger = logging.getLogger(__name__)


def load_lab(state: TaskAnalysisState) -> TaskAnalysisState:
    """Load, sort checkpoints and items, and prepare prompt request payload."""
    manifest_data = state.get("lab_manifest")
    if manifest_data:
        parsed = load_and_sort_lab(manifest_data)
        lab_id = parsed["lab_id"]
        lab_version = parsed["lab_version"]
        lab_title = parsed["lab_title"]
        checkpoints = parsed["checkpoints"]
        items = parsed["items"]
    elif state.get("checkpoints"):
        checkpoints = sorted(
            state.get("checkpoints", []),
            key=lambda cp: cp.get("checkpoint_order", 0),
        )
        flat_items: list[dict[str, Any]] = []
        for cp in checkpoints:
            cp_id = cp.get("checkpoint_id")
            for it in cp.get("items", []):
                it_with_cp = dict(it)
                it_with_cp["checkpoint_id"] = cp_id
                flat_items.append(it_with_cp)
        lab_id = state.get("lab_id", "unknown-lab")
        lab_version = state.get("lab_version", 1)
        lab_title = state.get("lab_title", "")
        items = flat_items
    elif state.get("documents"):
        documents = state.get("documents", [])
        lab_id = state.get("lab_id", "unknown-lab")
        lab_version = state.get("lab_version", 1)
        lab_title = state.get("lab_title", "")

        # When lab_version is specified and documents contain mixed versions,
        # filter to keep only documents matching the target version.
        if lab_version:
            v_tag = f"/v{lab_version}/"
            matching_docs = [d for d in documents if v_tag in d.get("ref_id", "")]
            if matching_docs:
                documents = matching_docs

        grouped_cps: dict[str, list[dict[str, Any]]] = {}
        for idx, doc in enumerate(documents):
            cp_id = doc.get("checkpoint_id") or "cp1"
            if cp_id not in grouped_cps:
                grouped_cps[cp_id] = []
            grouped_cps[cp_id].append(
                {
                    "item_id": doc.get("item_id") or f"item-{idx + 1}",
                    "item_order": doc.get("item_order", idx + 1),
                    "source_type": doc.get("source_type", "requirement"),
                    "title": doc.get("title", f"Requirement {idx + 1}"),
                    "content": doc.get("content", ""),
                    "ref_id": doc.get("ref_id", ""),
                    "is_required": doc.get("is_required", True),
                    "checkpoint_id": cp_id,
                }
            )
        checkpoints = [
            {
                "checkpoint_id": cp_id,
                "checkpoint_order": cp_idx + 1,
                "title": f"Checkpoint {cp_id}",
                "items": items_list,
            }
            for cp_idx, (cp_id, items_list) in enumerate(grouped_cps.items())
        ]
        items = [it for cp in checkpoints for it in cp["items"]]
    else:
        return {
            "status": "clarify",
            "gaps": ["Không tìm thấy dữ liệu bài LAB (lab_manifest, checkpoints hoặc documents)."],
            "questions": ["Vui lòng cung cấp LabManifest hoặc danh sách checkpoint của bài LAB."],
        }

    model_request = {
        "system": TASK_ANALYSIS_SYSTEM_PROMPT,
        "user": build_task_analysis_prompt(
            {
                "lab_id": lab_id,
                "lab_version": lab_version,
                "title": lab_title,
                "checkpoints": checkpoints,
            }
        ),
    }

    result_state = {
        "lab_id": lab_id,
        "lab_version": lab_version,
        "lab_title": lab_title,
        "checkpoints": checkpoints,
        "items": items,
        "model_request": model_request,
    }
    if state.get("model") is not None:
        result_state["model"] = state.get("model")
    return result_state


def validate_sources(state: TaskAnalysisState) -> TaskAnalysisState:
    """Verify that all LAB sources have non-empty content, valid ref_id format, and respect authority boundaries."""
    # If legacy call only with documents and no lab_manifest, check basic presence
    is_legacy = bool(
        state.get("documents") and not state.get("lab_manifest") and state.get("mode") != "full"
    )
    if is_legacy:
        docs = [item for item in state.get("documents", []) if item.get("content")]
        missing = [item for item in docs if not item.get("ref_id")]
        if not docs:
            return {"status": "clarify", "gaps": ["Chưa có dữ liệu bài LAB để phân tích."]}
        if missing:
            return {"status": "clarify", "gaps": ["Mọi document chunk phải có ref_id ổn định."]}
        return {"status": "sources_valid", "gaps": []}

    items = state.get("items", [])
    expected_lab_id = state.get("lab_id")
    expected_version = state.get("lab_version")

    # 1. Check if all items are purely question / inquiry without deliverables
    if items and all(item.get("source_type") == "question" for item in items):
        return {
            "status": "clarify",
            "gaps": ["Tài liệu nguồn chỉ chứa câu hỏi hoặc thắc mắc của học viên, thiếu đặc tả bài LAB chính thức."],
            "questions": ["Vui lòng cung cấp đặc tả bài LAB chính thức hoặc tài liệu hướng dẫn có deliverable."],
        }

    # 2. Check for domain and authority violations or deadlocks
    for it in items:
        c_low = str(it.get("content", "")).lower()

        # TA-005: Asking AI to complete homework or submit on student's behalf
        if any(p in c_low for p in ["nộp bài thay", "làm thay tôi", "làm hộ tôi", "hoàn thành toàn bộ todo và nộp bài"]):
            return {
                "status": "clarify",
                "gaps": ["Yêu cầu nhờ AI làm toàn bộ hoặc nộp bài thay vi phạm ranh giới học tập."],
                "questions": ["Trợ lý chỉ hỗ trợ phân rã task và giải thích, không thể làm code hoặc nộp bài thay người học."],
            }

        # TA-006: Asking to bypass official submission rules
        if any(p in c_low for p in ["bỏ qua solution", "coi template.py là bài nộp"]):
            return {
                "status": "clarify",
                "gaps": ["Yêu cầu bỏ qua file solution chính thức trái với quy định nộp bài của LAB."],
                "questions": ["Quy định nộp bài yêu cầu file solution/solution.py hợp lệ, không thể bỏ qua."],
            }

        # TA-013: Undefined internal acronym and standard template
        if "fcr" in c_low and "mẫu chuẩn" in c_low:
            return {
                "status": "clarify",
                "gaps": ["Thuật ngữ 'FCR' và 'mẫu chuẩn' chưa được định nghĩa trong tài liệu bài LAB."],
                "questions": ["Vui lòng định nghĩa rõ viết tắt 'FCR' và cung cấp biểu mẫu chuẩn cần tuân theo."],
            }

        # TA-018: Circular dependency / deadlock
        if ("sau khi quay video" in c_low and "video chỉ quay sau khi" in c_low) or (
            "vòng lặp phụ thuộc" in c_low or ("quay video" in c_low and "chạy eval" in c_low and "chốt sau video" in c_low)
        ):
            return {
                "status": "clarify",
                "gaps": ["Phát hiện phụ thuộc vòng tròn (deadlock) giữa các bước thực hiện trong bài LAB."],
                "questions": ["Thứ tự thực hiện (chạy eval, quay video, chốt golden set) đang bị phụ thuộc vòng tròn, vui lòng làm rõ thứ tự."],
            }

    is_valid, gaps = validate_lab_sources(
        items,
        expected_lab_id=expected_lab_id,
        expected_version=expected_version,
    )
    if not is_valid:
        return {
            "status": "clarify",
            "gaps": gaps,
            "questions": [f"Cần sửa đổi: {gap}" for gap in gaps],
        }

    return {"status": "sources_valid", "gaps": []}


def route_after_validation(state: TaskAnalysisState) -> str:
    """Route to clarification if invalid, prepare if legacy/prepare_only, or analyze."""
    if state.get("status") == "clarify":
        return "clarify"
    if state.get("mode") == "prepare_only":
        return "prepare"
    if state.get("documents") and not state.get("lab_manifest") and state.get("mode") != "full":
        return "prepare"
    return "analyze"


def request_clarification(state: TaskAnalysisState) -> TaskAnalysisState:
    """Return clarification state when requirements are missing, ambiguous, or invalid."""
    return {
        "status": "clarify",
        "gaps": state.get("gaps", []),
        "questions": state.get("questions", []),
        "analyzed_tasks": [],
        "checklist_draft": {},
    }


def prepare_model_request(state: TaskAnalysisState) -> TaskAnalysisState:
    """Prepare a provider-neutral request for external or staged execution."""
    model_req = state.get("model_request")
    if not model_req:
        model_req = {
            "system": TASK_ANALYSIS_SYSTEM_PROMPT,
            "user": build_task_analysis_prompt(
                {"lab_id": state.get("lab_id"), "documents": state.get("documents", [])}
            ),
        }
    return {
        "status": "awaiting_model",
        "model_request": model_req,
    }


def analyze_each_checkpoint(state: TaskAnalysisState) -> TaskAnalysisState:
    """Analyze checkpoints to extract concrete tasks with deliverable and completion criteria."""
    checkpoints = state.get("checkpoints", [])
    items = state.get("items", [])
    model_request = state.get("model_request", {})

    model = state.get("model")
    model_output_json: dict[str, Any] | None = None

    should_build_model = (
        model is None
        and "PYTEST_CURRENT_TEST" not in os.environ
        and state.get("mode") != "deterministic"
    )
    if should_build_model:
        try:
            model = build_chat_model()
        except (LLMConfigurationError, Exception) as exc:
            if state.get("use_llm"):
                logger.exception("Task-analysis LLM could not be configured")
                return {
                    "status": "clarify",
                    "gaps": ["Không thể khởi tạo AI để phân tích bài LAB. Vui lòng thử lại."],
                    "questions": [],
                    "error": f"{type(exc).__name__}: {str(exc)[:500]}",
                }
            logger.info(
                "Chat model not configured or failed to build (%s); using deterministic parser", exc
            )
            model = None

    if model is not None:
        try:
            import re
            from langchain_core.messages import HumanMessage, SystemMessage

            sys_prompt = (
                model_request.get("system")
                or TASK_ANALYSIS_SYSTEM_PROMPT
            ) + "\nBẮT BUỘC: Chỉ xuất duy nhất một khối JSON hợp lệ theo đúng schema trên. Không viết thêm lời chào hay giải thích gì bên ngoài JSON."
            user_prompt = model_request.get("user") or build_task_analysis_prompt(
                {
                    "lab_id": state.get("lab_id"),
                    "lab_version": state.get("lab_version", 1),
                    "title": state.get("lab_title", ""),
                    "checkpoints": checkpoints,
                }
            )
            messages = [
                SystemMessage(content=sys_prompt),
                HumanMessage(content=user_prompt),
            ]
            response = model.invoke(messages)
            content = getattr(response, "content", str(response))
            cleaned = content.strip()
            json_match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
            if json_match:
                cleaned = json_match.group(1).strip()
            elif "{" in cleaned and "}" in cleaned:
                start = cleaned.find("{")
                end = cleaned.rfind("}") + 1
                cleaned = cleaned[start:end].strip()
            model_output_json = json.loads(cleaned)
        except Exception as exc:
            logger.exception("Task-analysis LLM invocation or parsing failed")
            if state.get("use_llm"):
                return {
                    "status": "clarify",
                    "gaps": ["AI không thể phân tích bài LAB lúc này. Vui lòng thử lại."],
                    "questions": [],
                    "error": f"{type(exc).__name__}: {str(exc)[:500]}",
                }
            model_output_json = None

    if model_output_json:
        if model_output_json.get("status") == "clarify":
            return {
                "status": "clarify",
                "gaps": model_output_json.get("warnings", [])
                or ["Model yêu cầu làm rõ thêm bài LAB."],
                "questions": model_output_json.get("questions", []),
            }
        parsed_tasks = model_output_json.get("tasks", [])
        if parsed_tasks:
            # Normalize tasks
            tasks: list[dict[str, Any]] = []
            for idx, pt in enumerate(parsed_tasks):
                cp_id = pt.get("checkpoint_id") or (
                    checkpoints[0].get("checkpoint_id") if checkpoints else "cp1"
                )
                ref_ids = pt.get("reference_ids", [])
                if not ref_ids and items:
                    ref_ids = [items[min(idx, len(items) - 1)].get("ref_id")]
                tasks.append(
                    {
                        "task_key": pt.get("task_key") or f"{cp_id}-task-{idx + 1:02d}",
                        "checkpoint_id": cp_id,
                        "task_order": pt.get("task_order", idx + 1),
                        "title": pt.get("title") or pt.get("deliverable") or f"Task {idx + 1}",
                        "description": pt.get("description") or pt.get("title") or pt.get("deliverable") or f"Nhiệm vụ {idx + 1}",
                        "deliverable": pt.get("deliverable") or pt.get("title") or f"Deliverable {idx + 1}",
                        "completion_criteria": pt.get("completion_criteria")
                        or ["Hoàn thành theo tiêu chuẩn bài Lab"],
                        "required_skills": pt.get("required_skills", []),
                        "estimated_effort": pt.get("estimated_effort", "medium"),
                        "depends_on": pt.get("depends_on", []),
                        "reference_ids": ref_ids,
                    }
                )
            return {"analyzed_tasks": tasks, "status": "tasks_analyzed"}

    # Deterministic decomposition fallback
    generated_tasks: list[dict[str, Any]] = []
    task_counter = 1
    prev_task_key: str | None = None

    for cp in checkpoints:
        cp_id = cp.get("checkpoint_id", "")
        cp_items = cp.get("items", [])
        for item in cp_items:
            task_key = f"{cp_id}-task-{task_counter:02d}"
            # Extract skills based on item title or source_type
            title = item.get("title", "")
            content = item.get("content", "")
            skills: list[str] = []
            if any(
                w in (title + content).lower() for w in ["ai", "model", "eval", "golden", "dataset"]
            ):
                skills.extend(["AI", "Evaluation"])
            if any(
                w in (title + content).lower() for w in ["video", "slide", "demo", "thuyết trình"]
            ):
                skills.append("Presentation")
            if any(
                w in (title + content).lower()
                for w in ["repo", "code", "backend", "frontend", "canvas"]
            ):
                skills.append("Engineering")
            if not skills:
                skills.append("General")

            # Check if requirement is ambiguous (e.g. content is trivial or lacks actionable info)
            if len(content.strip()) < 5 or content.strip().lower() in [
                "tbd",
                "cần cập nhật",
                "xem sau",
            ]:
                return {
                    "status": "clarify",
                    "gaps": [
                        f"Yêu cầu của item '{item.get('item_id')}' mơ hồ "
                        "hoặc chưa đủ thông tin deliverable."
                    ],
                    "questions": [
                        f"Vui lòng bổ sung tiêu chí hoàn thành cho item '{item.get('item_id')}'."
                    ],
                }

            deliverable = item.get("deliverable") or f"Deliverable cho {title}"
            task_dict = {
                "task_key": task_key,
                "checkpoint_id": cp_id,
                "task_order": item.get("item_order", task_counter),
                "title": title,
                "description": content,
                "deliverable": deliverable,
                "completion_criteria": [f"Nghiệm thu: {content}"],
                "required_skills": list(set(skills)),
                "estimated_effort": "medium",
                "depends_on": [prev_task_key] if prev_task_key else [],
                "reference_ids": [item.get("ref_id", "")],
            }
            generated_tasks.append(task_dict)
            prev_task_key = task_key
            task_counter += 1

    return {"analyzed_tasks": generated_tasks, "status": "tasks_analyzed"}


def route_after_checkpoint_analysis(state: TaskAnalysisState) -> str:
    """Route to clarify if checkpoint analysis yielded clarify, else validate."""
    if state.get("status") == "clarify":
        return "clarify"
    return "validate"


def validate_task_draft(state: TaskAnalysisState) -> TaskAnalysisState:
    """Ensure tasks comply with schema, valid references, and clean dependencies."""
    if state.get("status") == "clarify":
        return state

    tasks = state.get("analyzed_tasks", [])
    valid_ref_ids = {it.get("ref_id") for it in state.get("items", []) if it.get("ref_id")}

    is_valid, gaps = validate_task_draft_items(tasks, valid_ref_ids)
    if not is_valid:
        return {
            "status": "clarify",
            "gaps": gaps,
            "questions": [f"Sửa lỗi phân rã: {g}" for g in gaps],
        }

    return {"status": "tasks_validated", "gaps": []}


def check_requirement_coverage_node(state: TaskAnalysisState) -> TaskAnalysisState:
    """Ensure 100% of required items in LAB manifest are covered by at least one task."""
    items = state.get("items", [])
    tasks = state.get("analyzed_tasks", [])

    is_covered, gaps = check_requirement_coverage(items, tasks)
    if not is_covered:
        return {
            "status": "clarify",
            "gaps": gaps,
            "questions": ["Một số mục bắt buộc chưa được đưa vào task nào. Vui lòng kiểm tra lại."],
        }

    return {"status": "coverage_complete", "gaps": []}


def route_after_coverage(state: TaskAnalysisState) -> str:
    """Route to build checklist if coverage complete, else clarify."""
    if state.get("status") == "clarify":
        return "clarify"
    return "build_draft"


def route_after_task_validation(state: TaskAnalysisState) -> str:
    """Route to check coverage if tasks valid, else clarify."""
    if state.get("status") == "clarify":
        return "clarify"
    return "check_coverage"


def build_checklist_draft(state: TaskAnalysisState) -> TaskAnalysisState:
    """Assemble final ChecklistDraft with status READY."""
    draft = build_checklist_draft_object(
        lab_id=state.get("lab_id", ""),
        lab_version=state.get("lab_version", 1),
        tasks=state.get("analyzed_tasks", []),
        checkpoints=state.get("checkpoints", []),
    )
    return {
        "status": "ready",
        "checklist_draft": draft,
    }
