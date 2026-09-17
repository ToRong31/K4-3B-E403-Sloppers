# Biểu mẫu khảo sát: Cách nhóm bắt đầu một bài LAB

> **Tài liệu đặc tả Google Form thu thập Evidence cho dự án Hackathon Day 05-06**  
> **Đơn vị thực hiện:** Team E403 - Sloppers  
> **Kênh thu thập:** Google Forms (kèm đường link chia sẻ trong Discord và lớp học)  
> **Đối tượng khảo sát:** Học viên chương trình AI20k làm bài thực hành LAB theo nhóm  

---

## 1. Bối cảnh & Mục tiêu khảo sát

### 1.1. Bối cảnh
Trong các buổi thực hành bài LAB (thời lượng 120–180 phút) hoặc các đợt Hackathon, quy trình khởi động bài toán thường xuyên xảy ra tình trạng "bối rối tập thể":
- Đề bài dài, repo nhiều file, rubric chấm điểm phân mảnh giữa VLearn, GitHub README và tài liệu hướng dẫn.
- Nhóm mất nhiều thời gian họp bàn, tranh luận xem "cần làm gì và nộp gì".
- Việc chia việc diễn ra cảm tính, dẫn đến làm trùng việc, bỏ sót yêu cầu, hoặc dồn việc cho một người.

### 1.2. Mục tiêu khảo sát (Problem & Demand Validation)
1. **Kiểm chứng giả định (Mom Test):** Xác thực xem nỗi đau phân chia task và khởi động bài LAB có thực sự tồn tại ở quy mô lớn hay không (đạt chuẩn Evidence A: ≥20 người, ≥50% xác nhận).
2. **Định lượng thiệt hại (Quantify Pain & Cost):** Đo lường thời gian trễ khi khởi động (latency to align) và tổng thời gian lãng phí phát sinh do phải chia lại task giữa chừng.
3. **Phân tích nguyên nhân gốc rễ (Root Cause Analysis):** Khám phá cơ chế phân công task hiện tại và nguồn thông tin các nhóm đang dùng.
4. **Tìm kiếm Early Adopters / Willing Users:** Thu thập danh sách học viên sẵn sàng dùng thử sản phẩm MVP của nhóm.

---

## 2. Cấu trúc chi tiết bộ câu hỏi (Survey Form Schema)

### Câu hỏi 1: Xác định vai trò (Sàng lọc đối tượng)
* **Tiêu đề câu hỏi:** `Trong bài LAB gần nhất, bạn đảm nhiệm vai trò nào?`
* **Loại câu hỏi:** Trắc nghiệm 1 đáp án (`Single Choice / Radio button`)
* **Tính chất:** Bắt buộc (`Required`)
* **Mục đích:** Phân loại góc nhìn giữa người điều phối (Leader), người thực thi (Member) và nhóm ra quyết định tập thể (Consensus). Đồng thời lọc bỏ người chưa từng làm việc nhóm.
* **Các phương án lựa chọn:**
  1. `Đội trưởng/người chia việc`
  2. `Thành viên nhận task`
  3. `Cùng cả nhóm quyết định`
  4. `Chưa từng làm LAB theo nhóm` *(Điều kiện lọc / Excluded sample)*

---

### Câu hỏi 2: Thời gian thống nhất ban đầu
* **Tiêu đề câu hỏi:** `Từ lúc nhóm có đề/repo đến khi cả nhóm thống nhất “cần làm gì và cần nộp gì”, thường mất khoảng bao lâu ở lần gần nhất?`
* **Loại câu hỏi:** Trắc nghiệm 1 đáp án (`Single Choice / Radio button`)
* **Tính chất:** Bắt buộc (`Required`)
* **Mục đích:** Đo lường thời gian chết ban đầu (Initial alignment latency).
* **Các phương án lựa chọn:**
  1. `Dưới 5 phút`
  2. `5 đến 15 phút`
  3. `15 đến 30 phút`
  4. `Trên 30 phút`
  5. `Cuối cùng vẫn chưa rõ`

---

### Câu hỏi 3: Nguồn xác định đầu việc & yêu cầu nộp bài
* **Tiêu đề câu hỏi:** `Ở lần đó, nhóm dựa vào đâu để biết các phần cần làm và cần nộp?`
* **Loại câu hỏi:** Hộp kiểm nhiều đáp án (`Multiple Choice / Checkboxes`)
* **Tính chất:** Bắt buộc (`Required`)
* **Mục đích:** Xác định nguồn tài liệu và luồng thông tin (Information pipeline) mà các nhóm dựa vào để phân rã đề bài.
* **Các phương án lựa chọn:**
  1. `Nội dung bài LAB/codelab trên VLearn`
  2. `README/đề bài/repository`
  3. `Tin nhắn Discord/Zalo/Messenger`
  4. `Google Docs/Sheet/Notion do nhóm tự tạo`
  5. `Một thành viên tóm tắt lại bằng miệng/chat`
  6. `Tự nhớ hoặc vừa làm vừa hỏi`

---

### Câu hỏi 4: Các vấn đề & điểm nghẽn gặp phải (Pain Points)
* **Tiêu đề câu hỏi:** `Trong lần làm LAB đó, nhóm bạn có gặp điều nào sau đây không?`
* **Loại câu hỏi:** Hộp kiểm nhiều đáp án (`Multiple Choice / Checkboxes`)
* **Tính chất:** Bắt buộc (`Required`)
* **Mục đích:** Đo lường tỷ lệ bắt gặp các điểm đau cốt lõi về điều phối bài LAB.
* **Các phương án lựa chọn:**
  1. `Có người chưa biết làm gì`
  2. `Hai hoặc nhiều người làm trùng một phần`
  3. `Có phần việc bị bỏ sót`
  4. `Task không phù hợp năng lực`
  5. `Một người phải làm quá nhiều`
  6. `Phải chia lại task giữa chừng`
  7. `Khó biết nhóm đã xong đến đâu`
  8. `Không rõ còn thiếu gì trước khi nộp`
  9. `Có người bị kẹt nhưng nhóm biết muộn`

---

### Câu hỏi 5: Hậu quả thực tế của vấn đề
* **Tiêu đề câu hỏi:** `Vấn đề đó gây hậu quả gì?`
* **Loại câu hỏi:** Hộp kiểm nhiều đáp án (`Multiple Choice / Checkboxes`)
* **Tính chất:** Bắt buộc (`Required`)
* **Mục đích:** Xác định mức độ ảnh hưởng của vấn đề lên chất lượng bài LAB, tiến độ và trải nghiệm thành viên.
* **Các phương án lựa chọn:**
  1. `Mất thêm thời gian`
  2. `Phải làm lại`
  3. `Thành viên bị kẹt`
  4. `Trễ deadline`
  5. `Chất lượng bài giảm`
  6. `Không có hậu quả đáng kể`

---

### Câu hỏi 6: Thời gian thiệt hại tăng thêm (Cost of Inefficiency)
* **Tiêu đề câu hỏi:** `Ước lượng nhóm mất thêm bao nhiêu phút vì việc chia hoặc hiểu lại task?`
* **Loại câu hỏi:** Trắc nghiệm 1 đáp án (`Single Choice / Radio button`)
* **Tính chất:** Bắt buộc (`Required`)
* **Mục đích:** Định lượng chi phí thời gian bị lãng phí (phục vụ chứng minh ROI cho AI Solution).
* **Các phương án lựa chọn:**
  1. `Hầu như không mất thêm thời gian`
  2. `Dưới 5 phút`
  3. `5–15 phút`
  4. `15–30 phút`
  5. `Trên 30 phút`
  6. `Không ước lượng được`

---

### Câu hỏi 7: Phương pháp phân công công việc hiện tại
* **Tiêu đề câu hỏi:** `Nhóm hiện dựa vào đâu để biết task phù hợp với ai?`
* **Loại câu hỏi:** Trắc nghiệm 1 đáp án (`Single Choice / Radio button`)
* **Tính chất:** Bắt buộc (`Required`)
* **Mục đích:** Khám phá cơ chế matching task với thành viên hiện nay (chủ quan, ngẫu nhiên hay khoa học).
* **Các phương án lựa chọn:**
  1. `Thành viên tự nhận`
  2. `Đội trưởng tự đánh giá`
  3. `Chia ngẫu nhiên`
  4. `Dựa trên lần làm việc trước`
  5. `Dựa trên hồ sơ kỹ năng`

---

### Câu hỏi 8: Cam kết dùng thử MVP (Willing Users)
* **Tiêu đề câu hỏi:** `Nếu được, bạn có thể dùng thử MVP của team không? Xin hãy để lại Discord/Zalo/Facebook`
* **Loại câu hỏi:** Văn bản ngắn (`Short answer`)
* **Tính chất:** Không bắt buộc (`Optional`)
* **Mục đích:** Tìm kiếm early adopters sẵn sàng tham gia thử nghiệm thực tế theo chuẩn Mom Test và phục vụ vòng Validation CP5.
* **Placeholder / Gợi ý:** `Discord ID, số Zalo hoặc link Facebook...`

---

## 3. Quy tắc xử lý và làm sạch dữ liệu
1. **Lọc dữ liệu hợp lệ (Sanitization):**
   - Loại trừ các phản hồi chọn `Chưa từng làm LAB theo nhóm` ở Câu 1 khi tính toán các chỉ số về quy trình nhóm, vì đối tượng này chưa có trải nghiệm thực tế về phân chia công việc trong bài LAB.
2. **Định dạng thời gian:**
   - Dấu thời gian được chuẩn hóa về định dạng `YYYY/MM/DD HH:mm:ss`.
3. **Bảo mật & Ẩn danh (Privacy & Anonymization):**
   - Không công khai trực tiếp số điện thoại cá nhân trong các tài liệu tổng kết public (`survey-summary.md`).
   - Mã hóa người phản hồi thành các mã định danh `R01, R02, ..., R39` để tiện trích dẫn trong bản đặc tả AI Spec.
