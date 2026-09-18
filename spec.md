# AI SPEC — VLearn LabSpace · Nhóm Sloppers · Zone E403

> **Mốc tài liệu:** CP4 — 18/09/2026
>
> **Hướng:** ☑ A — VLearn · ☐ B — Trợ lý Học viên · ☐ C — Làn mở
>
> **Loại:** ☐ Tối ưu tính năng có sẵn · ☑ Tính năng mới
> **Trạng thái:** Spec §1–§9 đã hoàn thiện. Quality bar tại §7 được khóa khi commit/nộp CP4; sau thời điểm đó chỉ cập nhật bảng kết quả, không đổi ngưỡng đạt.

## §1. User & Job

### Job executor và workflow hiện tại

**Job executor chính:** nhóm trưởng của một nhóm 3–4 học viên vừa mở một bài LAB/codelab trên VLearn.

Workflow hiện tại:

1. Nhóm đọc nội dung trên VLearn, README/repository và tin nhắn liên quan.
2. Một người tự tóm tắt các deliverable; cả nhóm thống nhất cần làm gì.
3. Nhóm phân công bằng tự nhận việc, leader tự đánh giá hoặc chia ngẫu nhiên.
4. Nhóm tự tạo nơi theo dõi riêng hoặc trao đổi qua chat.
5. Gần hạn nộp, nhóm kiểm tra lại yêu cầu, chia lại việc và xử lý phần bị sót.

### Core JTBD

> Khi bắt đầu một bài LAB theo nhóm, tôi muốn chuyển yêu cầu chính thức thành danh sách việc có người phụ trách, đầu ra và trạng thái rõ ràng, để cả nhóm làm đúng phần, không trùng việc và biết còn thiếu gì trước khi nộp.

### Problem statement

Yêu cầu LAB, cách nộp và phân công đang nằm ở nhiều nguồn. Nhóm phải tự ghép chúng trong thời gian ngắn, dẫn đến bỏ sót deliverable, làm trùng, giao việc lệch năng lực và chỉ phát hiện thiếu sót gần deadline.

### Evidence

Nguồn đầy đủ:

- Câu hỏi khảo sát: [`evidence/survey-form.md`](evidence/survey-form.md)
- Dữ liệu gốc 39 phản hồi: [`evidence/survey-responses.csv`](evidence/survey-responses.csv)
- Cách lọc, đếm và bảng chéo: [`evidence/survey-summary.md`](evidence/survey-summary.md)
- Trích xuất chatlog đã bỏ định danh: [`data/chatlog_eval_sources.json`](data/chatlog_eval_sources.json)

**Khảo sát chuẩn A:** có 39 phản hồi; loại 3 người chưa từng làm LAB nhóm, còn `n=36` mẫu hợp lệ. Trong 36 mẫu:

- `20/36` (55,6%) từng bỏ sót phần việc.
- `18/36` (50,0%) có thành viên chưa biết làm gì.
- `15/36` (41,7%) từng làm trùng một phần việc.
- `14/36` (38,9%) khó biết nhóm đã hoàn thành đến đâu.
- `20/36` (55,6%) mất ít nhất 15 phút để thống nhất yêu cầu hoặc cuối cùng vẫn chưa rõ.
- `27/36` (75,0%) mất thêm ít nhất 5 phút vì phải chia hoặc hiểu lại task.
- `7/36` (19,4%) có tín hiệu sẵn sàng dùng thử; 4 người để lại kênh liên hệ và 3 người đồng ý chung.

**Mining — số kế thừa từ Canvas CP1, chưa tái lập được từ repo public:** [`canvas.md`](canvas.md) ghi nhận 14/2.555 câu hỏi K4 không-preset hỏi trực tiếp về deliverable, cách nộp hoặc trạng thái nộp, cùng mô tả bộ lọc. Tuy nhiên raw file `tutor_turns.csv` không được commit vì ràng buộc dữ liệu; repo chỉ giữ 10 record đã ẩn danh trong `data/chatlog_eval_sources.json`. Vì vậy nhóm chưa thể chạy lại độc lập mẫu số 2.555 và kết quả 14 từ artefact public. Chỉ dùng số mining này làm tín hiệu bổ trợ; khảo sát 39 phản hồi là evidence chính có thể tái lập trong repo.

**Năm ví dụ nguyên văn từ ô trả lời khảo sát** (mã hóa theo thứ tự dòng, không chứa thông tin liên hệ):

| Mã | Vai trò | Nội dung nguyên văn liên quan |
|---|---|---|
| R01 | Đội trưởng/người chia việc | “Hai hoặc nhiều người làm trùng một phần, Có phần việc bị bỏ sót, Task không phù hợp năng lực”; mất thêm “15–30 phút”. |
| R03 | Thành viên nhận task | “Cuối cùng vẫn chưa rõ”; “Khó biết nhóm đã xong đến đâu, Không rõ còn thiếu gì trước khi nộp, Có người bị kẹt nhưng nhóm biết muộn”. |
| R04 | Đội trưởng/người chia việc | “Có người chưa biết làm gì, Phải chia lại task giữa chừng, Khó biết nhóm đã xong đến đâu”. |
| R09 | Thành viên nhận task | “Có người chưa biết làm gì, Có phần việc bị bỏ sót, Phải chia lại task giữa chừng”; hậu quả “Mất thêm thời gian, Trễ deadline”. |
| R17 | Đội trưởng/người chia việc | “Có phần việc bị bỏ sót, Khó biết nhóm đã xong đến đâu”; mất thêm “15–30 phút”. |

Giới hạn: đây là phản hồi lựa chọn từ khảo sát, không phải phỏng vấn mở. Chúng chứng minh tần suất pain nhưng chưa chứng minh sản phẩm hiện tại đã giải quyết được pain; việc đó phải được kiểm tra tại validation CP5.

## §2. Impact & quyết định chọn

| Ứng viên | Bao nhiêu người gặp | Tần suất/chi phí quan sát được | Khả thi trong hackathon | Quyết định |
|---|---:|---|---|---|
| A. Bóc tách checklist canonical thành task có nguồn | 20/36 bỏ sót việc; 31/36 phải đọc README/repo | 55,6% mất ≥15 phút để thống nhất; bỏ sót có thể làm mất điểm | Cao: dữ liệu LAB có cấu trúc và `ref_id` | **Chọn** |
| B. Gợi ý task–owner từ skill tự khai, có human review | 18/36 có người chưa biết làm gì; 9/36 gặp task lệch năng lực | 27/36 mất thêm ≥5 phút; 10/36 phải chia lại task | Cao: nhóm nhỏ, skill được tự khai, leader duyệt | **Chọn** |
| C. Board tiến độ và cảnh báo blocked | 14/36 khó biết tiến độ; 6/36 biết người bị kẹt quá muộn | Rủi ro tăng gần deadline; cần đồng bộ nhiều phiên | Trung bình: UI có, persistence/realtime còn thiếu | Giữ trong working slice nhưng chưa tuyên bố hoàn chỉnh |
| D. Tự kiểm tra và nộp GitHub | 9/36 không rõ còn thiếu gì trước khi nộp; chatlog có câu hỏi trạng thái nộp | Tác động cao nhưng cần GitHub permission và canonical manifest đáng tin cậy | Thấp trong 39 giờ | **Loại khỏi core**, chỉ P2 |
| E. Tự động nhắc/chấm hiệu suất cá nhân | Không có evidence đủ mạnh | Cost-of-error cao, dễ tạo cảm giác giám sát | Không phù hợp ranh giới sản phẩm | **Loại** |

**Ứng viên chọn:** A + B, kèm board C ở mức theo dõi. Đây là tổ hợp tác động trực tiếp lên hai pain lớn nhất: bỏ sót việc (55,6%) và thành viên chưa biết làm gì (50,0%).

**Ứng viên đã loại:** GitHub auto-submit, tự động chấm thành viên, AI giải bài và AI tự phê duyệt. Các chức năng này hoặc thiếu evidence, hoặc có cost-of-error/quyền hạn vượt quá lát cắt.

## §3. Giải pháp tương tự đã nghiên cứu

Nghiên cứu ngày 18/09/2026 từ trang sản phẩm chính thức:

| Sản phẩm | Flow/điểm đáng học | Điểm cần tránh | VLearn LabSpace khác gì |
|---|---|---|---|
| [Jira + Rovo AI](https://www.atlassian.com/software/jira/features) | Bóc tách ý tưởng lớn thành task, gợi ý người phụ trách, board/list/timeline và dependency nằm trong cùng work graph. Human có thể review/chỉnh workflow. | Nền tảng tổng quát và nhiều cấu hình; agent có thể hành động rộng hơn mức an toàn cho một bài LAB ngắn. | Checklist canonical theo đúng `lab_id` là nguồn sự thật; AI chỉ tạo draft, không sửa requirement và không phê duyệt thay leader. |
| [Asana AI / AI Studio](https://asana.com/product/ai) | Intake, routing, task/owner/milestone và “human input” được đặt trong workflow; quyền AI bám quyền dữ liệu hiện có. | Workflow doanh nghiệp/no-code rộng, không giải quyết trực tiếp provenance của yêu cầu học tập hoặc ranh giới giữa hỗ trợ và giải hộ bài. | Nhúng ngay trong VLearn, dùng skill tự khai theo phiên LAB, giấu raw skill khỏi Coach và bắt buộc `CLARIFY` khi thiếu dữ liệu. |

Điểm học chung là gom nguồn việc, owner, trạng thái và vòng duyệt vào một chỗ. Điểm khác biệt cốt lõi của LabSpace là **grounding theo checklist bài học**, **human gate bắt buộc** và **privacy boundary theo vai trò học viên/Coach**.

## §4. Thiết kế

### Lát cắt một câu

> Một nhóm trưởng vừa tạo nhóm trong bài LAB đang mở; hệ thống đọc checklist canonical và skill do thành viên tự khai để đề xuất bản phân công task–owner có lý do/gap hoặc trả `CLARIFY`; leader sửa và phê duyệt trước khi cả nhóm theo dõi tiến độ.

### Non-goals

1. Không tạo, sửa hoặc suy đoán checklist/deliverable chính thức.
2. Không giải bài, viết deliverable thay học viên hoặc tự nộp bài.
3. Không đánh giá/xếp hạng năng lực lâu dài; skill chỉ có hiệu lực trong phiên LAB.
4. Không tự phê duyệt, tự đổi owner hoặc tự tick task hoàn thành.
5. Không cho Coach xem raw skill profile hay hoạt động riêng tư không được nhóm chủ động gửi.
6. Không coi AI GitHub double-check là kết luận chấm điểm chính thức.

### Mức prototype và trạng thái thật/mô phỏng

**Mức nhắm tới:** ☐ Sketch · ☐ Mock · ☑ Working (hybrid, chưa production-ready)

| Phần | Trạng thái tại CP4 |
|---|---|
| React UI: Labs, Lesson, Workspace, role views, assignment review | Chạy được; UI bám mockup tham chiếu. |
| FastAPI + LangGraph Task Analysis/Assignment/Private Chat | Có endpoint, schema, test; cấu hình được model thật qua NVIDIA/OpenAI/Anthropic/Gemini. |
| Model call thật | Đã có ở Task Analysis, Assignment và chat 1:1; lỗi provider trả lỗi/`CLARIFY`, không giả kết quả model. |
| Golden set | Hai bộ độc lập, mỗi bộ 20 case; provenance validator trả `READY`. |
| Auth, group/invite/profile và plan xuyên suốt | UI/demo adapter còn dữ liệu mô phỏng hoặc state cục bộ; backend authorization chưa hoàn chỉnh. |
| Persistence và realtime đa vai trò | Có JSON/DB/WebSocket scaffolding và một số route, nhưng chưa chứng minh end-to-end authenticated/reconnect bằng ba session. |
| Coach/help/submission | Có giao diện/route một phần; chưa đủ acceptance để coi là working production flow. |

### Mức automation

☐ Augment thuần · ☑ **Conditional automation** · ☐ Automate hoàn toàn

AI tự phân tích và đề xuất khi đủ dữ liệu. Nếu thiếu nguồn hoặc skill thì trả `CLARIFY`. Mọi assignment có cost-of-error về công bằng và tiến độ nên leader bắt buộc review/override/approve; checklist canonical không nằm trong quyền sửa của AI.

### §4b. Nguyên tắc HAX/PAIR đã áp dụng

| Nguyên tắc | Áp cụ thể vào prototype |
|---|---|
| Làm rõ AI có thể và không thể làm gì | Welcome text, spec và UI nêu AI chỉ giải thích/đề xuất, không đổi owner/trạng thái/checklist. |
| Cho người dùng biết hệ thống đang làm gì | Loading/progress cho Task Analysis và Assignment; badge nguồn dữ liệu; trạng thái kết nối realtime. |
| Hỗ trợ sửa và kiểm soát | Leader xem draft, đổi owner, regenerate và xác nhận lần cuối trước khi plan có hiệu lực. |
| Scope khi không chắc | Thiếu checklist/skill hoặc nguồn mâu thuẫn trả `CLARIFY`, không bịa task hay match score. |
| Giải thích kết quả | Mỗi assignment có reason, matched skills, confidence và gaps; task analysis giữ `reference_ids`. |
| Giảm thiên kiến xã hội | Skill do thành viên tự khai, không suy đoán từ tên/role; Coach không nhận raw profile; không xếp hạng người. |
| Phục hồi khi lỗi | Model/API lỗi hiển thị lỗi thật; không thay bằng câu trả lời giả được gắn nhãn như LLM. |
| Quyền tối thiểu | Leader/member/Coach có view riêng; Coach chỉ được xem tổng hợp và yêu cầu hỗ trợ chủ động gửi. |

## §5. Kiểu lỗi — bốn lớp chỗ khó và kịch bản

| Lớp | Kịch bản | Rủi ro | Hành vi bắt buộc | Case/bằng chứng |
|---|---|---|---|---|
| 1. Nguồn vào | Thiếu nội dung LAB hoặc `ref_id` | Bịa deliverable | `CLARIFY`, không tạo task | TA-002, TA-011 |
| 1. Nguồn vào | Hai nguồn có deadline/yêu cầu mâu thuẫn | Tự chọn nguồn sai | Nêu mâu thuẫn và yêu cầu xác nhận | TA-012 |
| 1. Nguồn vào | Có nhiều phiên bản LAB | Dùng requirement cũ | Chỉ dùng đúng `lab_id` + version mới | TA-019, TA-020 |
| 1. Nguồn vào | Skill rỗng hoặc chỉ có khoảng trắng | Gán owner vô căn cứ | `CLARIFY`, yêu cầu thành viên khai skill | AS-008, AS-019 |
| 2. Mô hình | Model thêm requirement không có trong nguồn | Hallucination làm sai bài | Schema/reference/coverage validator loại output | Rubric Task Analysis hard gates |
| 2. Mô hình | Keyword/synonym gây match sai (`AI` trong `email`, REST/FastAPI, testing) | Owner sai nhưng trông hợp lý | Word-boundary/semantic validation; confidence thấp hoặc gap | AS-012, AS-013, AS-020 |
| 2. Mô hình | Task không khớp skill nào | Che gap bằng % giả | Fallback cân bằng phải nêu rõ gap; leader review | AS-009, AS-015 |
| 3. Hệ thống | Provider timeout/invalid output/response rỗng | UI hiển thị fake success | HTTP lỗi hoặc `CLARIFY`; cho retry, không giả output model | Integration tests, `ChatModelInvocationError` |
| 3. Hệ thống | Event realtime trùng/cũ hoặc mất kết nối | State lệch giữa ba vai trò | Dedupe theo event/version và fetch snapshot sau reconnect | Chưa hoàn thiện end-to-end tại CP4 |
| 3. Hệ thống | State UI mock ghi đè backend hoặc ngược lại | Chat/board dùng task cũ | Tách mock/HTTP adapter; chat nhận snapshot task hiện tại | Regression tests frontend/private chat |
| 4. Con người/quyền | AI bị yêu cầu giải/nộp bài hoặc tự confirm | Vượt quyền, vi phạm bài thi | Từ chối hoặc chỉ tạo draft `pending_review` | TA-005, TA-006, TA-016, AS-018 |
| 4. Con người/quyền | Leader muốn ép assignment hoặc workload lệch | Bất công/quá tải | Cho override nhưng cảnh báo workload và lưu audit | Assignment review flow; audit persistence còn thiếu |
| 4. Domain | Hai artefact cùng tên “video” nhưng khác mục đích CP3/CP5 | Gộp nhầm deliverable | Giữ task/checkpoint riêng | TA-017 |
| 4. Domain | Dependency vòng | Kế hoạch không thể thực thi | `CLARIFY`, không tạo plan active | TA-018 |

## §6. Bốn đường đi của trải nghiệm

### Happy path

Leader đăng nhập → mở bài LAB → tạo nhóm/mời thành viên → thành viên accept và tự khai skill → hệ thống đọc checklist canonical → model trả draft `READY` có reason/confidence/gap → leader review, override nếu cần và approve → member thấy task → nhóm cập nhật trạng thái → leader/Coach xem tiến độ tổng hợp.

### Low-confidence

Task không có skill khớp rõ hoặc nhiều owner ngang nhau → draft vẫn có thể được tạo nhưng confidence thấp và có gap/cảnh báo → nút approve vẫn là quyết định của leader → leader đổi owner hoặc yêu cầu thành viên bổ sung skill → hệ thống không tự coi gợi ý là final.

### Failure/không căn cứ

Thiếu checklist, `ref_id`, skill hoặc provider lỗi → trả `CLARIFY`/HTTP error với dữ liệu cần bổ sung → không tạo task/assignment giả và không dùng fallback cứng nhưng gắn nhãn LLM → người dùng sửa input hoặc retry.

### Correction

Leader đổi owner khác đề xuất → UI đánh dấu “Leader đã đổi” → confirmation gate hiển thị assignment cuối → plan chỉ có hiệu lực sau xác nhận. Audit `proposed_owner`/`approved_owner` bền vững qua reload vẫn là phần chưa hoàn chỉnh.

### Khi bị đòi ngoài phạm vi

Yêu cầu sửa checklist, giải bài, chấm thành viên, tự nộp hoặc tự approve → trợ lý từ chối phần vượt quyền và hướng người dùng về hành động hợp lệ: bổ sung nguồn, chọn owner, review hoặc tự hoàn thành deliverable.

### Case đặc thù domain

Hệ thống giữ riêng CP3 video thao tác và CP5 video dự phòng; dùng đúng phiên bản LAB/correction note; không bịa link/form nộp khi nguồn chưa cung cấp; private chat chỉ đọc task hiện tại được giao cho người đang hỏi.

## §7. Kiểm thử

### Chiều chất lượng và định nghĩa kiểm chứng được

| Chiều | Điều kiện kiểm chứng |
|---|---|
| Grounding | 100% `reference_ids` của output tồn tại trong input và đúng `lab_id/version`. |
| Coverage | Mỗi requirement bắt buộc có ít nhất một task tham chiếu; không thêm requirement ngoài nguồn. |
| Actionability | Task có title, deliverable, completion criteria, checkpoint và dependency hợp lệ. |
| Assignment | Owner thuộc group; reason dựa trên skill tự khai hoặc nói rõ fallback; workload delta theo case. |
| Uncertainty | Thiếu dữ liệu phải `CLARIFY`; task không khớp skill phải có gap/low-confidence. |
| Authority | Không auto-confirm/persist, không sửa canonical task, không giải hoặc nộp bài thay. |
| Reliability | Model/API lỗi không được trình bày như output thành công; response parse được schema. |
| UX | Leader có thể hiểu, sửa và xác nhận draft; member chỉ thấy/cập nhật phần được phép. |

### Golden set

| Module | Dataset | Cơ cấu | Runner |
|---|---|---|---|
| Task Analysis | [`eval/golden-set-task-analysis.json`](eval/golden-set-task-analysis.json) | 20 case: 9 common, 8 edge, 3 rare; 10 chatlog-derived, 10 synthetic | `eval/scripts/run_live_eval.py` |
| Assignment | [`eval/golden-set-assignment.json`](eval/golden-set-assignment.json) | 20 case: 9 common, 8 edge, 3 rare; 10 chatlog-derived, 10 synthetic | `eval/scripts/run_assignment_live_eval.py` / backend runner |

Ngày 18/09/2026, `python eval/scripts/validate_golden_set.py --submission-ready` trả `READY` cho cả hai bộ.

### Quality bar CP4 — khóa tại mốc nộp

> **Sản phẩm đạt khi cả Task Analysis và Assignment đều đạt ít nhất 75% case của golden set tương ứng; đồng thời 100% case source-truth không có reference/requirement giả, 100% owner thuộc group, 100% case ngoài thẩm quyền không thực hiện hành động bị cấm, và không có lỗi provider nào bị trình bày như kết quả AI thành công.**

Điều kiện cứng có quyền làm tổng kết quả **không đạt** dù tỷ lệ chung ≥75%. Ngưỡng 75% của Task Analysis kế thừa [`eval/rubric.md`](eval/rubric.md); ngưỡng Assignment được khóa tại CP4 và không hạ xuống để hợp thức hóa kết quả hiện tại.

### Kết quả các lượt chạy

| Lượt | Kết quả | Kết luận trung thực |
|---|---:|---|
| Task Analysis live run 1 | 19/20 (95,0%) | Chạy live model NVIDIA NIM (`meta/llama-3.2-11b-vision-instruct`) qua endpoint `POST /api/v1/labs/analyze`; đạt quality bar (≥75%); 1 case còn lại (TA-009) do mô hình tách 6 task chi tiết so với rubric 4–5. |
| Assignment rule-based run 1 | 16/20 (80%) | Qua ngưỡng số học nhưng đây không phải bằng chứng model call thật; còn lỗi substring/synonym/skill bẩn. |
| Assignment live API run 1 | 13/20 (65%), latency trung bình 3,07 giây | Có model call thật nhưng **chưa đạt quality bar 75%**; 7 case fail, trong đó có cả grader wording và validation/integration. |
| Video thao tác CP3 | Đã có video 30 giây | Nhóm xác nhận đã có video; artefact nằm ngoài repo. Trạng thái nộp đúng hạn cần đối chiếu bằng phiếu CP3 của đội trưởng. |
| Backend automated tests tại CP4 | 88 pass, 4 xfail | Chứng minh contract/unit/integration hiện tại, không thay thế live golden-set score. |
| Frontend automated tests tại CP4 | 25 pass; production build thành công | Chứng minh component/adapter build được, chưa thay thế multi-session acceptance test. |

Các kết quả chi tiết nằm trong [`eval/results/`](eval/results/). Không đổi expected output để ép pass; bốn case nghi false-negative của Assignment phải được hai người chấm độc lập trước khi công bố adjusted score.

## §8. Phân công & kế hoạch

| Thành viên | Trách nhiệm chính | Artefact/phạm vi |
|---|---|---|
| **Lê Thị Thùy Trang** | Evidence mining, khảo sát, UI owner và acceptance QA | `evidence/`, `codebase/frontend/`, visual/accessibility review |
| **Hoàng Quốc Dũng** | Frontend data integration, API/realtime client và integration test | API adapter, state binding, realtime client, frontend tests |
| **Lâm Hải Dương** | Data model, LangGraph/prompt/schema và golden set/eval | `codebase/backend/src/agent/`, `eval/`, AI tests |
| **Phạm Hoàng Trọng** | Product scope, Canvas/Spec, backend application, Coach flow và điều phối demo | `canvas.md`, `spec.md`, API/core/persistence, CP submission |

### Willing users và kế hoạch validation

Willing users đã khai từ CP1: `R05`, `R09`, `R17`, `R32` (mã hóa; thông tin liên hệ chỉ nằm trong evidence có kiểm soát).

Kế hoạch CP5:

1. Mời 5 người ngoài nhóm, tối thiểu 2 người trong danh sách trên.
2. Giao cùng một task: mở bài LAB, tạo/nhận nhóm, xem assignment và xác định “tôi cần làm gì/nhóm còn thiếu gì”.
3. Không hướng dẫn trong lúc thử; ghi thời điểm kẹt, hành vi và quote nguyên văn.
4. Ghi log tại `validation/`: mã người thử, task, quan sát, quote, severity và quyết định.
5. Thực hiện ít nhất một thay đổi dựa trên feedback và cập nhật §9.

**Trạng thái tại CP4:** `validation/` chưa có log user test; chưa được tuyên bố hoàn thành R6.

### Multi-prototype

Không làm multi-prototype trong phạm vi 39 giờ. Nhóm chọn một phương án: LabSpace nhúng trong VLearn với human approval gate. Lý do là evidence tập trung vào phân mảnh nguồn và phối hợp nhóm; làm thêm chatbot/ứng dụng độc lập sẽ tăng phạm vi mà không tăng độ tin cậy của core flow.

## §9. Changelog

| Thời điểm | Đổi gì | Vì sao / bằng chứng |
|---|---|---|
| 17/09/2026 · CP1 | Chốt lát cắt canonical checklist → draft assignment → leader approve | Survey: 55,6% bỏ sót việc; 50,0% có người chưa biết làm gì; cost-of-error yêu cầu human gate. |
| 18/09/2026 · CP3 | Tách Task Analysis và Assignment thành hai golden set 20 case | Hai quyết định có failure mode khác nhau; cần đo grounding riêng với skill matching. |
| 18/09/2026 · sau eval 1 | Giữ nguyên 7 fail live Assignment và phân loại grader/validation | `assignment-live-run-1-summary.md`; không sửa expected để ép score. |
| 18/09/2026 · integration | Loại bỏ fallback chat giả, bắt buộc model thật hoặc lỗi rõ ràng | Acceptance nội bộ phát hiện UI có thể trình bày câu trả lời deterministic như LLM. |
| 18/09/2026 · integration | Chat 1:1 đọc snapshot task đang hiển thị thay vì task seed cũ | Regression nội bộ: board có 4 task mới nhưng trợ lý trả 2 task mock đã hoàn thành. |
| 18/09/2026 · CP4 | Hoàn thiện §1–§9 và khóa quality bar 75% + hard gates | Yêu cầu CP4; ngưỡng không được hạ sau khi nộp. |
| 18/09/2026 · evidence correction | Sửa willing-user signal từ 9/36 thành 7/36 | Đếm lại CSV gốc: 4 liên hệ trực tiếp + 3 đồng ý chung; loại 1 phản hồi từ chối/tiêu cực. |
| 18/09/2026 · task analysis eval | Cập nhật kết quả live eval Task Analysis đạt 19/20 (95,0%) | Đã fix guardrail authority/boundary, version filtering và granularity; model thật NVIDIA NIM vượt quality bar 75%. |

### Tự khai phần chưa hoàn thành tại CP4

- [ ] Assignment live đang 13/20 (65%), chưa đạt quality bar 75%.
- [ ] Auth/session và authorization backend theo role chưa hoàn chỉnh; demo login vẫn dùng fixture.
- [ ] Coach reply/resolve, GitHub double-check và submission còn một phần mô phỏng/chưa hoàn thiện.
- [ ] `validation/` chưa có 5 user-test log và chưa có thay đổi dựa trên feedback ngoài nhóm.
- [ ] Việc commit/push `spec.md` và nộp link form CP4 phải do đội trưởng xác nhận trước hạn.

Các mục trên là backlog sau CP4; không được diễn giải màn hình mock hoặc test tự động như bằng chứng chúng đã hoàn thành.
