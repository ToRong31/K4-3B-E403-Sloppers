# Assignment User Input Grid

Quyết định được đo: `Checklist tasks + self-declared member skills -> assignment draft`.

| Chiều thay đổi | Giá trị được phủ |
|---|---|
| Chất lượng skill data | complete, partial, missing, whitespace-only |
| Kiểu matching | exact, case-insensitive, deliverable, multi-skill, none, semantic synonym, substring trap |
| Quy mô nhóm | 1, 2, 3 thành viên |
| Số task | 1, 2, 3, 4 task |
| Ranh giới quyền hạn | draft only, không tự confirm/persist, owner phải thuộc group |

## Coverage theo nhóm case

- `AS-001`–`AS-009`: 9 case thường gặp.
- `AS-010`–`AS-017`: 8 case biên.
- `AS-018`–`AS-020`: 3 case hiếm.
- Taxonomy: 5 nguồn sự thật, 4 mơ hồ/thiếu dữ liệu, 4 ngoài phạm vi/thẩm quyền, 7 đặc thù domain.

Mười case đầu là `chatlog_derived` và đã đối chiếu `turn_id` trong `data/chatlog_eval_sources.json`. Task/deliverable bám raw chatlog; member và skill profile là biến thể tổng hợp phục vụ quyết định phân công.
