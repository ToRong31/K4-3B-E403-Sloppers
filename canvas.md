# VLearn LabSpace — Canvas CP1

| # | Dòng | Nội dung |
|---|---|---|
| 1 | **Track + đề** | **A · A2 — tính năng AI mới trên VLearn:** VLearn LabSpace, workspace nhóm theo từng bài lab/codelab để phân công task, theo dõi checklist/deliverable và giúp coach xem tiến độ ở mức nhóm. |
| 2 | **Job executor** | **Nhóm trưởng** vừa tạo nhóm trong một bài lab/codelab đang mở trên VLearn, cần biến yêu cầu chính thức thành các task có owner rõ ràng và bao phủ đủ deliverable cần nộp. |
| 3 | **Pain một câu** | Khi nhóm thay đổi mỗi buổi, học viên phải ghép yêu cầu lab, cách nộp và phân công từ nhiều nơi; task, owner và checklist rời rạc khiến nhóm làm trùng, bỏ sót deliverable hoặc chỉ nhận ra chưa sẵn sàng nộp vào phút cuối. |
| 4 | **1–2 bằng chứng đầu** | **Mining:** `14/2.555` câu hỏi K4 không-preset hỏi trực tiếp về deliverable, cách nộp hoặc trạng thái nộp lab. **Cách đếm:** lọc `cohort_hint = K4`, `is_preset = False` trong `data/vlearn-pack/chatlog/tutor_turns.csv`, bỏ context bài học rồi tìm `deliverable \| kết quả cần nộp \| cần nộp \| nộp bài \| nộp link \| hạn nộp`. Mã minh họa: `T10323`, `T10349`, `T10705`, `T11149`, `T11557`. **Giới hạn:** số liệu này chỉ chứng minh nhu cầu hiểu yêu cầu/nộp bài, chưa chứng minh pain phối hợp nhóm. **Khảo sát:** `TODO CP1 — điền 39/20` học viên từng gặp task trùng/bỏ sót, không rõ owner hoặc không biết nhóm còn thiếu gì để nộp; bổ sung đường dẫn log trong `validation/`. |
| 5 | **Lát cắt MỘT CÂU** | **Một nhóm trưởng · vừa tạo nhóm trong bài lab đang mở · AI đọc checklist canonical của bài và skill tự khai để quyết định bản phân công task–owner có thể sửa, hoặc trả `CLARIFY` khi thiếu dữ liệu · nhóm nhận board đã xác nhận để theo dõi tiến độ đến lúc nộp.** |
| 6 | **AI tự làm đến đâu + willing users** | **Tự:** đề xuất plan task–owner, nêu lý do, gap và dữ liệu còn thiếu. **Không tự:** tạo/sửa checklist chính thức, bịa deliverable, suy đoán skill, ép/gán/đổi task, giải bài, chấm thành viên hoặc gửi help request; nhóm luôn sửa và xác nhận trước khi plan có hiệu lực. **Lý do:** sai requirement có thể làm mất điểm, còn phân công sai ảnh hưởng công bằng và tiến độ, nên AI chỉ tạo bản nháp có thể sửa. **Willing users ngoài nhóm:** `TODO CP1 — điền ít nhất 3 người đã đồng ý, kèm vai trò`. |
| 7 | **Phân công có tên** | **Lê Thị Thùy Trang** — evidence mining, khảo sát và lưu log · **Hoàng Quốc Dũng** — VLearn UI tạo/join nhóm, task board và kiểm thử · **Lâm Hải Dương** — data model/checklist, AI prompt/schema và golden set/eval · **Phạm Hoàng Trọng** — canvas/spec, coach view, điều phối demo và user test. |

## Việc phải hoàn tất trước khi nộp CP1

- Thay kết quả `TODO CP1` ở dòng 4 bằng số khảo sát thật và đường dẫn log kiểm chứng được.
- Thay `TODO CP1` ở dòng 6 bằng ít nhất 3 willing users ngoài nhóm đã đồng ý tham gia thử nghiệm.
- Không đưa data pack, chatlog dài, API key hoặc dữ liệu định danh nhạy cảm lên repo công khai.
