# CP3 Evaluation

Hệ thống có **hai module quyết định chính**, mỗi module có một golden set độc lập:

```text
LAB documents -> Task Analysis -> ChecklistDraft
ChecklistDraft + member skills -> Assignment -> AssignmentDraft
```

## Hai golden set chính

| Module | Dataset | Số case | Runner | Kết quả |
|---|---|---:|---|---|
| Task Analysis | `golden-set-task-analysis.json` | 20 | `scripts/run_live_eval.py` | `results/task-analysis-run-1.csv` |
| Assignment | `golden-set-assignment.json` | 20 | `codebase/backend/eval/scripts/run_eval.py` | `results/assignment-run-1.csv` |

Cả hai bộ đều có cấu trúc coverage giống nhau:

- 5 case nguồn sự thật;
- 4 case mơ hồ hoặc thiếu thông tin;
- 4 case ngoài phạm vi hoặc thẩm quyền;
- 7 case đặc thù domain;
- 9 case thường gặp, 8 case biên và 3 case hiếm.

## Tài liệu chấm

| Module | User Input Grid | Rubric |
|---|---|---|
| Task Analysis | `user-input-grid.md` | `rubric.md` |
| Assignment | `assignment-user-input-grid.md` | `assignment-rubric.md` |

## Kiểm tra cấu trúc và trạng thái nộp

```powershell
python eval/scripts/validate_golden_set.py
python eval/scripts/validate_golden_set.py --submission-ready
```

Lệnh đầu kiểm tra số case và coverage. Lệnh thứ hai còn yêu cầu mỗi golden set có ít nhất 10 case đã được đối chiếu raw chatlog thật trong `data/`.

Không được đổi `verification` thành `raw_chatlog_verified` nếu chưa mở raw chatlog và kiểm tra nội dung. Mỗi case đã xác minh phải có `raw_path` trỏ đến file tồn tại trong repository.

## Chạy hai live API eval

Khởi động API có endpoint AI thật, sau đó:

```powershell
python eval/scripts/run_live_eval.py
```

Lệnh trên chạy tuần tự:

1. Task Analysis qua `/api/v1/labs/analyze`;
2. Assignment qua `/api/v1/assignments/assign_tasks`.

Có thể override URL bằng `EVAL_TARGET_URL` và `EVAL_ASSIGNMENT_TARGET_URL`. Runner ghi request/response API thô và CSV kết quả riêng cho từng module vào `eval/results/`.

## Chạy Assignment

```powershell
cd codebase/backend
python -m eval.scripts.run_eval
```

Runner kiểm tra đúng owner, warning, lý do, workload balance và ranh giới quyền hạn. Đây là golden set chính dù implementation hiện tại còn rule-based; để chứng minh năng lực AI của module này, nhóm phải nối lời gọi model thật và lưu prompt/raw response.

## Chấm tay

Trước khi công bố tỷ lệ đạt:

1. Chạy tay 10–20 input và phân loại `usable`, `fixable`, `unacceptable`.
2. Hai thành viên chấm độc lập cùng ít nhất 5 output.
3. Nếu lệch từ 20% trở lên, sửa rubric rồi chấm lại.
4. Giữ nguyên case fail và phân tích nguyên nhân; không chỉnh expected để ép pass.

## Trạng thái provenance hiện tại

- Commit-safe provenance extract: `data/chatlog_eval_sources.json` gồm 10 turn đã bỏ student ID và timestamp.
- Raw source đầy đủ: `codebase/backend/data/raw_chatlog/tutor_turns.csv` được giữ local và bỏ qua bởi Git vì dung lượng và quyền riêng tư.
- Task Analysis: 10 case `chatlog_derived`, đã đối chiếu `turn_id` và `raw_path`.
- Assignment: 10 case `chatlog_derived`; task/deliverable lấy từ chatlog, member và skill profile là biến thể tổng hợp được ghi rõ trong `derivation_note`.
- `python eval/scripts/validate_golden_set.py --submission-ready` hiện phải trả `READY` cho cả hai bộ.

Raw chatlog chỉ dùng làm nguồn tình huống thực tế. Không dùng câu trả lời cũ của tutor làm nguồn sự thật cho LAB nếu chưa đối chiếu tài liệu LAB chính thức.
