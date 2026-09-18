# Assignment live API — Run 1

| Chỉ số | Kết quả |
|---|---:|
| Tổng case | 20 |
| Automated pass | 13 |
| Automated fail | 7 |
| Tỷ lệ đạt tự động | 65% |
| Latency trung bình | 3,07 giây |

## Phân tích fail

| Case | Nhóm lỗi | Phân tích |
|---|---|---|
| AS-009 | Grader quá cứng | AI trả fallback hợp lý và warning đúng nghĩa, nhưng không chứa nguyên văn `chưa khớp skill`. |
| AS-010 | Validation/integration | Backend loại bản nháp AI và trả `clarify`; cần raw model response để biết field nào không hợp lệ. |
| AS-011 | Grader quá cứng | AI giao task khớp đúng người và cảnh báo task video chưa có skill, nhưng wording không khớp substring expected. |
| AS-013 | Validation/integration | Mapping ngữ nghĩa REST/FastAPI sang Backend bị validator exact-match loại bỏ. |
| AS-015 | Grader quá cứng | AI fallback đúng, confidence low và yêu cầu xác nhận, nhưng wording khác expected. |
| AS-019 | Grader quá cứng | AI trả `clarify` đúng vì skill chỉ có khoảng trắng, nhưng dùng từ `skill` thay cho `kỹ năng`. |
| AS-020 | Validation/integration | Mapping `kiểm thử/test` sang Testing bị validator exact-match loại bỏ. |

Automated score giữ nguyên 13/20. Bốn case nghi false-negative cần hai người chấm tay theo rubric trước khi công bố adjusted score; không tự đổi thành pass trong CSV.
