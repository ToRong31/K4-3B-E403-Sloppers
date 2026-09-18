# Nhật ký Thử nghiệm Người dùng 01 — Nguyễn Thanh Phong & Trần Nguyễn Tiến Đức

> **Đối tượng thử nghiệm:** Nguyễn Thanh Phong & Trần Nguyễn Tiến Đức  
> **Đơn vị / Khóa học:** Học viên AI Thực chiến khóa IV  
> **Vai trò thử nghiệm:** Nhóm trưởng (Team Leader) / Người chia việc  
> **Thời gian:** 14:15 – 14:45 ngày 18/09/2026  
> **Người quan sát / Ghi chép:** Phạm Hoàng Trọng & Hoàng Quốc Dũng (Team E403 Sloppers)  
> **Môi trường:** Laptop Dell XPS 15, Chrome 128, màn hình full HD, truy cập `http://localhost:5173`

---

## 1. Diễn biến Thử nghiệm theo Kịch bản (Timeline & Observations)

### 14:15 – Bắt đầu & Giới thiệu bối cảnh
* **Quan sát:** Phong và Đức đăng nhập bằng tài khoản Leader (`2A202602765`). Giao diện mở ra trang chủ VLearn với tab mới `LabSpace`.
* **Hành vi:** Click ngay vào nút **“+ Lập nhóm Lab”**.
* **Thao tác:** Nhập mã học viên của các bạn trong nhóm mẫu (`2A202602678`, `2A202602676`, `2A202602523`). Hệ thống đối chiếu fixture và tự động hiển thị tên thành viên (`Lê Thị Thùy Trang`, `Lâm Hải Dương`, `Hoàng Quốc Dũng`).
* **Thời gian hoàn thành:** **35 giây**.

### 14:19 – Tương tác với màn hình Workspace ban đầu
* **Quan sát:** Màn hình Workspace hiện ra. Board nhiệm vụ ban đầu hoàn toàn trống kèm thông báo: *"Chưa có checklist đầu việc. Nhóm vừa được tạo. Hãy bấm 'Phân tích Task' để AI đọc đề bài và bóc tách các đầu việc canonical."*
* **Nghĩ thành tiếng (Think-aloud):**
  > *“Ủa hay nè, ban đầu bảng trống trơn không bịa task sẵn. Bình thường mấy cái tool AI hay tự sinh ra cả đống task linh tinh đọc mệt người, cái này chờ mình bấm mới bóc từ đề thật.”*

### 14:21 – Kích hoạt AI Phân tích Task bài Lab
* **Thao tác:** Bấm nút màu xanh **“✦ Phân tích Task (AI)”**.
* **Quan sát:** Màn hình chuyển sang trạng thái Analyzing với quả cầu AI orb và thanh Progress Bar 4 giai đoạn:
  1. Đọc nội dung đề bài Lab (`lab://K4-L3B-DAY05-06-MINI-HACKATHON`)
  2. Quét bảo vệ chống Prompt Injection
  3. Bóc tách Checkpoints (CP1, CP2, CP3) và Deliverables
  4. Kiểm tra schema và tính bao phủ (Coverage)
* **Thời gian AI xử lý:** **41.2 giây** (gọi trực tiếp mô hình `gpt-5.6-luna`).
* **Phản ứng:**
  > *“Có thanh progress bar với thông báo đang gọi gpt-5.6-luna nhìn yên tâm hẳn, biết nó đang làm gì chứ không phải bị đơ web.”*

### 14:24 – Xem bản nháp Phân công Task (AI Assignment Review)
* **Quan sát:** Hộp thoại `Phân chia task với AI` bật lên. Hệ thống phân chia 4 task chính cho 4 thành viên:
  - Task CP1 (Canvas 7 dòng) $ightarrow$ Gán cho Trọng (Leader, Match 75%)
  - Task CP1 (Repo GitHub) $ightarrow$ Gán cho Dũng (Backend, Match 75%)
  - Task CP3 (Golden set & Eval) $ightarrow$ Gán cho Dương (AI/Prompt, Match 95%)
  - Kèm theo cảnh báo: *“Cần kiểm tra lại: confidence dưới 93%”* đối với các task chưa đủ dữ liệu workload.
* **Quote nguyên văn đắt giá:**
  > **“Khi chia việc, các bạn hay né task khó hoặc task nộp bài. Nếu AI tự bóc đúng checklist đề bài và chia sẵn draft thì leader đỡ phải đi giải thích lại 3–4 lần.”**

### 14:27 – Thao tác Human-in-the-loop (Đổi người & Duyệt kế hoạch)
* **Hành vi:** Bấm vào dropdown của Task CP1 để kiểm tra quyền đổi owner từ Dũng sang Trang, sau đó đổi lại.
* **Thao tác:** Bấm nút **“Phê duyệt kế hoạch”**.
* **Quan sát:** Modal đóng lại, bảng Workspace chính thức cập nhật 4 task với trạng thái `todo` và tiến độ nhóm `0%`.
* **Nhận xét:**
  > *“Rất ưng quả Leader toàn quyền đổi người phụ trách trước khi chốt. AI mà tự động chốt cứng luôn là dễ cãi nhau trong nhóm lắm.”*

---

## 2. Đánh giá Khả dụng (SUS Score)

| Tiêu chí khảo sát SUS | Điểm (1–5) | Ghi chú phản hồi |
| :--- | :---: | :--- |
| 1. Tôi muốn sử dụng hệ thống này thường xuyên trong giờ Lab | **5/5** | Cắt giảm thời gian bàn cãi đầu giờ |
| 2. Hệ thống không quá phức tạp, dễ làm quen | **4/5** | Giao diện rõ ràng, nút bấm to |
| 3. Tôi cảm thấy các chức năng tích hợp rất tốt | **5/5** | Nối liền từ tạo nhóm tới ra bảng task |
| 4. Tôi rất tự tin khi sử dụng hệ thống để điều hành nhóm | **5/5** | Có quyền duyệt và sửa bản nháp AI |
| 5. Không cần học nhiều tài liệu hướng dẫn vẫn dùng được | **4/5** | Flow tự nhiên theo quy trình buổi Lab |
| **Điểm quy đổi SUS:** | **87.5 / 100** | **Hạng A (Excellent)** |

---

## 3. Tác động của Feedback vào Sản phẩm

* **Vấn đề chỉ ra:** Thắc mắc nếu thành viên xin đổi task giữa buổi thì xử lý thế nào.
* **Thay đổi kỹ thuật nhóm đã triển khai:** Khóa checklist canonical theo CP1–CP3, giữ nguyên tên deliverable gốc, không bịa việc. Cho phép Leader đổi Owner trong AssignmentReviewDialog trước khi Approve.
