# Thu hoạch cá nhân — Phạm Hoàng Trọng

**Mã học viên:** 2A202602765  
**Nhóm:** Sloppers  
**Vai trò:** Nhóm trưởng, phụ trách sản phẩm và tích hợp backend

## 1. Vai trò cá nhân

Trong dự án VLearn LabSpace, tôi giữ vai trò nhóm trưởng. Tôi chịu trách nhiệm giữ cho nhóm bám đúng bài toán đã chọn, chia phạm vi thành các đầu việc có thể hoàn thành trong thời gian hackathon và kết nối các phần sản phẩm, kỹ thuật, đánh giá thành một luồng demo thống nhất. Tôi cũng là người quyết định các giới hạn quan trọng của sản phẩm: AI chỉ tạo bản nháp phân công, còn nhóm trưởng phải xem lại, chỉnh sửa và phê duyệt.

## 2. Phần việc trực tiếp phụ trách

- Xây dựng và cập nhật `canvas.md`, `spec.md`, bao gồm lát cắt sản phẩm, non-goals, mức tự động hóa, các đường đi trải nghiệm và quality bar.
- Điều phối tiến độ, phân công đầu việc, rà soát artefact ở từng checkpoint và chuẩn bị kịch bản demo.
- Phụ trách phần backend ứng dụng, API/core/persistence và luồng dành cho Coach; phối hợp ghép backend với giao diện.
- Tổng hợp kết quả khảo sát, kiểm thử và eval vào quyết định sản phẩm; bảo đảm nhóm công khai những phần chưa hoàn thiện thay vì trình bày mock như tính năng đã chạy thật.

## 3. Cách tôi ứng dụng AI trong quá trình xây dựng

Tôi dùng AI như một trợ lý phản biện và tăng tốc, không giao toàn bộ quyết định cho AI. Cụ thể, tôi dùng AI để gợi ý cách cấu trúc spec, rà soát sự nhất quán giữa pain point, tính năng và quality bar; hỗ trợ sinh khung API, test và các trường hợp biên; đồng thời đối chiếu xem luồng demo có vượt thẩm quyền đã cam kết hay không. Mọi nội dung quan trọng đều được tôi kiểm tra lại bằng dữ liệu khảo sát, code chạy thực tế và kết quả trong `eval/`.

Việc dùng AI cũng được áp dụng trực tiếp trong sản phẩm: model phân tích checklist và đề xuất task–owner, nhưng kết quả chỉ là bản nháp. Tôi chủ động giữ human approval gate vì phân công sai có thể ảnh hưởng công bằng và tiến độ của cả nhóm.

## 4. Bài học từ thất bại thực tế của nhóm

Thất bại đáng nhớ nhất với tôi là ở giai đoạn tích hợp: giao diện từng có thể hiển thị câu trả lời fallback được viết sẵn như thể đó là kết quả từ LLM. Ngoài ra, chat 1:1 từng đọc hai task seed cũ dù board hiện tại đã có bốn task mới. Hai lỗi này làm demo trông có vẻ hoạt động nhưng thông tin lại không đáng tin.

Bài học tôi rút ra là **một luồng chạy được chưa đồng nghĩa với một sản phẩm đúng**. Khi nhiều thành viên phát triển song song, nhóm phải thống nhất một nguồn dữ liệu thật, ghi rõ đâu là mock, đâu là model call, và kiểm thử toàn bộ hành trình sau khi ghép các phần. Từ đó, nhóm loại bỏ fallback giả, để lỗi provider hiện rõ và buộc chat nhận snapshot task hiện tại. Với vai trò nhóm trưởng, tôi hiểu rằng quản lý phạm vi không chỉ là cắt bớt tính năng mà còn là không tuyên bố quá mức so với bằng chứng đang có.
