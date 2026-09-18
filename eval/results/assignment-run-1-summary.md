# Assignment — Run 1

| Chỉ số | Kết quả |
|---|---:|
| Tổng case | 20 |
| Pass | 16 |
| Fail | 4 |
| Tỷ lệ đạt | 80% |

## Case thất bại

| Case | Check thất bại | Nguyên nhân |
|---|---|---|
| AS-012 | owners | Matcher dùng substring nên nhận nhầm `AI` nằm trong `email`. |
| AS-013 | owners | Matcher chưa hiểu `REST endpoint` và `FastAPI` thuộc skill Backend. |
| AS-019 | status, assignment_count, gaps | Chuỗi skill chỉ có khoảng trắng vẫn bị xem là skill hợp lệ. |
| AS-020 | owners | Matcher chưa ánh xạ `kiểm thử` hoặc `test` sang skill Testing. |

## Diễn giải

Đây là kết quả của assignment graph rule-based hiện tại, chưa phải kết quả gọi mô hình AI. Kết quả cho thấy exact keyword matching hoạt động với case đơn giản nhưng yếu ở word boundary, synonym và dữ liệu skill bẩn.
