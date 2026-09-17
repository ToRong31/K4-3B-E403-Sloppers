# VLearn LabSpace — mockup CP2

Mockup tương tác của **Sloppers · lớp 3B** cho Track A2. Tính năng đề xuất được tích hợp vào VLearn để một nhóm tạm thời trong buổi LAB có thể:

- nhóm trưởng tạo nhóm và mời bằng mã học viên, hoặc học viên tìm nhóm bằng mã mời;
- xác nhận thành viên hai chiều, sau đó mỗi học viên onboarding kỹ năng và mức thành thạo cho phiên học;
- để nhóm trưởng xem, chỉnh sửa và phê duyệt bản nháp phân công do AI gợi ý;
- theo dõi checklist và deliverable chính thức của bài;
- gửi trạng thái cấp nhóm cho Lab Coach, chỉ khi cần hỗ trợ.

## Chạy mockup

Mở `index.html` bằng trình duyệt, hoặc chạy bằng static server trong thư mục này. Đây là prototype front-end phục vụ CP2; dữ liệu, tiến độ và AI-call hiện được mô phỏng để minh hoạ flow.

## Luồng demo

`Bài Lab của tôi` → `K4–L3B–DAY05–06–MINI–HACKATHON` → `Tạo hoặc tìm nhóm` → xác nhận thành viên → onboarding kỹ năng → `LabSpace` → nhóm trưởng tạo bản nháp AI → kiểm tra/chỉnh owner → phê duyệt → tick task → `Coach view`.

## Ba góc nhìn trong mockup

- **Nhóm trưởng (Phạm Hoàng Trọng):** tạo nhóm và gửi lời mời bằng mã học viên. Sau đó chỉ xem số thành viên đã vào nhóm tại LabSpace; không xác nhận thay học viên.
- **Học viên được mời (Lê Thị Thùy Trang):** nhận lời mời trong **Thông báo**, tự xác nhận tham gia, rồi hoàn tất hồ sơ năng lực cho phiên LAB và chờ kế hoạch được duyệt.
- **Lab Coach:** chỉ theo dõi tiến độ cấp nhóm, task bị chặn và yêu cầu hỗ trợ; không xem hồ sơ năng lực hoặc hoạt động cá nhân.
