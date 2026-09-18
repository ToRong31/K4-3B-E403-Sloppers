# Thu hoạch cá nhân — Hoàng Quốc Dũng

**Mã học viên:** 2A202602523  
**Nhóm:** Sloppers  
**Vai trò:** Frontend integration engineer và kiểm thử tích hợp

## 1. Vai trò cá nhân

Tôi phụ trách kết nối giao diện với dữ liệu và dịch vụ backend để các màn hình không chỉ là bản mẫu tĩnh. Trọng tâm của tôi là luồng dữ liệu giữa API, state của ứng dụng, task board, chat và realtime; đồng thời viết kiểm thử để phát hiện các phần frontend đang đọc sai nguồn hoặc hiển thị trạng thái không đúng.

## 2. Phần việc trực tiếp phụ trách

- Xây dựng và hoàn thiện API adapter, frontend data binding và contract giữa giao diện với backend.
- Tích hợp state cho các luồng nhóm, phân công, tiến độ và chat; phối hợp với UI owner để hiển thị loading, lỗi và dữ liệu trả về.
- Phát triển client realtime/WebSocket và cơ chế fallback REST ở phạm vi prototype.
- Viết frontend test và integration test cho adapter, profile, progress chat và các luồng liên quan.
- Kiểm tra production build và hỗ trợ sửa lỗi khi ghép frontend với API/model thật.

## 3. Cách tôi ứng dụng AI trong quá trình xây dựng

Tôi dùng AI để hỗ trợ đọc contract, tạo khung adapter, đề xuất test case và tìm các nhánh trạng thái dễ bị bỏ sót như timeout, response rỗng, dữ liệu sai schema hoặc mất kết nối. Khi gặp lỗi tích hợp, tôi cung cấp cho AI log và phạm vi code liên quan để nhận giả thuyết, sau đó tự kiểm tra bằng test và chạy lại luồng thực tế. Tôi không dùng việc “AI nói code đúng” thay cho build hoặc test.

AI cũng giúp tôi tạo nhanh dữ liệu kiểm thử và rà soát sự khác biệt giữa mock response với response backend. Sau mỗi thay đổi, tôi ưu tiên test hành vi quan sát được: board hiển thị đúng task hiện tại, chat nhận đúng snapshot, lỗi model không biến thành trạng thái thành công và event realtime không tạo bản ghi trùng.

## 4. Bài học từ thất bại thực tế của nhóm

Một regression cụ thể của nhóm là board đã chuyển sang bốn task mới nhưng chat 1:1 vẫn trả lời dựa trên hai task seed cũ đã hoàn thành. Nguyên nhân là hai phần giao diện cùng nói về task nhưng không dùng chung một nguồn state. Bên cạnh đó, realtime và authorization đa vai trò chưa được chứng minh end-to-end bằng ba session, dù từng module riêng đã có code và test.

Bài học tôi rút ra là **test từng component pass vẫn chưa đủ để chứng minh luồng tích hợp đúng**. Dữ liệu phải có một nguồn chuẩn, được truyền rõ qua contract và kiểm tra ở ranh giới giữa các module. Sau lỗi trên, chat được sửa để nhận snapshot task đang hiển thị và nhóm bổ sung regression test. Tôi cũng học được rằng với realtime, trạng thái “đã kết nối” trên giao diện không thay thế được kiểm thử reconnect, dedupe và phân quyền bằng nhiều phiên thật; nếu chưa có bằng chứng đó thì phải ghi rõ là phần còn dang dở.
