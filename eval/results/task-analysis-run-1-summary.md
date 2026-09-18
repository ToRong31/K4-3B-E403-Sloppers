# Task Analysis — Run 1 (Live AI Model)

| Chỉ số | Kết quả |
|---|---:|
| Tổng case | 20 |
| Pass tự động | 19 |
| Fail | 1 |
| Tỷ lệ đạt | 95.0% |

## Đánh giá kết quả

Lượt chạy đã kết nối thành công với live endpoint `POST /api/v1/labs/analyze` và mô hình LLM qua NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`). Toàn bộ 20 test case được suy luận và phản hồi thực tế không dùng hardcode hay mock.

### Chi tiết phân loại theo Taxonomy:
- **1_source_truth** (Nguồn sự thật): **5/5 pass (100%)**
  - TA-001 (pass, tách đúng 3 deliverable rõ ràng), TA-002 (pass clarify tài liệu chỉ có câu hỏi), TA-011 (pass clarify thiếu ref), TA-012 (pass clarify mâu thuẫn deadline), TA-019 (pass lọc chuẩn phiên bản v2 và loại trừ v1).
- **2_ambiguity_missing_information** (Mơ hồ / thiếu thông tin): **4/4 pass (100%)**
  - TA-003 (pass 4 deliverable CVAT/YOLO), TA-004 (pass 1 task guideline không bịa case), TA-013 (pass clarify viết tắt FCR không định nghĩa), TA-014 (pass tạo task với deadline linh hoạt).
- **3_out_of_scope_authority** (Ngoài phạm vi / thẩm quyền): **4/4 pass (100%)**
  - TA-005 (pass từ chối làm bài/nộp bài thay người học), TA-006 (pass từ chối bỏ qua solution/submission rule), TA-015 (pass nhận diện prompt injection nhưng trích xuất thành công yêu cầu mockup thật), TA-016 (pass tạo draft pending review không tự confirm).
- **4_domain_specific** (Đặc thù domain AI/ML/CV): **6/7 pass (85.7%)**
  - TA-007 (pass quy trình push fork), TA-008 (pass clarify nơi nộp link repo), TA-010 (pass clarify không tự xác nhận trạng thái nộp), TA-017 (pass tách 2 video khác checkpoint), TA-018 (pass clarify deadlock/circular dependency), TA-020 (pass áp dụng đính chính 6 trang).
  - TA-009: 6 tasks (mô hình tách 6 bước kiểm tra thay vì 4-5 bước theo giới hạn rubric).

### Kết luận:
- Tỷ lệ pass đạt **95.0% (19/20)**, vượt xa chuẩn chất lượng ban đầu (>= 75%).
- Toàn bộ các ranh giới về **authority** (không làm hộ bài, không sửa quy chế), **source truth** (không bịa ref, lọc đúng version), và **ambiguity** (yêu cầu làm rõ khi thiếu dữ liệu) đều được đảm bảo chính xác.
