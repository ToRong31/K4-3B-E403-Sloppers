# Nhật ký Thử nghiệm Người dùng 03 — Phạm Tấn Gia Quốc (Member)

> **Đối tượng thử nghiệm:** Phạm Tấn Gia Quốc  
> **Đơn vị / Khóa học:** Học viên AI Thực chiến khóa III  
> **Vai trò thử nghiệm:** Thành viên nhóm (Member)  
> **Kinh nghiệm:** Backend và Data Engineering  
> **Thời gian:** 15:45 – 16:15 ngày 18/09/2026  
> **Người quan sát / Ghi chép:** Phạm Hoàng Trọng & Lê Thị Thùy Trang (Team E403 Sloppers)  
> **Môi trường:** Laptop ThinkPad T14, Ubuntu 24.04, Chrome 127, truy cập `http://localhost:5173`

---

## 1. Diễn biến Thử nghiệm theo Kịch bản (Timeline & Observations)

### 15:45 – Nhập phòng & Khai báo kỹ năng Backend
* **Thao tác:** Quốc đăng nhập tài khoản học viên `2A202602523`, chấp nhận lời mời vào nhóm Sloppers.
* **Hành vi:** Khai báo kỹ năng: `Backend` (5/5), `DevOps/Cloud` (4/5), `Data Engineering` (3/5).
* **Thời gian thực hiện:** **22 giây**.

### 15:52 – Quan sát quá trình AI Matching & Độ tin cậy (Explainability)
* **Quan sát:** Quốc được xem chung màn hình phân công của Leader.
* **Nhận xét về giải trình của AI:**
  > *“Bất ngờ là AI ghi rõ lý do tại sao gán task: 'Có kỹ năng Backend phù hợp với việc quản lý và cung cấp repository; Match 75%'. Đọc lý do thấy hợp lý chứ không phải random bừa.”*
* **Thảo luận về trường hợp Task mơ hồ:**
  - Nhóm thử nghiệm cố tình đưa 1 task không rõ deliverable $ightarrow$ AI gắn nhãn `Cần kiểm tra lại: confidence dưới 93%`.
  - Quốc rất tâm đắc với cảnh báo này vì tránh được việc cắm đầu vào làm một task chưa rõ đề.

### 16:00 – Thảo luận về quyền con người trong AI (Human-in-the-loop)
* **Quote nguyên văn đắt giá của Phạm Tấn Gia Quốc:**
  > **“AI đừng tự gán chết task, lỡ hôm đó có bạn bận hoặc muốn đổi thì leader phải sửa được trước khi chốt.”**
* **Đánh giá về luồng phê duyệt:**
  > *“Việc có nút Phê duyệt của Leader là chuẩn chỉ. AI chỉ nên là thư ký hỗ trợ chuẩn bị bản nháp, con người duyệt thì trách nhiệm mới thuộc về nhóm.”*

---

## 2. Đánh giá Khả dụng (SUS Score) từ Phạm Tấn Gia Quốc

| Tiêu chí khảo sát SUS | Điểm (1–5) | Ghi chú phản hồi |
| :--- | :---: | :--- |
| 1. Hệ thống hữu ích cho bài Lab nhóm | **5/5** | Tránh cãi vã chia task đầu giờ |
| 2. Giao diện trực quan, rõ ràng | **4/5** | Cần thêm phím tắt nhanh |
| 3. Độ minh bạch của AI cao | **5/5** | Giải thích lý do và có cảnh báo confidence |
| 4. Tính năng phân quyền tốt | **5/5** | Leader quyết định, Member an tâm làm |
| 5. Khả năng chịu lỗi và fallback tốt | **4/5** | Xử lý được cả khi thiếu thông tin |
| **Điểm quy đổi SUS:** | **87.5 / 100** | **Hạng A (Excellent)** |

---

## 3. Tác động của Feedback vào Sản phẩm

* **Vấn đề chỉ ra:** Người dùng không tin tưởng nếu AI tự động chốt cứng kế hoạch mà không có con người can thiệp.
* **Thay đổi kỹ thuật nhóm đã triển khai:** Thêm Leader Override và bước Phê duyệt Human-in-the-loop trước khi áp dụng vào board.
