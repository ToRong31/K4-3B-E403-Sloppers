# API contract

Swagger UI: `http://localhost:8000/docs`.

## `POST /api/v1/assignments/draft`

Nhận tên nhóm, thành viên + skill tự khai và canonical task. Trả:

- `ready`: draft task-owner, reason và gap để nhóm duyệt;
- `clarify`: không phân công khi thiếu dữ liệu tối thiểu.

AI không được tạo/sửa canonical task và draft chưa có hiệu lực cho đến khi frontend cho nhóm xác nhận.

