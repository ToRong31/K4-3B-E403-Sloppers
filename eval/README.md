# CP3 evaluation — Task Analysis

Mắt xích được đo là quyết định trung tâm:

```text
LAB documents có checkpoint + ref_id
        ↓ live LLM call
ChecklistDraft có task + deliverable + reference
```

## Nội dung

- `golden-set-task-analysis.json`: 20 case theo taxonomy 4 lớp.
- `user-input-grid.md`: các chiều coverage và ma trận case.
- `rubric.md`: định nghĩa pass/fail và cách chấm độc lập.
- `scripts/validate_golden_set.py`: kiểm tra số case và coverage trước khi chạy.
- `scripts/run_live_eval.py`: gửi 20 case vào endpoint AI thật và ghi raw log/kết quả.
- `results/run-1.csv`: bảng kết quả lượt đầu, hiện để `not_run`.

## Coverage hiện tại

| Nhóm | Số case |
|---|---:|
| ① Nguồn sự thật | 5 |
| ② Mơ hồ/thiếu thông tin | 4 |
| ③ Ngoài phạm vi/thẩm quyền | 4 |
| ④ Đặc thù domain | 7 |
| Common | 9 |
| Edge | 8 |
| Rare | 3 |
| Chatlog-derived | 10 |

## Cảnh báo provenance

Workspace không chứa raw chatlog trong `data/`. Mười case `TA-001` đến `TA-010` được phát triển từ 5 mã chatlog đã được ghi trong Canvas: `T10323`, `T10349`, `T10705`, `T11149`, `T11557`.

Các case này đang mang trạng thái:

```text
metadata_only_requires_raw_check
```

Trước khi báo cáo “10 case từ chatlog thật”, nhóm phải mở data pack gốc, đối chiếu từng mã, sửa lại paraphrase nếu cần và đổi `verification` thành `raw_chatlog_verified`. Không được bỏ cảnh báo này hoặc khai đã xác minh khi chưa có file gốc.

## Cách chạy

Kiểm tra cấu trúc golden set:

```bash
python eval/scripts/validate_golden_set.py
```

Chạy prototype bằng provider thật rồi đặt URL endpoint Task Analysis:

```powershell
$env:EVAL_TARGET_URL="http://127.0.0.1:8000/api/v1/labs/analyze"
python eval/scripts/run_live_eval.py
```

Runner ghi:

- request/response thô vào `eval/results/run-1-raw.jsonl`;
- rule results vào `eval/results/run-1.csv`.

Sau lượt chạy, hai người chấm độc lập tối thiểu 5 output bằng rubric. Nếu lệch từ 20% trở lên, sửa rubric trước khi công bố quality bar.

