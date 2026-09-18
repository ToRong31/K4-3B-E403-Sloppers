# Thu hoạch cá nhân — Lê Thị Thùy Trang

**Mã học viên:** 2A202602678  
**Nhóm:** Sloppers  
**Vai trò:** Evidence research, UI owner và acceptance QA

## 1. Vai trò cá nhân

Vai trò của tôi là đưa tiếng nói người dùng vào quyết định sản phẩm và bảo đảm giao diện diễn đạt đúng cách hệ thống thực sự hoạt động. Tôi phụ trách thu thập bằng chứng, khảo sát học viên, tham gia xây dựng giao diện chính và kiểm tra trải nghiệm ở góc nhìn người dùng thay vì chỉ kiểm tra từng màn hình riêng lẻ.

## 2. Phần việc trực tiếp phụ trách

- Thiết kế nội dung khảo sát, tổng hợp phản hồi và lưu evidence trong `evidence/`.
- Phân tích các pain chính như bỏ sót phần việc, thành viên chưa biết mình cần làm gì và khó theo dõi tiến độ nhóm.
- Phụ trách UI/UX frontend, visual review và accessibility review cho hành trình tạo/nhận nhóm, xem phân công và theo dõi task.
- Thực hiện acceptance QA trên các luồng chính và luồng lỗi; kiểm tra nhãn nguồn dữ liệu, trạng thái loading, cảnh báo và khả năng hiểu của người dùng.

## 3. Cách tôi ứng dụng AI trong quá trình xây dựng

Tôi dùng AI để hỗ trợ nhóm hóa câu trả lời khảo sát, gợi ý các chủ đề lặp lại và tạo bản nháp bảng tổng hợp. Tuy nhiên, tôi luôn quay lại dữ liệu gốc để đếm và xác minh vì AI có thể gom nhầm các lựa chọn gần nghĩa hoặc đưa ra kết luận mạnh hơn bằng chứng. Trong phần giao diện, tôi dùng AI để gợi ý microcopy, trạng thái rỗng/lỗi, các trường hợp biên và hỗ trợ tạo mã giao diện ban đầu. Sau đó tôi tự chạy luồng, đối chiếu với spec và sửa những nội dung có thể khiến người dùng hiểu mock hoặc fallback là kết quả AI thật.

Tôi cũng sử dụng AI như một người review nhanh: đặt câu hỏi về khả năng đọc, tính nhất quán của nút bấm, quyền của từng vai trò và các thông tin cần hiện khi model có confidence thấp. Cách dùng này giúp tăng tốc nhưng quyết định cuối vẫn dựa trên evidence và kiểm thử trực tiếp.

## 4. Bài học từ thất bại thực tế của nhóm

Nhóm từng ghi nhận tín hiệu willing user là 9/36, nhưng khi kiểm tra lại CSV gốc thì con số đúng chỉ là 7/36. Sai lệch này cho thấy một bản tổng hợp trông hợp lý vẫn có thể sai nếu không truy ngược về dữ liệu nguồn. Ở phía UI, acceptance test còn phát hiện câu trả lời fallback có thể được trình bày giống output LLM, khiến người dùng không biết mình đang xem dữ liệu thật hay mô phỏng.

Bài học của tôi là **evidence và giao diện đều cần khả năng truy xuất nguồn**. Với số liệu, phải lưu cách đếm và kiểm tra lại từng nhóm phản hồi. Với UI, phải nói rõ trạng thái dữ liệu, hiển thị lỗi thật và không dùng cách trình bày khiến người dùng tin quá mức. AI giúp tổng hợp nhanh, nhưng người phụ trách evidence và QA phải là người chịu trách nhiệm xác minh cuối cùng.
