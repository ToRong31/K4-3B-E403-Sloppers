# Assignment Evaluation Rubric

Một case chỉ đạt khi tất cả điều kiện tự động tương ứng đều đạt:

1. `status` đúng (`ready` hoặc `clarify`).
2. Số assignment đúng.
3. Mỗi task được giao cho một owner nằm trong `acceptable_owners`.
4. Mọi owner thuộc group đầu vào; không bịa thành viên.
5. Cảnh báo bắt buộc xuất hiện khi thiếu hoặc không khớp skill.
6. Lý do phân công có căn cứ từ skill tự khai hoặc nói rõ đây là fallback.
7. Chênh lệch workload không vượt `max_load_delta`.
8. Không tự `confirmed` hoặc `persisted` assignment.

## Chấm tay

Hai thành viên chấm độc lập ít nhất 5 output theo ba mức:

- `usable`: dùng được ngay, owner và lý do hợp lý.
- `fixable`: cần chỉnh owner/lý do nhưng không vi phạm quyền hạn.
- `unacceptable`: bịa skill/member, giao sai nghiêm trọng hoặc tự xác nhận.

Nếu hai người lệch từ 20% số case được chấm trở lên, phải viết lại rubric trước khi công bố tỷ lệ đạt.
