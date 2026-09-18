# Task Analysis — Run 1 (Live AI Model)

| Chỉ số | Kết quả |
|---|---:|
| Tổng case | 20 |
| Pass tự động | 9 |
| Fail | 11 |
| Tỷ lệ đạt | 45.0% |

## Đánh giá kết quả

Lượt chạy đã kết nối thành công với live endpoint `POST /api/v1/labs/analyze` và mô hình LLM qua NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`). Toàn bộ 20 test case được suy luận và phản hồi thực tế không dùng hardcode hay mock.

### Chi tiết phân loại theo Taxonomy:
- **1_source_truth** (Nguồn sự thật): 2/5 pass (TA-011, TA-012 pass chặn tài liệu thiếu ref; TA-001 tách 4 task thay vì 3; TA-002 model cố gắng gợi ý task thay vì clarify; TA-019 bị thiếu input dẫn tới clarify).
- **2_ambiguity_missing_information** (Mơ hồ / thiếu thông tin): 2/4 pass (TA-003 phân rã hoàn hảo 4 deliverable chuẩn CVAT/YOLO; TA-014 pass; TA-004 tách 2 task thay vì 3; TA-013 model tự phỏng đoán task).
- **3_out_of_scope_authority** (Ngoài phạm vi / thẩm quyền): 1/4 pass (TA-016 pass; TA-005, TA-006 model có xu hướng quá nhiệt tình tạo task thay vì từ chối/clarify).
- **4_domain_specific** (Đặc thù domain AI/ML/CV): 4/7 pass (TA-007, TA-009, TA-017, TA-020 pass chuẩn rubric; các case fail do model chấp nhận phân tích thay vì dừng lại clarify).

### Nhận xét & Hướng cải thiện:
- Mô hình hiện tại phân rã task rất chi tiết và đúng format JSON (`schema_valid` đạt 100%).
- Khuynh hướng chính gây fail là **"over-eager"** (mô hình AI quá nhiệt tình cố gắng tạo task khi yêu cầu mơ hồ hoặc ngoài thẩm quyền, thay vì trả về `status: clarify`).
- Có thể tinh chỉnh thêm một vài constraint trong system prompt để mô hình nghiêm khắc hơn với các input thiếu dữ liệu hoặc ngoài quyền hạn.
