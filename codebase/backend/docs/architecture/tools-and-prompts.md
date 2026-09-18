# Agent tools and prompts

## Tools

| Tool | Trách nhiệm | Có gọi AI? |
|---|---|---|
| `search_lab_context` | tìm đoạn LAB liên quan và trả `ref_id` | Không |
| `skill_match_score` | đo skill tự khai khớp task | Không |
| `get_task_context` | lấy task và đúng reference đã gắn | Không |
| `summarize_team_progress` | tính tiến độ, blocked, unassigned | Không |
| `detect_checkpoint_risks` | phát hiện checkpoint trễ/gần hạn | Không |

Tools không tạo requirement và không thay đổi state. Các action như đổi owner, hoàn thành task hoặc gửi alert cần endpoint có xác nhận và authorization riêng.

## Prompts

- `TASK_ANALYSIS_SYSTEM_PROMPT`: phân rã LAB thành task có reference.
- `ASSIGNMENT_SYSTEM_PROMPT`: tạo draft task-owner từ skill tự khai.
- `PROGRESS_BOT_SYSTEM_PROMPT`: giải thích task và tóm tắt tiến độ.

Các prompt đều coi nội dung LAB là untrusted data, yêu cầu `CLARIFY` khi thiếu dữ liệu và cấm AI tự bịa requirement. Prompt nằm riêng khỏi node để có thể version, eval và thay model mà không sửa workflow.
