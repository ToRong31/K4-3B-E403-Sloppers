# Task plan — 3 người, 3 subgraph

Mỗi người sở hữu trọn một luồng để có thể làm song song và giảm conflict. Dữ liệu trong `examples_data/fixtures/` chỉ là mẫu; được phép sửa nội dung cho sát bài LAB thật, nhưng không tự ý đổi field của Pydantic contract nếu chưa thống nhất với cả nhóm.

## Contract chung đã chốt

```text
lab_manifest.json
        ↓
Task Analysis
        ↓
checklist_draft.json
        ↓                  group_snapshot.json
        └──────────────┬───────────────┘
                       ↓
                  Assignment
                       ↓
              assignment_plan.json
                       ↓
                Progress Chat
```

Các contract dùng chung:

- `LabManifest`: LAB, checkpoint, thứ tự, nội dung và `ref_id`.
- `ChecklistDraft`: task đã phân rã, dependency, skill cần thiết và reference.
- `GroupSnapshot`: thành viên và skill tự khai trong phiên.
- `AssignmentPlan`: task-owner draft chờ người dùng xác nhận.
- `PrivateChatContext`: phạm vi chat riêng của user/group/thread.

---

# AI-01 — Phân tích LAB thành checklist

- Owner: **Lâm Hải Dương**
- Size: **Large**
- Subgraph: `src/agent/task_analysis/`
- Branch gợi ý: `feature/task-analysis`

## Yêu cầu bằng ngôn ngữ tự nhiên

Hãy làm luồng nhận dữ liệu của một bài LAB, đọc lần lượt từng checkpoint và phân tích các yêu cầu thành danh sách task có thể thực hiện được. Mỗi task phải nói rõ cần làm gì, đầu ra là gì, khi nào được xem là hoàn thành, cần kỹ năng nào và lấy căn cứ từ đoạn nào trong bài LAB.

Trước tiên dùng `examples_data/fixtures/lab_manifest.json` làm dữ liệu giả. Có thể thay đổi nội dung fixture để giống bài LAB thực tế hơn, thêm checkpoint hoặc thêm requirement, nhưng phải giữ đúng cấu trúc `LabManifest`.

AI không được tự bịa requirement. Nếu dữ liệu thiếu `ref_id`, mâu thuẫn hoặc không đủ để xác định deliverable thì phải trả `clarify`, không cố tạo task.

Kết quả cuối cùng là một `ChecklistDraft` để nhóm xem và xác nhận, chưa tự động trở thành task chính thức.

## Input

```text
examples_data/fixtures/lab_manifest.json
→ LabManifest
→ checkpoints đã sort theo checkpoint_order
→ items đã sort theo item_order
```

## Output

```text
ChecklistDraft
├── checkpoint_id
├── checkpoint_order
└── tasks[]
    ├── task_key và task_order
    ├── title, description, deliverable
    ├── completion_criteria
    ├── required_skills
    ├── depends_on
    └── reference_ids
```

Output mẫu: `examples_data/fixtures/checklist_draft.json`.

## Phần kỹ thuật cần làm

### 1. Mock LAB data

- Rà lại `lab_manifest.json` để có ít nhất hai checkpoint.
- Mỗi checkpoint có tối thiểu hai loại item như requirement, guide hoặc deliverable.
- Mỗi item có `checkpoint_order`, `item_order`, `ref_id` duy nhất.
- Thêm một fixture lỗi thiếu reference để test nhánh `clarify`.

### 2. Tools cho subgraph

Implement hoặc hoàn thiện:

```python
get_lab_manifest(lab_id)
get_lab_checkpoint(lab_id, checkpoint_id, version)
search_lab_context(lab_id, query, checkpoint_id=None)
get_lab_reference(ref_id)
validate_task_draft(lab_manifest, checklist_draft)
calculate_requirement_coverage(lab_manifest, checklist_draft)
```

Trong giai đoạn mock, tools được phép đọc fixture qua repository local. Không hardcode nội dung LAB trong node hoặc prompt.

### 3. Prompt

Hoàn thiện `TASK_ANALYSIS_SYSTEM_PROMPT`:

- Chỉ sử dụng requirement có trong input.
- Mỗi task bắt buộc có ít nhất một `reference_id`.
- Giữ checkpoint và thứ tự.
- Task phải có deliverable và completion criteria kiểm chứng được.
- Không giải bài thay học viên.
- Trả structured output theo `ChecklistDraft`.
- Trả `clarify` khi thiếu nguồn hoặc nguồn mâu thuẫn.

### 4. Subgraph

```text
load_lab
   ↓
validate_sources
   ↓
analyze_each_checkpoint
   ↓
validate_task_draft
   ↓
check_requirement_coverage
   ↓
READY / CLARIFY
```

Model phải lấy từ `build_chat_model()`; không import trực tiếp OpenAI, Anthropic hoặc Gemini trong subgraph.

## Definition of done

- Output validate được bằng `ChecklistDraft`.
- 100% item bắt buộc được ít nhất một task tham chiếu.
- Không có `reference_id` giả hoặc thuộc sai phiên bản LAB.
- Dependency chỉ trỏ đến `task_key` tồn tại.
- Có unit test cho tools.
- Có golden cases: happy path, thiếu reference, requirement mơ hồ và prompt injection.
- Không gọi API model thật trong unit test.

---

# AI-02 — Phân task theo kỹ năng thành viên

- Owner: **Hoàng Quốc Dũng**
- Size: **Medium**
- Subgraph: `src/agent/assignment/`
- Branch gợi ý: `feature/assignment-planner`

## Yêu cầu bằng ngôn ngữ tự nhiên

Hãy làm luồng nhận checklist đã được phân tích và danh sách thành viên cùng kỹ năng họ tự chọn, sau đó đề xuất ai nên làm task nào. Bản phân công phải giải thích ngắn gọn vì sao chọn người đó, ưu tiên skill phù hợp nhưng vẫn cân bằng khối lượng.

Dùng `checklist_draft.json` và `group_snapshot.json` làm dữ liệu giả để phát triển độc lập, không cần chờ Task Analysis hoàn thành. Có thể sửa tên task hoặc skill trong fixture, nhưng output phải đúng `AssignmentPlan`.

AI không được tự suy đoán kỹ năng, đánh giá thành viên hoặc tự xác nhận phân công. Nếu cả nhóm chưa khai skill thì trả `clarify`. Nếu không ai có skill phù hợp, có thể tạm phân theo workload nhưng phải đánh dấu confidence thấp và ghi rõ gap.

## Input

```text
ChecklistDraft + GroupSnapshot
```

## Output

```text
AssignmentPlan[pending_confirmation]
├── task_id
├── owner_id
├── matched_skills
├── reason
├── confidence
└── gaps
```

Output mẫu: `examples_data/fixtures/assignment_plan.json`.

## Phần kỹ thuật cần làm

### 1. Mock team data

- `group_snapshot.json` có ít nhất ba thành viên.
- Mỗi skill có `source=self_declared`.
- Thêm fixture một nhóm chưa ai khai skill.
- Thêm fixture có một task không khớp skill của bất kỳ ai.

### 2. Tools cho subgraph

Implement hoặc hoàn thiện:

```python
get_assignment_context(group_id, checklist_id)
skill_match_score(task, member_skills)
calculate_member_workload(member_id, current_tasks)
score_assignment_candidates(task, members, workload)
validate_assignment_draft(tasks, members, assignments)
save_assignment_draft(group_id, assignment_plan)
```

`save_assignment_draft` chỉ lưu trạng thái `pending_confirmation`; không được tự gọi confirm.

### 3. Prompt

Hoàn thiện `ASSIGNMENT_SYSTEM_PROMPT`:

- Chỉ dùng skill tự khai.
- Không chấm điểm hoặc xếp hạng con người.
- Mỗi task xuất hiện đúng một lần.
- Owner phải thuộc group hiện tại.
- Lý do chỉ dựa trên matched skill, workload hoặc availability.
- Trả gap và confidence thấp nếu không có skill phù hợp.
- Trả `clarify` nếu không có dữ liệu skill tối thiểu.

### 4. Subgraph

```text
load_assignment_context
   ↓
validate_members_and_skills
   ↓
score_candidates
   ↓
build_assignment_draft
   ↓
validate_assignment_draft
   ↓
PENDING_CONFIRMATION / CLARIFY
```

Model phải lấy từ provider factory. Không lưu assignment thành active trước khi user xác nhận.

## Definition of done

- Output validate được bằng `AssignmentPlan`.
- Mỗi task có đúng một owner hợp lệ.
- Không bỏ sót hoặc tạo thêm task.
- Test được trường hợp thiếu skill, workload lệch và task không có skill phù hợp.
- Có lý do và confidence cho từng assignment.
- Unit test không gọi model thật.
- Endpoint hoặc service trả draft để frontend cho nhóm chỉnh sửa/xác nhận.

---

# AI-03 — Bot chat riêng giải thích task và tiến độ

- Owner: **Lê Thị Thùy Trang**
- Size: **Small**
- Subgraph: `src/agent/progress/`
- Branch gợi ý: `feature/private-progress-chat`

## Yêu cầu bằng ngôn ngữ tự nhiên

Hãy hoàn thiện bot chat riêng để một thành viên hỏi: “Tôi cần làm gì?”, “Task này cần làm như thế nào?” hoặc “Nhóm còn bao nhiêu việc?”. Bot chỉ được đọc task thuộc group mà user đang tham gia và phải dẫn nguồn bài LAB khi giải thích yêu cầu.

Dùng `private_chat_context.json`, `checklist_draft.json`, `assignment_plan.json` và `lab_manifest.json` làm dữ liệu giả. Đây là task nhỏ: chưa cần streaming, chưa cần giao diện chat và chưa cho bot tự thay đổi trạng thái task.

Bot phải đọc tiến độ hiện tại từ task data ở mỗi lượt, không tin vào summary cũ. Conversation memory chỉ dùng để hiểu câu hỏi nối tiếp như “còn phần video thì sao?”.

## Input

```text
PrivateChatContext
+ current tasks
+ assignment plan
+ LAB references
+ user question
```

## Output

```text
{
  "status": "ready | clarify",
  "answer": "...",
  "task_ids": ["..."],
  "reference_ids": ["..."],
  "suggested_next_action": "... | null"
}
```

## Phần kỹ thuật cần làm

### 1. Tools cho subgraph

Implement hoặc hoàn thiện:

```python
get_my_tasks(user_id, group_id, tasks, statuses=None)
get_task_context(group_id, task_id)
summarize_team_progress(group_id)
search_lab_context(lab_id, query, checkpoint_id=None)
```

`get_my_tasks` phải giữ thứ tự `(checkpoint_order, task_order)` và tuyệt đối không trả task của user khác.

### 2. Prompt

Hoàn thiện `PROGRESS_BOT_SYSTEM_PROMPT`:

- Trả lời ngắn bằng tiếng Việt.
- Khi giải thích task phải nêu deliverable, completion criteria, dependency và reference.
- Nếu không có nguồn, nói rõ chưa đủ dữ liệu.
- Không tự đổi owner, status hoặc gửi alert.
- Không giải bài thay học viên.
- Không tiết lộ task/chat của group khác hoặc user khác.

### 3. Subgraph

```text
authorize_scope
   ↓
classify_intent
   ├─ my_tasks → get_my_tasks
   ├─ explain  → get_task_context + LAB reference
   ├─ progress → summarize_team_progress
   └─ unknown  → CLARIFY
   ↓
build_grounded_answer
```

## Definition of done

- Trả đúng task của user hiện tại.
- Giải thích task có `reference_ids` thật.
- Tiến độ được tính từ task state mới nhất.
- Có test chặn đọc task của user/group khác.
- Có test câu hỏi nối tiếp dùng cùng `thread_id`.
- Không có mutation tool trong scope task này.

---

# Cách ba người làm song song

```text
Lâm Hải Dương ── lab_manifest fixture ──> ChecklistDraft
                                             │
Hoàng Quốc Dũng ─ checklist fixture ─────────┼─> AssignmentPlan
                                             │
Lê Thị Thùy Trang ─ fixtures có sẵn ─────────┘─> Private Chat response
```

Không cần chờ nhau:

- AI-01 phát triển bằng `lab_manifest.json`.
- AI-02 phát triển bằng `checklist_draft.json` + `group_snapshot.json`.
- AI-03 phát triển bằng toàn bộ fixture output mẫu.

Khi merge, chạy integration theo thứ tự:

```text
LabManifest
→ Task Analysis
→ ChecklistDraft
→ Assignment
→ AssignmentPlan
→ Progress Chat
```

## Quy tắc tránh conflict

- AI-01 chỉ sửa `task_analysis/` và fixture LAB/checklist.
- AI-02 chỉ sửa `assignment/` và fixture group/assignment.
- AI-03 chỉ sửa `progress/` và fixture chat.
- `src/models/`, `prompts.py`, `tools.py` là file dùng chung: nếu phải sửa, tạo commit riêng và báo nhóm trước.
- Không đổi field contract chỉ để phù hợp output model; phải sửa model/prompt/test cùng lúc và có review chéo.
