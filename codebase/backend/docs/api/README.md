# API contract

Swagger UI: `http://localhost:8000/docs`.

## `POST /api/v1/assignments/assign_tasks`

Nhận tên nhóm, thành viên + skill tự khai và canonical task. Trả:

- `ready`: draft task-owner, reason và gap để nhóm duyệt;
- `clarify`: không phân công khi thiếu dữ liệu tối thiểu.

Endpoint luôn gọi operation `assign_tasks`. AI không được tạo/sửa canonical task và draft chưa có hiệu lực cho đến khi frontend cho nhóm xác nhận. Mỗi assignment trả thêm `matched_skills` và `confidence` (`high` hoặc `low`).

`POST /api/v1/assignments/draft` vẫn được giữ tạm thời để tương thích ngược.

## Canonical checklist persistence

Khi `POST /api/v1/labs/analyze` trả `status="ready"`, checklist đã qua validation
được ghi atomically vào `data/generated/checklists/` theo `lab_id` và `version`.
Thư mục này là runtime data và không được commit.

Assignment có thể dùng trực tiếp canonical task đã lưu, không cần client gửi lại task:

```json
{
  "group_name": "Sloppers",
  "members": [
    {"id": "m1", "name": "Dũng", "skills": ["Backend"]}
  ],
  "lab_id": "K4-L3B-DAY05-06-MINI-HACKATHON",
  "version": 1
}
```

Request phải cung cấp đúng một nguồn task: `tasks`, hoặc cặp `lab_id/version`.
Nếu chưa có file checklist tương ứng, endpoint trả HTTP 404.
