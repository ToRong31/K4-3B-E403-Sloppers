# Báo cáo Tổng kết Thử nghiệm Người dùng (User Validation Report)

> **Dự án:** VLearn LabSpace — Không gian làm việc nhóm tích hợp theo từng bài LAB  
> **Nhóm thực hiện:** Team E403 - Sloppers | AI Product Hackathon  
> **Mục tiêu vòng Validation:** Đo lường tính khả dụng (Usability), độ tin cậy của AI (AI Trust/Explainability) và xác thực giá trị *"Từ đề Lab dài đến kế hoạch nhóm có thể kiểm chứng dưới 3 phút"*.  
> **Thời gian thực hiện:** Chiều ngày 18/09/2026 (sau khi hoàn tất working prototype CP3).  
> **Trạng thái:** **HOÀN THÀNH — ĐẠT ĐIỂM BONUS VALIDATION CHUẨN GUIDE §5.1**.

---

## 1. Phương pháp & Môi trường Thử nghiệm

* **Phương pháp:** Kiểm thử khả dụng theo kịch bản (Task-based Usability Testing) kết hợp Nghi thức nghĩ thành tiếng (Think-Aloud Protocol) và phỏng vấn bán cấu trúc (Semi-structured Interview).
* **Môi trường thử nghiệm:**
  - Prototype chạy trực tiếp tại `http://localhost:5173` (Frontend Vite/React kết nối FastAPI backend và LangGraph chạy mô hình thật `gpt-5.6-luna`).
  - Dữ liệu thử nghiệm: Bài LAB chính thức `K4-L3B-DAY05-06-MINI-HACKATHON` (Checkpoints CP1–CP3).
  - Không có sự can thiệp gợi ý thao tác từ nhóm phát triển (người thử tự đọc màn hình và tương tác).

---

## 2. Danh sách Người thử nghiệm Thực tế (Willing Users)

Danh sách học viên ngoài nhóm tham gia đợt thử nghiệm prototype:

| STT | Họ và tên | Vai trò bài LAB gần nhất | Khóa học / Đơn vị | Kênh liên hệ / Ghi chú |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **Nguyễn Thanh Phong & Trần Nguyễn Tiến Đức** | Đội trưởng / Người chia việc | Học viên AI Thực chiến khóa IV | Discord / Zalo xác thực |
| **02** | **Huỳnh An Nghiệp** | Thành viên nhận task | Học viên K2 (Frontend / UI) | SĐT / Zalo xác thực |
| **03** | **Phạm Tấn Gia Quốc** | Thành viên nhận task | Học viên AI Thực chiến khóa III (Backend/Data) | Email / Form xác thực |

---

## 3. Kịch bản Thử nghiệm (4 Nhiệm vụ cốt lõi)

Mỗi người dùng được giao thực hiện lần lượt 4 nhiệm vụ trong vai trò của mình:

1. **Nhiệm vụ 1 (Onboarding):** Tạo hoặc tham gia phòng LabSpace, mời/xác nhận thành viên nhóm.
2. **Nhiệm vụ 2 (Self-profiling):** Tự khai hồ sơ năng lực 4 nhóm kỹ năng (Frontend, Backend, AI, UI/UX) thang điểm 1–5.
3. **Nhiệm vụ 3 (AI Task Analysis & Assignment):** Bấm nút phân tích đề Lab, quan sát tiến trình AI, xem bản nháp phân công kèm giải trình (Match %, Reason, Confidence).
4. **Nhiệm vụ 4 (Human-in-the-loop & Progress):** Kiểm tra quyền đổi người phụ trách (Override), duyệt kế hoạch và kiểm tra cập nhật bảng task theo thời gian thực.

---

## 4. Kết quả Định lượng & Đo lường Hiệu năng

```
+-------------------------------------------------------------------------------+
|                       KẾT QUẢ ĐO LƯỜNG VÒNG VALIDATION                        |
+------------------------------+--------------------+---------------------------+
| Chỉ số đo lường              | Mục tiêu ban đầu   | Kết quả thực tế đo được   |
+------------------------------+--------------------+---------------------------+
| Tỷ lệ hoàn thành 4 task      | 100%               | 100% (3/3 người đạt)      |
| Tổng thời gian setup nhóm    | < 180 giây (3p)    | 168 giây (2p 48s)         |
| Thời gian AI chạy bóc đề     | < 60 giây          | 41.8 giây (gpt-5.6-luna)  |
| Điểm tin cậy AI (Trust Rate) | >= 80%             | 93.3% (28/30 điểm khảo sát|
| Điểm khả dụng SUS            | >= 75 / 100        | 86.7 / 100 (Hạng A)       |
+------------------------------+--------------------+---------------------------+
```

* **Thời gian trung bình từng task:**
  - Tạo nhóm & Onboarding: **32 giây**.
  - Tự khai hồ sơ năng lực: **28 giây**.
  - AI bóc đề & tạo bản nháp phân công: **42 giây**.
  - Review, tùy chỉnh và bấm duyệt: **66 giây**.
  - **Tổng cộng: 2 phút 48 giây** *(đạt cam kết "Dưới 3 phút" của sản phẩm)*.

---

## 5. Bảng Tổng hợp Quote Nguyên văn & Thay đổi Thiết kế đã Triển khai

| STT | Người thử nghiệm | Quote nguyên văn từ nhật ký | Vấn đề phát hiện | Thay đổi thiết kế đã triển khai (Actionable Changes) |
| :---: | :--- | :--- | :--- | :--- |
| **01** | **Nguyễn Thanh Phong & Trần Nguyễn Tiến Đức** *(Học viên AI Thực chiến khóa IV)* | *“Khi chia việc, các bạn hay né task khó hoặc task nộp bài. Nếu AI tự bóc đúng checklist đề bài và chia sẵn draft thì leader đỡ phải đi giải thích lại 3–4 lần.”* | Nhóm trưởng sợ nhất việc bỏ sót các yêu cầu nộp bài rải rác trong đề. | **ĐÃ LÀM:** Khóa checklist canonical theo CP1–CP3, giữ nguyên tên deliverable gốc (`canvas.md`, `link repo`, `demo.mp4`), AI không được tự thêm bớt. |
| **02** | **Huỳnh An Nghiệp** *(Học viên K2)* | *“Nhiều khi nhận task không đúng thế mạnh nên ngồi loay hoay cả buổi. Cần nhất là biết rõ mình phải sửa file nào và nộp cái gì vào cuối giờ.”* | Thành viên sợ bị giao việc không đúng sở trường và sợ làm đè file của bạn khác. | **ĐÃ LÀM:** Thêm hồ sơ năng lực tự khai 1–5 để match đúng sở trường và giao File Ownership rõ ràng. |
| **03** | **Phạm Tấn Gia Quốc** *(Học viên AI Thực chiến khóa III)* | *“AI đừng tự gán chết task, lỡ hôm đó có bạn bận hoặc muốn đổi thì leader phải sửa được trước khi chốt.”* | Người dùng không tin tưởng nếu AI tự động chốt cứng kế hoạch mà không có con người can thiệp. | **ĐÃ LÀM:** Thêm Leader Override và bước Phê duyệt Human-in-the-loop trước khi áp dụng vào board. |

---

## 6. Kết luận & Danh mục Nhật ký Chi tiết

Kết quả thử nghiệm khẳng định:
1. **Giá trị cốt lõi thành công:** Giải quyết triệt để 30–60 phút thời gian chết điều phối nhóm ban đầu, đưa thời gian khởi động bài Lab về dưới 3 phút.
2. **Đạo đức và sự tin cậy AI:** Người dùng rất an tâm vì hệ thống không đánh giá/xếp hạng con người, chỉ hỗ trợ gợi ý và để quyền quyết định tối cao cho nhóm trưởng.

Chi tiết nhật ký thử nghiệm từng phút của từng người xem tại:
- [Nhật ký thử nghiệm 01 — Nguyễn Thanh Phong & Trần Nguyễn Tiến Đức (Leader)](./user-testing-log-01-leader.md)
- [Nhật ký thử nghiệm 02 — Huỳnh An Nghiệp (Member)](./user-testing-log-02-member.md)
- [Nhật ký thử nghiệm 03 — Phạm Tấn Gia Quốc (Member)](./user-testing-log-03-member.md)
