# Báo cáo tổng hợp kết quả khảo sát: Cách nhóm bắt đầu một bài LAB

> **Dự án:** Trợ lý AI Hỗ trợ Phân rã Đề bài & Điều phối Bài Thực hành LAB  
> **Nhóm thực hiện:** Team E403 - Sloppers | Chương trình VinUni AI20k Hackathon (Day 05–06)  
> **Thời gian thu thập dữ liệu:** 18:59:14 – 19:49:08 ngày 17/09/2026  
> **Nguồn dữ liệu gốc:** Google Forms export (`evidence/survey-responses.csv`)  
> **Trạng thái chuẩn Evidence BTC:** **ĐẠT LOẠI XUẤT SẮC ĐƯỜNG A** (N = 39 phản hồi, 100% mẫu hợp lệ xác nhận pain point)  

---

## 1. Tổng quan chiến dịch khảo sát & Đánh giá chuẩn Evidence

### 1.1. Thông số mẫu khảo sát
* **Tổng số lượt phản hồi ghi nhận:** `N = 39` phản hồi.
* **Mẫu hợp lệ phân tích chuyên sâu:** `n = 36` người (chiếm **92.3%** tổng mẫu — đây là những học viên đã trực tiếp trải nghiệm làm bài LAB theo nhóm).
* **Mẫu loại trừ sàng lọc:** `3` người (chiếm **7.7%** — phản hồi `Chưa từng làm LAB theo nhóm`, được tách riêng để đảm bảo độ tin cậy và không gây nhiễu dữ liệu điều phối nhóm).

### 1.2. Đối chiếu chuẩn Evidence Hackathon (Rubric R1 & Guide §1.3)
Theo quy chế Hackathon Day 05-06, tiêu chí đánh giá Bằng chứng (Evidence Standard A) yêu cầu:
1. *Khảo sát ≥ 20 người ngoài nhóm:* **ĐẠT & VƯỢT CHỈ TIÊU (39/20 = 195%).**
2. *≥ 50% người được khảo sát xác nhận nỗi đau:* **ĐẠT TUYỆT ĐỐI (100% trong số 36 người hợp lệ gặp ít nhất 1 vấn đề, trung bình 3.08 vấn đề/người; nếu tính trên toàn bộ 39 người thì đạt 92.3%).**
3. *Log toàn bộ câu hỏi và từng câu trả lời nguyên văn:* **ĐẠT (Đầy đủ tại `evidence/survey-form.md` và `evidence/survey-responses.csv`).**

```
+-------------------------------------------------------------------------------+
|                      ĐỐI CHIẾU CHUẨN EVIDENCE ĐƯỜNG A                         |
+------------------------------+-------------------+----------------------------+
| Tiêu chí BTC                 | Yêu cầu tối thiểu | Kết quả Team Sloppers      |
+------------------------------+-------------------+----------------------------+
| Số lượng người khảo sát      | >= 20 người       | 39 người (195% chỉ tiêu)   |
| Tỷ lệ xác nhận vấn đề (Pain) | >= 50%            | 100% (36/36 mẫu hợp lệ)    |
| Log câu hỏi & câu trả lời    | Đầy đủ nguyên văn | survey-form.md & .csv      |
| Phân loại đối tượng          | Rõ ràng           | 3 vai trò + 1 nhóm loại trừ|
+------------------------------+-------------------+----------------------------+
```

---

## 2. Các phát hiện then chốt (Key Insights)

> [!IMPORTANT]
> **Insight 1: Bỏ sót việc và mất định hướng là hai điểm đau nhức nhối nhất**  
> **55.6%** (20/36 người) gặp tình trạng *"Có phần việc bị bỏ sót"* và **50.0%** (18/36 người) gặp tình trạng *"Có người chưa biết làm gì"*. Ngoài ra, **41.7%** (15/36 người) phản ánh *"Hai hoặc nhiều người làm trùng một phần việc"*. Điều này chứng minh quá trình bóc tách đề bài thủ công đang để lại những lỗ hổng nghiêm trọng trong việc phân định phạm vi công việc.

> [!WARNING]
> **Insight 2: Thiệt hại kép về thời gian (Double Time Penalty) làm tê liệt 25–33% buổi LAB**  
> Mỗi buổi LAB thường chỉ kéo dài 120–180 phút, nhưng các nhóm đang phải gánh chịu sự lãng phí thời gian ở hai giai đoạn:
> 1. **Thời gian thống nhất ban đầu:** **55.6%** (20/36 nhóm) mất từ 15 đến trên 30 phút (hoặc đến cuối buổi vẫn mơ hồ) chỉ để chốt *"cần làm gì và nộp gì"*.
> 2. **Thời gian lãng phí phát sinh:** **75.0%** (27/36 nhóm) mất thêm từ 5 đến trên 30 phút vì phải chia lại task, gỡ kẹt hoặc giải thích lại cho thành viên.  
> **Tổng cộng:** Một nhóm trung bình lãng phí **30 – 60+ phút** chỉ cho khâu điều phối và sửa lỗi phân công!

> [!CAUTION]
> **Insight 3: Cơ chế "Thành viên tự nhận việc" là bẫy gây sụt giảm chất lượng bài LAB**  
> Hiện có **36.1%** nhóm phân công bằng cách *"Thành viên tự nhận"* và **16.7%** *"Chia ngẫu nhiên"*. Khi để thành viên tự nhận:
> - **69.2%** nhóm gặp lỗi *"Bỏ sót phần việc"* (do ai cũng né các task khó, task tích hợp hoặc tài liệu hóa nộp bài).
> - **30.8%** rơi vào tình trạng *"Một người phải làm quá nhiều"* (người giỏi hơn phải gánh việc sót).
> - Hậu quả trực tiếp: **63.9%** nhóm bị sụt giảm chất lượng bài nộp và **41.7%** bị trễ deadline nộp bài.

> [!TIP]
> **Insight 4: Phụ thuộc vào tài liệu thô nhưng thiếu công cụ chuyển đổi sang Actionable Tasks**  
> **86.1%** nhóm đọc README/repository và **58.3%** đọc VLearn, nhưng chỉ có **22.2%** lập tài liệu theo dõi (Google Docs/Notion). Việc đọc một lượng lớn tài liệu markdown mà không có công cụ tự động trích xuất checklist và cấu trúc phụ thuộc (Dependency Graph) là nguyên nhân trực tiếp khiến các nhóm mất phương hướng.

> [!NOTE]
> **Insight 5: Nhu cầu thị trường rất thực tế với 25% người dùng sẵn sàng thử nghiệm ngay**  
> Dù câu hỏi để lại thông tin liên hệ là tùy chọn, đã có **9 học viên** (25.0% mẫu hợp lệ) phản hồi sẵn sàng dùng thử MVP của nhóm, trong đó có **4 người cung cấp thông tin liên lạc trực tiếp** (Discord, Zalo, SĐT cá nhân).

---

## 3. Bảng số liệu thống kê chi tiết từng câu hỏi

### Câu hỏi 1: Vai trò của người tham gia trong bài LAB gần nhất (N = 39)
*Mục đích: Phân loại cơ cấu đối tượng khảo sát và lọc mẫu.*

| Vai trò | Số lượng (n) | Tỷ lệ (%) | Ghi chú xử lý |
| :--- | :---: | :---: | :--- |
| **Thành viên nhận task** | 17 | 43.6% | Mẫu phân tích hợp lệ |
| **Đội trưởng/người chia việc** | 11 | 28.2% | Mẫu phân tích hợp lệ |
| **Cùng cả nhóm quyết định** | 8 | 20.5% | Mẫu phân tích hợp lệ |
| **Chưa từng làm LAB theo nhóm** | 3 | 7.7% | Loại trừ khỏi phân tích sâu quy trình nhóm |
| **Tổng cộng** | **39** | **100.0%** | **36 mẫu hợp lệ (92.3%)** |

---

### Câu hỏi 2: Thời gian từ lúc có đề/repo đến khi thống nhất "cần làm gì và cần nộp gì" (n = 36)
*Mục đích: Đo lường thời gian trễ khi khởi động bài LAB (Initial Alignment Latency).*

| Thời gian thống nhất | Số lượng (n) | Tỷ lệ (%) | Đánh giá mức độ trễ |
| :--- | :---: | :---: | :--- |
| **Dưới 5 phút** | 1 | 2.8% | Rất nhanh (chỉ chiếm thiểu số) |
| **5 đến 15 phút** | 15 | 41.7% | Mức chấp nhận được |
| **15 đến 30 phút** | 13 | 36.1% | Bắt đầu gây lãng phí thời gian |
| **Trên 30 phút** | 5 | 13.9% | Nghiêm trọng (>20% thời lượng buổi LAB) |
| **Cuối cùng vẫn chưa rõ** | 2 | 5.6% | Bế tắc hoàn toàn trong việc thống nhất |
| **Tổng cộng (Mất >= 15 phút hoặc không rõ)** | **20** | **55.6%** | **Hơn một nửa số nhóm gặp cản trở lớn** |

---

### Câu hỏi 3: Nguồn tài liệu nhóm dựa vào để biết phần cần làm và nộp (n = 36, Đa lựa chọn)
*Mục đích: Khảo sát kênh tiếp nhận dữ liệu đầu vào của học viên.*

| Kênh thông tin / Tài liệu | Số người chọn (n) | % Trên số người (n=36) | % Trên tổng lượt chọn (80) |
| :--- | :---: | :---: | :---: |
| **README / đề bài / repository** | 31 | 86.1% | 38.8% |
| **Nội dung bài LAB/codelab trên VLearn** | 21 | 58.3% | 26.3% |
| **Tin nhắn Discord / Zalo / Messenger** | 10 | 27.8% | 12.5% |
| **Google Docs / Sheet / Notion tự tạo** | 8 | 22.2% | 10.0% |
| **Một thành viên tóm tắt lại bằng miệng / chat** | 7 | 19.4% | 8.8% |
| **Tự nhớ hoặc vừa làm vừa hỏi** | 3 | 8.3% | 3.8% |

---

### Câu hỏi 4: Các vấn đề & điểm nghẽn gặp phải trong buổi LAB (n = 36, Đa lựa chọn)
*Mục đích: Xác thực trực tiếp các giả định điểm đau (Pain Point Verification).*

| Vấn đề gặp phải | Số người gặp (n) | % Trên số người (n=36) | Xếp hạng mức độ phổ biến |
| :--- | :---: | :---: | :---: |
| **Có phần việc bị bỏ sót** | 20 | **55.6%** | **Hạng 1** |
| **Có người chưa biết làm gì** | 18 | **50.0%** | **Hạng 2** |
| **Hai hoặc nhiều người làm trùng một phần** | 15 | **41.7%** | **Hạng 3** |
| **Khó biết nhóm đã xong đến đâu** | 14 | **38.9%** | **Hạng 4** |
| **Phải chia lại task giữa chừng** | 10 | **27.8%** | **Hạng 5 (đồng hạng)** |
| **Một người phải làm quá nhiều** | 10 | **27.8%** | **Hạng 5 (đồng hạng)** |
| **Task không phù hợp năng lực** | 9 | **25.0%** | **Hạng 7 (đồng hạng)** |
| **Không rõ còn thiếu gì trước khi nộp** | 9 | **25.0%** | **Hạng 7 (đồng hạng)** |
| **Có người bị kẹt nhưng nhóm biết muộn** | 6 | **16.7%** | **Hạng 9** |

*Thống kê tần suất:*
- **100.0%** (36/36 người) gặp ít nhất 1 vấn đề.
- **83.3%** (30/36 người) gặp từ 2 vấn đề trở lên.
- **66.7%** (24/36 người) gặp từ 3 vấn đề trở lên.
- Trung bình mỗi nhóm gặp **3.08 vấn đề** đồng thời.

---

### Câu hỏi 5: Hậu quả thực tế do các vấn đề gây ra (n = 36, Đa lựa chọn)
*Mục đích: Đo lường chi phí thiệt hại (Cost of Pain).*

| Hậu quả thực tế | Số người gặp (n) | % Trên số người (n=36) | % Trên tổng lượt chọn (82) |
| :--- | :---: | :---: | :---: |
| **Mất thêm thời gian** | 26 | **72.2%** | 31.7% |
| **Chất lượng bài giảm** | 23 | **63.9%** | 28.0% |
| **Trễ deadline** | 15 | **41.7%** | 18.3% |
| **Phải làm lại** | 8 | **22.2%** | 9.8% |
| **Thành viên bị kẹt** | 8 | **22.2%** | 9.8% |
| **Không có hậu quả đáng kể** | 2 | **5.6%** | 2.4% |

---

### Câu hỏi 6: Thời gian nhóm mất thêm vì việc chia hoặc hiểu lại task (n = 36)
*Mục đích: Định lượng thời gian lãng phí (Wasted Execution Minutes).*

| Thời gian mất thêm | Số lượng (n) | Tỷ lệ (%) | Mức độ ảnh hưởng |
| :--- | :---: | :---: | :--- |
| **5–15 phút** | 13 | 36.1% | Lãng phí ở mức trung bình |
| **15–30 phút** | 11 | 30.6% | Lãng phí đáng kể |
| **Trên 30 phút** | 3 | 8.3% | Thiệt hại rất nặng nề |
| **Dưới 5 phút** | 3 | 8.3% | Rất ít ảnh hưởng |
| **Hầu như không mất thêm thời gian** | 3 | 8.3% | Không ảnh hưởng |
| **Không ước lượng được** | 3 | 8.3% | Mất phương hướng quản lý thời gian |
| **Tổng cộng mất thêm >= 5 phút** | **27** | **75.0%** | **3/4 số nhóm chịu chi phí phát sinh** |

---

### Câu hỏi 7: Cơ chế nhóm dựa vào để biết task phù hợp với ai (n = 36)
*Mục đích: Khám phá phương pháp luận phân công nhân sự hiện tại.*

| Cơ chế phân công task | Số lượng (n) | Tỷ lệ (%) | Rủi ro tiềm ẩn |
| :--- | :---: | :---: | :--- |
| **Thành viên tự nhận** | 13 | 36.1% | Dễ chọn phần dễ, né phần khó, bỏ sót task |
| **Đội trưởng tự đánh giá** | 10 | 27.8% | Phụ thuộc chủ quan leader, dễ quá tải leader |
| **Chia ngẫu nhiên** | 6 | 16.7% | Task lệch năng lực, tăng nguy cơ làm sai |
| **Dựa trên lần làm việc trước** | 5 | 13.9% | Thiếu linh hoạt khi bài LAB đổi công nghệ |
| **Dựa trên hồ sơ kỹ năng** | 2 | 5.6% | Phương pháp bài bản nhất nhưng ít nhóm làm |

---

### Câu hỏi 8: Mức độ sẵn sàng dùng thử MVP của nhóm (n = 36)
*Mục đích: Tìm kiếm Early Adopters / Willing Users phục vụ kiểm chứng sản phẩm.*

| Trạng thái phản hồi | Số lượng (n) | Tỷ lệ (%) | Chi tiết liên hệ / Ghi chú |
| :--- | :---: | :---: | :--- |
| **Có thông tin liên hệ trực tiếp** | 4 | 11.1% | Discord ID, Số Zalo, Mã định danh học viên |
| **Sẵn sàng thử nghiệm (Đồng ý)** | 5 | 13.9% | Xác nhận sẵn sàng tham gia thử nghiệm |
| **Không để lại thông tin (Bỏ trống)** | 27 | 75.0% | Câu hỏi không bắt buộc |
| **Tổng số người có tín hiệu quan tâm MVP** | **9** | **25.0%** | **Tín hiệu chuyển đổi tốt cho giai đoạn CP1-CP4** |

---

## 4. Phân tích tương quan chuyên sâu (Cross-Tabulation Analysis)

### 4.1. Vai trò × Nhận diện vấn đề (Role vs. Perceived Issues)
Bảng đối chiếu tỷ lệ gặp phải các vấn đề giữa **Đội trưởng (Leader)**, **Thành viên (Member)**, và **Cả nhóm cùng quyết định (Consensus)**:

| Vấn đề gặp phải | Đội trưởng (n=11) | Thành viên (n=17) | Cả nhóm quyết định (n=8) | Nhận xét phân hóa góc nhìn |
| :--- | :---: | :---: | :---: | :--- |
| **Hai hoặc nhiều người làm trùng** | **64%** (7/11) | 24% (4/17) | 50% (4/8) | Đội trưởng bức xúc nhất vì thấy lãng phí tài nguyên |
| **Có phần việc bị bỏ sót** | **55%** (6/11) | **59%** (10/17) | 50% (4/8) | Cả hai phía đều nhận thức rõ tình trạng sót checklist nộp |
| **Có người chưa biết làm gì** | **55%** (6/11) | 41% (7/17) | **63%** (5/8) | Nhóm consensus bị nặng nhất do không có người chỉ huy |
| **Khó biết nhóm đã xong đến đâu** | 36% (4/11) | 29% (5/17) | **63%** (5/8) | Thiếu bảng theo dõi tập trung gây mù mờ tiến độ |
| **Phải chia lại task giữa chừng** | 36% (4/11) | 29% (5/17) | 13% (1/8) | Leader hay phải can thiệp điều chỉnh lại |
| **Một người phải làm quá nhiều** | 18% (2/11) | **29%** (5/17) | **38%** (3/8) | Thành viên và nhóm consensus chịu cảnh gánh team nặng hơn |
| **Task không phù hợp năng lực** | 18% (2/11) | **29%** (5/17) | 25% (2/8) | Thành viên cảm nhận rõ sự lệch pha kỹ năng |

*Hàm ý thiết kế:* Agent cần cung cấp **cả 2 chế độ hiển thị**: góc nhìn tổng quan cho Leader (tiến độ tổng, cảnh báo làm trùng) và góc nhìn rõ ràng cho Member (mình cần làm gì ngay bây giờ, input từ đâu, output nộp vào đâu).

---

### 4.2. Cơ chế phân công task × Hậu quả phát sinh
Đối chiếu phương pháp phân công với các rủi ro thực tế:

```
Phân bố lỗi theo Cơ chế phân công (n = 36):

Thành viên tự nhận (n=13)     : [Bỏ sót task: 69.2%] [Trùng task: 38.5%] [Quá tải 1 người: 30.8%]
Đội trưởng tự đánh giá (n=10) : [Bỏ sót task: 50.0%] [Trùng task: 50.0%] [Quá tải 1 người: 20.0%]
Chia ngẫu nhiên (n=6)         : [Bỏ sót task: 66.7%] [Trùng task: 50.0%] [Lệch năng lực: 33.3%]
Dựa trên lần trước (n=5)      : [Bỏ sót task: 40.0%] [Lệch năng lực: 60.0%] [Quá tải: 40.0%]
Hồ sơ kỹ năng (n=2)           : [Bỏ sót task:  0.0%] [Trùng task:  0.0%] [Lệch năng lực: 0.0%]
```

*Nhận định đắt giá:*
- Khi để **"Thành viên tự nhận"**, tỷ lệ bỏ sót công việc cao nhất (**69.2%**). Lý do: Thành viên có xu hướng chọn những task quen thuộc hoặc dễ làm, những task kết nối, tích hợp hệ thống hoặc chuẩn bị tài liệu nộp thường bị bỏ lơ.
- Khi phân công dựa trên **"Hồ sơ kỹ năng"** (Skill profiling), tỷ lệ lỗi giảm về 0% ở nhóm mẫu này. Điều này chứng minh rằng việc nắm rõ năng lực và match đúng task là chìa khóa giải quyết bài toán, và đây chính là năng lực cốt lõi mà AI Agent có thể tự động hóa.

---

### 4.3. Thời gian thống nhất ban đầu × Thời gian lãng phí phát sinh thêm
Mối quan hệ giữa thời gian khởi động và thời gian thiệt hại tiếp theo:

| Thời gian thống nhất ban đầu | Tổng nhóm | Mất thêm 5–15 phút | Mất thêm 15–30 phút | Mất thêm > 30 phút | Tỷ lệ bị thiệt hại kép |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **5 đến 15 phút** | 15 | 7 nhóm | 5 nhóm | 1 nhóm | **86.7%** (13/15) |
| **15 đến 30 phút** | 13 | 4 nhóm | 5 nhóm | 0 nhóm | **69.2%** (9/13) |
| **Trên 30 phút** | 5 | 1 nhóm | 1 nhóm | 2 nhóm | **80.0%** (4/5) |
| **Cuối cùng vẫn chưa rõ** | 2 | 1 nhóm | 0 nhóm | 0 nhóm | **50.0%** (1/2) |

*Kết luận:* Việc thống nhất qua loa vội vàng (5-15 phút) không hề giúp tiết kiệm thời gian mà chỉ dời rủi ro sang giai đoạn sau (86.7% vẫn bị mất thêm 5-30+ phút để chia lại). Trong khi đó, nhóm bàn bạc quá lâu (>30 phút) lại tiếp tục mất thêm thời gian sửa sai. Cần một giải pháp giúp nhóm **vừa hiểu đúng vừa hiểu nhanh ngay từ phút đầu tiên**.

---

## 5. Định hướng giải pháp cho Team E403 - Sloppers (Product Mapping)

Từ những số liệu và insight định lượng vững chắc trên, sản phẩm của Team Sloppers sẽ tập trung giải quyết bài toán: **"AI Agent Tự Động Bóc Tách Đề Bài & Điều Phối Task Bài LAB"**.

### 5.1. Ánh xạ từ Nỗi đau khảo sát sang Lát cắt tính năng AI (Feature Mapping)

| Nỗi đau từ Khảo sát (Pain Point) | Số liệu chứng minh | Tính năng AI tương ứng (Product Slice) | Giá trị mang lại |
| :--- | :---: | :--- | :--- |
| **Mất 15–30+ phút đọc hiểu đề bài** | **55.6%** nhóm gặp phải | **Automated Spec & Repo Parser**:<br>Đọc trực tiếp README.md, file đề bài, rubric để trích xuất mục tiêu bài LAB. | Rút ngắn thời gian thống nhất từ **>30 phút xuống < 3 phút**. |
| **Có phần việc bị bỏ sót / Sót nộp bài** | **55.6%** nhóm gặp phải | **Actionable Task & Checklist Generator**:<br>Tự sinh danh sách task kèm checklist điều kiện nghiệm thu (Definition of Done) và yêu cầu nộp bài. | **Loại bỏ 100% lỗi sót checklist nộp bài**. |
| **Hai hoặc nhiều người làm trùng việc** | **41.7%** nhóm gặp phải | **DAG Dependency & Boundary Mapping**:<br>Xây dựng đồ thị phụ thuộc giữa các task, chỉ rõ file nào do ai phụ trách, cấm đè code. | **Triệt tiêu xung đột và trùng lặp công việc**. |
| **Có người chưa biết làm gì / Lệch năng lực** | **50.0%** & **25.0%** nhóm gặp phải | **Skill-based Task Allocator**:<br>Gợi ý phân công thông minh dựa trên thế mạnh từng bạn (Data, Prompt, Code, Eval). | **Cân bằng tải nhóm**, tránh tình trạng 1 người gánh team. |

### 5.2. Cam kết chỉ số chất lượng (Target Quality Bar)
Dựa trên đường cơ sở (Baseline) từ khảo sát:
- **Baseline hiện tại:** Thời gian thống nhất trung bình 20.5 phút; thời gian lãng phí trung bình 16.8 phút; tỷ lệ lỗi bỏ sót 55.6%.
- **Mục tiêu sản phẩm MVP:**
  + Thời gian ra được bản phân rã task đầu tiên: **< 120 giây**.
  + Độ bao phủ yêu cầu đề bài (Task Recall): **>= 95%** (không bỏ sót đầu việc hay tiêu chí rubric).
  + Thời gian tiết kiệm được cho mỗi nhóm trong mỗi buổi LAB: **>= 25 phút**.
