# Nhật ký Thử nghiệm Người dùng 02 — Huỳnh An Nghiệp (Member)

> **Đối tượng thử nghiệm:** Huỳnh An Nghiệp  
> **Đơn vị / Khóa học:** Học viên K2  
> **Vai trò thử nghiệm:** Thành viên nhóm nhận task (Member)  
> **Kinh nghiệm:** Frontend / UI Design  
> **Thời gian:** 15:00 – 15:30 ngày 18/09/2026  
> **Người quan sát / Ghi chép:** Lê Thị Thùy Trang & Lâm Hải Dương (Team E403 Sloppers)  
> **Môi trường:** MacBook Air M2, Safari & Chrome, truy cập `http://localhost:5173`

---

## 1. Diễn biến Thử nghiệm theo Kịch bản (Timeline & Observations)

### 15:00 – Nhận lời mời tham gia nhóm
* **Quan sát:** Nghiệp đăng nhập vào tài khoản học viên (`2A202602678`).
* **Hành vi:** Trên góc phải thanh thông báo xuất hiện badge thông báo mời nhóm từ nhóm trưởng Phạm Hoàng Trọng.
* **Thao tác:** Nghiệp mở popup thông báo và bấm nút **“Xác nhận tham gia”**.
* **Thời gian thao tác:** **15 giây**.

### 15:04 – Trải nghiệm màn hình Hồ sơ năng lực tự khai (Self-profiling)
* **Quan sát:** Sau khi chấp nhận lời mời, hệ thống tự động điều hướng Nghiệp đến modal **“Hồ sơ năng lực phiên Lab”**.
* **Thao tác:** Nghiệp chọn ngành công tác (`IT`), sau đó tick chọn các kỹ năng sở trường:
  - `Frontend` (mức 4/5)
  - `UI/UX Design` (mức 5/5)
  - `Prompt Engineering` (mức 3/5)
* **Nghĩ thành tiếng (Think-aloud):**
  > *“Thích cái này nha! Tự mình khai năng lực của mình chứ không phải AI đi xem điểm thi hay soi bài cũ của mình rồi phán xét. Đỡ bị áp lực tâm lý.”*
* **Thời gian hoàn thành:** **25 giây**.

### 15:09 – Kiểm tra kết quả AI phân công trên Workspace
* **Quan sát:** Sau khi Leader bấm duyệt kế hoạch, màn hình của Nghiệp tự động đồng bộ theo thời gian thực (qua WebSocket).
* **Thao tác:** Nghiệp xem danh sách task trên bảng. Thấy task liên quan đến UI và giao diện được gán cho mình kèm thẻ tag màu cam `UI/UX`.
* **Quote nguyên văn đắt giá của Huỳnh An Nghiệp:**
  > **“Nhiều khi nhận task không đúng thế mạnh nên ngồi loay hoay cả buổi. Cần nhất là biết rõ mình phải sửa file nào và nộp cái gì vào cuối giờ.”**

### 15:15 – Tương tác với Deliverable & File Ownership
* **Quan sát:** Nghiệp đọc chi tiết task: có ghi rõ Deliverable cần nộp là mockup và component, kèm theo danh sách file sở hữu để tránh đè code với bạn làm Backend.
* **Hành vi:** Nghiệp tick thử checkbox hoàn thành task $ightarrow$ thanh tiến trình cá nhân và tiến độ nhóm bên góc phải nhảy từ `0%` lên `25%` ngay lập tức.
* **Thử nghiệm tính năng Chat tiến độ (Private Progress Chat):**
  - Mở khung chat ở góc phải dưới, gõ: *"Minh đang tiến hành dựng flow tương tác cho mockup rồi nhé."*
  - Tin nhắn hiển thị ngay trên màn hình của các thành viên khác mà không cần F5 tải lại trang.

---

## 2. Đánh giá Khả dụng (SUS Score) từ Huỳnh An Nghiệp

| Tiêu chí khảo sát SUS | Điểm (1–5) | Ghi chú phản hồi |
| :--- | :---: | :--- |
| 1. Tôi muốn sử dụng hệ thống này thường xuyên trong giờ Lab | **5/5** | Biết chính xác mình cần nộp gì |
| 2. Giao diện thân thiện, dễ hiểu | **5/5** | Màu sắc đẹp, rõ ràng, avatar sinh động |
| 3. Tốc độ đồng bộ real-time nhanh | **5/5** | Không phải load lại trang |
| 4. AI gán việc công bằng, đúng sở trường | **4/5** | Khớp 90% mong muốn cá nhân |
| 5. Yên tâm về quyền riêng tư | **5/5** | Không bị lộ điểm số cho Coach |
| **Điểm quy đổi SUS:** | **85.0 / 100** | **Hạng A (Excellent)** |

---

## 3. Tác động của Feedback vào Sản phẩm

* **Vấn đề chỉ ra:** Thành viên sợ bị giao việc không đúng sở trường và sợ làm đè file của bạn khác.
* **Thay đổi kỹ thuật nhóm đã triển khai:** Thêm hồ sơ năng lực tự khai 1–5 để match đúng sở trường và giao File Ownership rõ ràng.
