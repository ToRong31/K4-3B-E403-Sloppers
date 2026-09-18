# Thu hoạch cá nhân — Lâm Hải Dương

**Mã học viên:** 2A202602676  
**Nhóm:** Sloppers  
**Vai trò:** AI/backend engineer, phụ trách mô hình dữ liệu và evaluation

## 1. Vai trò cá nhân

Tôi phụ trách phần ra quyết định AI cốt lõi của LabSpace: chuyển yêu cầu LAB thành checklist có căn cứ và đề xuất phân công task theo kỹ năng do thành viên tự khai. Mục tiêu của tôi không chỉ là làm model trả lời được, mà còn thiết kế schema, guardrail và bộ đánh giá để biết khi nào kết quả có thể dùng, khi nào cần yêu cầu thêm thông tin.

## 2. Phần việc trực tiếp phụ trách

- Thiết kế data model cho task, member skill, assignment, confidence, gap và trạng thái `READY`/`CLARIFY`.
- Xây dựng LangGraph, prompt và structured output cho Task Analysis và Assignment trong `codebase/backend/src/agent/`.
- Tạo hai golden set trong `eval/`, mỗi bộ 20 case, bao phủ nguồn sự thật, thiếu dữ liệu, vượt thẩm quyền và tình huống đặc thù domain.
- Viết script chạy eval, đọc output, phân loại lỗi và giữ log kết quả để nhóm có thể kiểm tra lại.
- Bổ sung guardrail: không bịa member/skill/reference, không tự phê duyệt kế hoạch và không giải hoặc nộp bài thay học viên.

## 3. Cách tôi ứng dụng AI trong quá trình xây dựng

Tôi sử dụng AI ở hai lớp. Ở lớp sản phẩm, nhóm gọi model thật để phân rã checklist và ghép task với skill; đầu ra bị ràng buộc bằng schema và được kiểm tra lại bằng code trước khi trả về giao diện. Ở lớp phát triển, tôi dùng AI để gợi ý prompt, sinh các biến thể input khó, rà soát schema và hỗ trợ viết test. Tôi không lấy output đầu tiên làm đáp án chuẩn mà chạy qua golden set, đọc raw response và phân tích từng lỗi.

Khi xây eval, AI giúp mở rộng nhanh các cách diễn đạt và tình huống biên, còn expected output, hard gate và taxonomy được chốt thủ công theo yêu cầu sản phẩm. Cách làm này tránh tình trạng dùng chính model để tự chứng minh model đúng.

## 4. Bài học từ thất bại thực tế của nhóm

Lượt chạy Assignment với model thật chỉ đạt 13/20, tương đương 65%, thấp hơn quality bar 75%. Trong bảy case fail, có case là lỗi thực ở validation/integration, nhưng cũng có bốn case nghi là false-negative vì grader yêu cầu đúng một cách diễn đạt, dù output đã nêu fallback và cảnh báo hợp lý. Trước đó, bản rule-based đạt 16/20 nhưng không thể được xem là bằng chứng cho khả năng của model thật.

Bài học của tôi là **đánh giá AI cũng là một sản phẩm cần được kiểm thử**. Chỉ nhìn điểm tổng có thể dẫn đến hai sai lầm: chấp nhận một hệ thống chưa đủ tốt, hoặc sửa expected để làm điểm đẹp hơn. Nhóm đã giữ nguyên 13/20, tách lỗi model khỏi lỗi grader và yêu cầu hai người chấm độc lập các case nghi false-negative. Tôi hiểu rõ hơn rằng một pipeline AI đáng tin phải có raw log, tiêu chí kiểm chứng được, hard gate an toàn và quy trình review thủ công cho các trường hợp mà máy chấm chưa phản ánh đúng ngữ nghĩa.
