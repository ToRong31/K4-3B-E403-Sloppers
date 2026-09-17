const CodeBlock = ({ children }) => <pre className="lab-code"><code>{children}</code></pre>;

const Callout = ({ children, tone = 'info' }) => (
  <aside className={`lab-callout ${tone}`}>
    <span aria-hidden="true">💡</span>
    <div>{children}</div>
  </aside>
);

const FeedbackBar = () => (
  <div className="lab-feedback" aria-label="Phản hồi bài học">
    <button type="button" aria-label="Hữu ích">♡</button>
    <button type="button" aria-label="Chưa hữu ích">♧</button>
    <button type="button" aria-label="Báo cáo nội dung">⚐</button>
  </div>
);

const PageOne = () => (
  <>
    <h1>Chuẩn bị đội ngũ, chọn track và khởi tạo repository</h1>
    <div className="lesson-summary">
      <span aria-hidden="true">✓</span>
      <div><b>Về bài lab này</b><p>Xây dựng AI Spec, prototype có gọi AI thật và bộ kiểm thử định lượng cho một tính năng sản phẩm AI theo nhóm.</p></div>
    </div>

    <h2>Lab 05–06 — AI Product Hackathon: SPEC → Prototype → Demo</h2>
    <h2>Bạn làm được gì sau bài này</h2>
    <ul className="outcome-list">
      <li>Xác định lát cắt sản phẩm AI một câu từ dữ liệu thực tế và phân tích bài toán người dùng.</li>
      <li>Hoàn thành tài liệu AI Spec §1–§9 và chốt quality bar định lượng trước hạn CP4.</li>
      <li>Xây dựng prototype chạy end-to-end có ít nhất một lời gọi AI thật ở quyết định trung tâm.</li>
      <li>Thiết lập golden set tối thiểu 20 case kiểm thử và đo lường tỷ lệ đạt thực tế.</li>
    </ul>

    <h2>Cần chuẩn bị</h2>
    <ul>
      <li>Kiến thức prompt engineering, tool calling và kiến trúc RAG từ các bài học trước.</li>
      <li>Tài khoản GitHub và quyền truy cập môi trường lập trình Python/Node.js.</li>
      <li>Git và GitHub; tạo repository công khai, không fork repository đề bài.</li>
      <li>Python 3.10+ hoặc framework phát triển web/prototype tương đương.</li>
      <li>Công cụ soạn thảo và xuất slide chuẩn PDF.</li>
    </ul>

    <Callout tone="warning"><b>Lỗi thường gặp</b><p>Fork repo đề bài làm lộ dữ liệu nội bộ; tạo repo mới hoàn toàn và chỉ sao chép file template cần thiết. Không tích hợp AI thật vào prototype hoặc không lưu trace log sẽ không đủ bằng chứng kỹ thuật.</p></Callout>

    <p>Giai đoạn chuẩn bị giúp nhóm thống nhất nhân sự, định hướng bài toán và thiết lập không gian làm việc an toàn trên GitHub. Nhóm tập trung vào tư duy thiết kế sản phẩm AI: tìm đúng nỗi đau có bằng chứng, chốt lát cắt khả thi và kiểm chứng giải pháp bằng số liệu.</p>
    <p>Lớp 3B có 39 giờ tính từ lúc phát đề đến lúc thuyết trình. Nhóm gồm 3–4 người, chia cụm theo bàn và không bắt buộc chung đề tài. Nhóm càng ít người thì lát cắt càng phải nhỏ.</p>

    <div className="resource-link"><b>📦 Repository đề bài chính thức</b><span>github.com/VinUni-AI20k/K4-3B-Day05-06-AI-Product-Hackathon</span></div>
    <div className="resource-link"><b>Sheet tracking nội dung</b><span>Mở bảng theo dõi checkpoint CP1–CP5</span></div>

    <ol className="numbered-steps">
      <li>Đọc <code>01-challenge-brief.md</code> để nắm khung chung và 5 tiêu chí nghiệm thu; mở <code>tracks/README.md</code> để khảo sát 5 track. Cả nhóm thống nhất một track duy nhất và một đề cụ thể.</li>
      <li>Truy cập GitHub và tạo một repository mới hoàn toàn ở chế độ công khai. Đặt tên theo quy tắc:</li>
    </ol>
    <CodeBlock>{`K4-3B-<phòng>-<tên nhóm>`}</CodeBlock>
    <p>Ví dụ hợp lệ: <code>K4-3B-E403-ChamCongAI</code> hoặc <code>K4-3B-E402-DiscordBuddy</code>. Phần đầu bắt buộc đúng, phần tên nhóm viết liền không dấu.</p>
    <CodeBlock>{`git init
echo "# K4-3B-E403-ChamCongAI" > README.md
git add README.md
git commit -m "chore: initial commit for hackathon project"
git branch -M main
git remote add origin https://github.com/<tai-khoan>/K4-3B-E403-ChamCongAI.git
git push -u origin main`}</CodeBlock>
    <ol className="numbered-steps" start="3">
      <li>Sao chép nguyên vẹn <code>03-ai-spec-template.md</code> về thư mục gốc và đổi tên thành <code>spec.md</code>. Sao chép <code>README.md</code> từ repo đề bài rồi điền đầy đủ thành viên và phân công.</li>
    </ol>
    <Callout><b>Quy định bảo mật dữ liệu khóa học</b><p>Không commit data pack, chatlog VLearn, tin nhắn Discord đã ẩn danh, transcript và slide bài giảng thật. Tuyệt đối không fork và không commit bất kỳ dữ liệu nào trong <code>data/</code>.</p></Callout>
    <Callout><b>Hai kênh nộp bài</b><p>Checkpoint CP1–CP5 do đội trưởng nộp qua form; link repo GitHub trên VLearn do mọi thành viên tự nộp. Hai kênh song song, không thay thế nhau.</p></Callout>
    <Callout><b>Tự kiểm tra điều kiện sẵn sàng</b><p>Đã chốt 3–4 thành viên, đội trưởng, repository Public đúng cú pháp, có <code>spec.md</code>, <code>README.md</code> và ít nhất một commit ban đầu.</p></Callout>
    <p>Hoàn thành giai đoạn chuẩn bị khi repository của nhóm hiển thị công khai trên GitHub, chứa đúng các tệp quy định và có ít nhất một commit ban đầu được ghi nhận.</p>
    <FeedbackBar />
  </>
);

const PageTwo = () => (
  <>
    <h1>Khám phá bài toán, thu thập bằng chứng và chốt Canvas 7 dòng (CP1)</h1>
    <p>Mục tiêu cốt lõi của giai đoạn này là xác định rõ đối tượng hưởng lợi và nỗi đau thực tế trước khi bắt tay vào xây dựng sản phẩm. Nhóm phải khai thác một lát cắt có bằng chứng xác thực và được trợ giảng thẩm định sớm.</p>
    <p>Một bài toán đạt tiêu chuẩn khi thỏa mãn định nghĩa lát cắt một câu: đúng một người dùng cụ thể, thực hiện một công việc cụ thể, thông qua một quyết định AI cụ thể, để tạo ra một kết quả đo đếm được. Bằng chứng phải định lượng được: chuẩn A yêu cầu khảo sát tối thiểu 20 người với ít nhất 50% xác nhận kèm log đầy đủ; chuẩn B yêu cầu mining dữ liệu với số đếm rõ ràng, tối thiểu 5 ví dụ nguyên văn và phương pháp đếm kiểm lại được.</p>
    <p>Dữ liệu trong <code>data/</code> đủ để mining ngay: chatlog VLearn tutor có 13.494 lượt hỏi–đáp, Discord có 1.092 tin nhắn giai đoạn onboarding và 4 bản tin ngày do bot tự sinh, cùng 6 transcript bài giảng và 2 bộ slide.</p>

    <div className="flow-diagram" aria-label="Quy trình chốt lát cắt">
      {['Nỗi Đau Thực Tế', 'Bằng Chứng Số Liệu\n(Chuẩn A/B)', 'Lát Cắt MỘT CÂU', 'Canvas 7 Dòng & Phân Công (CP1)', 'Prototype & Spec Kỹ Thuật'].map((item, index) => (
        <div key={item}><span>{item}</span>{index < 4 && <i aria-hidden="true">↓</i>}</div>
      ))}
    </div>

    <ol className="numbered-steps">
      <li>Khai thác dữ liệu trong thư mục <code>data/</code> của repo đề bài hoặc khảo sát trực tiếp tối thiểu 20 học viên ngoài nhóm. Ghi toàn bộ nhật ký câu hỏi, câu trả lời nguyên văn và các con số thống kê vào tệp evidence của nhóm.</li>
      <li>Soạn Canvas đúng scaffold 7 dòng tại mục §1.5 của <code>02-guide.md</code>.</li>
    </ol>

    <div className="lab-table-wrap"><table className="lab-table"><thead><tr><th>#</th><th>Dòng</th><th>Nội dung cần điền</th></tr></thead><tbody>
      <tr><td>1</td><td>Track + đề</td><td>Track A–E và đề cụ thể đã chọn</td></tr>
      <tr><td>2</td><td>Job executor</td><td>Ai · đang ở đâu · đang làm gì</td></tr>
      <tr><td>3</td><td>Pain một câu</td><td>Ai – đang làm gì – vướng đâu – hậu quả gì</td></tr>
      <tr><td>4</td><td>1–2 bằng chứng đầu</td><td>Số + cách đếm + mã hội thoại/tin nhắn, hoặc khảo sát có số người</td></tr>
      <tr><td>5</td><td>Lát cắt MỘT CÂU</td><td>1 user · 1 việc · 1 quyết định AI · 1 kết quả</td></tr>
      <tr><td>6</td><td>Automation + willing users</td><td>AI tự làm đến đâu + lý do + tên willing users ngoài nhóm</td></tr>
      <tr><td>7</td><td>Phân công</td><td>Mỗi đầu việc một tên cụ thể</td></tr>
    </tbody></table></div>

    <ol className="numbered-steps" start="3">
      <li>Đưa nội dung Canvas vào mục §1 và §2 của <code>spec.md</code>, sau đó commit và đẩy lên nhánh chính.</li>
    </ol>
    <CodeBlock>{`git add spec.md canvas.md
git commit -m "docs: finalize CP1 canvas and evidence log"
git push origin main`}</CodeBlock>
    <p>Đội trưởng đại diện nhóm truy cập form CP1, điền họ tên, mã học viên, link repository công khai, nội dung Canvas 7 dòng và danh sách willing users. Hạn chót mốc CP1 là <b>19:30 ngày 17/9</b>.</p>
    <Callout tone="warning"><b>Khai báo willing user ngay tại CP1</b><p>Nhóm bắt buộc điền tên cụ thể của ít nhất 2 người dùng sẵn sàng thử nghiệm ngoài nhóm. Đây là điều kiện tiên quyết để nghiệm thu khối điểm R6 tại mốc CP5.</p></Callout>
    <p>Mốc CP1 hoàn thành khi form nộp bài của đội trưởng được ghi nhận đúng hạn và liên kết repository mở ra kiểm tra được đầy đủ nội dung Canvas đã commit.</p>
    <FeedbackBar />
  </>
);

const PageThree = () => (
  <>
    <h1>Thiết kế luồng trải nghiệm và dựng bản mẫu tương tác (CP2)</h1>
    <p>Giai đoạn thiết kế luồng nhằm phát hiện các lỗ hổng trải nghiệm và bất cập logic trước khi đầu tư thời gian vào lập trình mô hình. Khi thể hiện toàn bộ tương tác trên bản mẫu, nhóm kiểm tra được người dùng bấm vào đâu, hệ thống phản hồi thế nào và luồng xử lý kết thúc ở điểm nào.</p>
    <p>Trong thiết kế sản phẩm AI, nhóm xác định mức độ tự động hóa dựa trên chi phí sai sót. Mức <b>Augment</b> dùng khi sai thì đắt và người quyết định cuối là con người; mức <b>Conditional</b> dùng cho case chắc và chuyển người với case mơ hồ; mức <b>Automate</b> chỉ dùng khi sai thì rẻ và người dùng tự thấy, tự sửa được.</p>
    <p>Song song, nhóm thiết kế bốn đường đi của trải nghiệm theo <code>spec.md</code> §6: happy path, low-confidence, failure/no-grounding và correction. Chọn tối thiểu 4 nguyên tắc HAX/PAIR và ghi rõ áp dụng cụ thể vào đâu trong prototype.</p>
    <ol className="numbered-steps">
      <li>Thiết kế toàn bộ hành trình người dùng dưới một trong ba hình thức:</li>
    </ol>
    <ul>
      <li>Bản mẫu tương tác dựng trên Figma, Canva hoặc trang tĩnh HTML/CSS/JS.</li>
      <li>Sơ đồ luồng thể hiện rõ các bước nhập liệu, điểm gọi quyết định AI và nhánh xử lý ngoại lệ.</li>
      <li>Video quay màn hình đi hết một vòng lặp tương tác từ đầu vào đến đầu ra cuối cùng.</li>
    </ul>
    <ol className="numbered-steps" start="2">
      <li>Cập nhật thiết kế vào mục §4 và §6 của <code>spec.md</code>: mức prototype, phần chạy giả lập/chạy thật và bảng bốn nguyên tắc HAX/PAIR.</li>
      <li>Lưu mã nguồn giao diện hoặc ảnh chụp sơ đồ luồng vào thư mục <code>codebase/</code>.</li>
    </ol>
    <CodeBlock>{`mkdir -p codebase
git add codebase/ spec.md
git commit -m "feat: complete CP2 interactive flow and design principles"
git push origin main`}</CodeBlock>
    <p>Đội trưởng nộp liên kết kiểm chứng bản mẫu qua form CP2 trước <b>21:00 ngày 17/9</b>.</p>
    <Callout><b>Yêu cầu kỹ thuật tại mốc CP2</b><p>Tại mốc này chưa yêu cầu mô hình AI chạy thật — phần đó để CP3. Bản mẫu chỉ cần chứng minh tính thông suốt của luồng nghiệp vụ và cách xử lý giao diện khi người dùng thao tác.</p></Callout>
    <p>Dấu hiệu hoàn thành mốc CP2 là một bản mẫu chạy thông suốt từ đầu đến cuối, tệp <code>spec.md</code> cập nhật đầy đủ bốn nhánh trải nghiệm và form nộp được ghi nhận đúng hạn.</p>
    <FeedbackBar />
  </>
);

const PageFour = () => (
  <>
    <h1>Xây dựng prototype AI thật và đo lường kiểm thử sơ bộ (CP3)</h1>
    <p>Mục tiêu của giai đoạn này là chuyển hóa thiết kế thành nguyên mẫu có khả năng thực thi thực tế và thiết lập thước đo định lượng cho sản phẩm. Sản phẩm bắt buộc có ít nhất một lệnh gọi mô hình AI thật tại mắt xích quyết định trung tâm.</p>
    <p>Thước đo chất lượng được cụ thể hóa bằng bộ kiểm thử mẫu (golden set) tối thiểu 20 case do nhóm tự xây, phản ánh đa dạng tình huống: Nguồn sự thật, Mơ hồ/thiếu thông tin, Ngoài phạm vi/thẩm quyền và Đặc thù domain. Ít nhất 10 case phải lấy hoặc phát triển từ chatlog thật trong <code>data/</code>.</p>
    <p>Trước khi viết case, nhóm chạy thử 10–20 input qua prototype và đọc từng output, ghi thô theo ba mức: dùng được, sửa được, không chấp nhận được. Sau đó đặt tên cho từng nhóm lỗi và đối chiếu với 4 lớp chỗ khó để không bỏ sót.</p>
    <ol className="numbered-steps">
      <li>Lập trình module quyết định trung tâm trong <code>codebase/</code>, tích hợp API gọi mô hình AI thật. Thiết lập cơ chế ghi vết rõ ràng cho prompt đầu vào và phản hồi thô của mô hình.</li>
      <li>Xây dựng tệp dữ liệu kiểm thử trong <code>eval/</code> định dạng <code>.json</code> hoặc <code>.csv</code>, chứa đủ 20 case đã phân loại theo taxonomy 4 lớp chỗ khó.</li>
      <li>Tổng hợp kết quả thực thi lượt đầu vào một tệp trong <code>eval/</code>, lập bảng thống kê số case đạt, số case thất bại, tỷ lệ phần trăm và phân tích nguyên nhân.</li>
      <li>Quay video màn hình 30 giây thể hiện thao tác trực tiếp: nhập dữ liệu, hệ thống gửi yêu cầu và mô hình AI trả về kết quả thật theo thời gian thực.</li>
      <li>Đẩy toàn bộ mã nguồn, dữ liệu kiểm thử và kết quả đánh giá lên repository.</li>
    </ol>
    <CodeBlock>{`git add codebase/ eval/
git commit -m "feat: integrate live AI call and document run 1 eval results"
git push origin main`}</CodeBlock>
    <p>Đội trưởng nộp video thao tác 30 giây và số đo kiểm thử lượt đầu qua form CP3 trước <b>16:00 ngày 18/9</b>.</p>
    <Callout tone="warning"><b>Nguyên tắc trung thực trong số đo kiểm thử</b><p>Kết quả “thử 21 câu, 13 câu trả đúng có dẫn nguồn, 8 câu sai hoặc bịa” kèm phân tích nguyên nhân được đánh giá cao hơn tuyên bố độ chính xác cao mà không có log chứng minh.</p></Callout>
    <p>Hoàn thành CP3 khi mã nguồn chứng minh được lời gọi AI thật không gán cứng, thư mục <code>eval/</code> có đầy đủ 20 case kèm kết quả đo đếm và video 30 giây được nộp đúng hạn.</p>
    <FeedbackBar />
  </>
);

const PageFive = () => (
  <>
    <h1>Hoàn thiện tài liệu AI Spec và khóa ngưỡng chất lượng (CP4)</h1>
    <p>Tài liệu AI Spec là sản phẩm bàn giao trung tâm của toàn bộ sự kiện. Việc hoàn thiện và khóa tài liệu tại mốc CP4 buộc nhóm chuẩn hóa toàn bộ quyết định sản phẩm thành văn bản kỹ thuật hoàn chỉnh: từ bằng chứng người dùng, thiết kế trải nghiệm, taxonomy rủi ro cho đến bộ tiêu chí nghiệm thu định lượng.</p>
    <p>Khái niệm cốt lõi tại mốc này là đóng băng ngưỡng chất lượng (quality bar). Quality bar là cam kết bằng con số xác định điều kiện để sản phẩm được coi là đạt, viết theo mẫu “Đạt khi ≥ ___% qua bộ, và [điều kiện cứng]”.</p>
    <ol className="numbered-steps">
      <li>Rà soát và hoàn thiện toàn diện <code>spec.md</code> theo cấu trúc §1–§9 của <code>03-ai-spec-template.md</code>:</li>
    </ol>
    <ul className="spec-sections">
      <li><b>§1 & §2</b> — Job executor, workflow, core JTBD, problem statement không chứa chữ AI, evidence chuẩn A/B kèm ≥5 quote nguyên văn và bảng impact.</li>
      <li><b>§3 & §4</b> — Phân tích ≥2 sản phẩm tương tự, lát cắt một câu, tối thiểu 3 non-goals, mức automation và bảng đối chiếu ≥4 nguyên tắc HAX/PAIR.</li>
      <li><b>§5 & §6</b> — Bốn lớp chỗ khó với tối thiểu 8 kịch bản và bốn đường đi của trải nghiệm.</li>
      <li><b>§7</b> — Chiều chất lượng kèm định nghĩa kiểm chứng được, liên kết golden set trong <code>eval/</code>, công thức quality bar và bảng kết quả các lượt chạy.</li>
      <li><b>§8 & §9</b> — Phân công có tên theo từng đầu việc, danh sách willing users, kế hoạch validation và changelog ghi nhận thay đổi.</li>
    </ul>
    <ol className="numbered-steps" start="2">
      <li>Ghi nhận chính thức công thức quality bar vào §7. Tự khai rõ chức năng hoặc case kiểm thử chưa kịp xử lý.</li>
      <li>Commit và đẩy phiên bản chốt của <code>spec.md</code> lên GitHub trước 21:00.</li>
    </ol>
    <CodeBlock>{`git add spec.md
git commit -m "docs: finalize spec.md and freeze quality bar for CP4"
git push origin main`}</CodeBlock>
    <p>Đội trưởng sao chép đường dẫn trực tiếp tới tệp <code>spec.md</code> trên GitHub và nộp qua form CP4 trước <b>21:00 ngày 18/9</b>.</p>
    <Callout tone="warning"><b>Thời hạn đóng băng ngưỡng chất lượng</b><p>Sau 21:00 ngày 18/9, quality bar trong <code>spec.md</code> được khóa và không chỉnh sửa nữa. Nhóm vẫn tiếp tục cập nhật bảng kết quả các lượt chạy ở §7 cho đến trước CP6.</p></Callout>
    <p>Dấu hiệu hoàn thành CP4 là tệp <code>spec.md</code> có lịch sử commit trước 21:00 ngày 18/9, điền đầy đủ §1–§9 theo template và thông tin nộp form được ghi nhận.</p>
    <FeedbackBar />
  </>
);

const PageSix = () => (
  <>
    <h1>Xác thực người dùng ngoài nhóm, xuất bản slide và đóng gói dự phòng (CP5)</h1>
    <p>Mốc CP5 hoàn tất toàn bộ hồ sơ kỹ thuật và chuẩn bị phương án dự phòng rủi ro cho buổi thuyết trình. Slide chuẩn PDF cùng video quay sẵn kịch bản demo sẽ bảo vệ nhóm khỏi sự cố kỹ thuật nếu hôm pitch mạng chết.</p>
    <p>Đây cũng là thời điểm triển khai khối kiểm chứng R6 với người dùng ngoài nhóm. Mỗi phiên thử kéo dài khoảng 10 phút theo năm nhịp: trấn an người thử, mời tác vụ, quan sát không chỉ dẫn, hỏi sau khi dùng và ghi nguyên văn.</p>
    <p>Khi đọc log, nhóm xếp bằng chứng theo bốn tầng: hành vi quan sát được là mạnh nhất, kế đến là lời nói trong lúc dùng, rồi giải thích khi được hỏi, yếu nhất là dự đoán tương lai kiểu “mình sẽ dùng”.</p>
    <ol className="numbered-steps">
      <li>Mời ít nhất 2 người ngoài nhóm trải nghiệm trực tiếp prototype, ưu tiên willing users đã khai từ CP1. Ghi nhận vào <code>validation/</code>: người thử, task đã giao, quan sát, quote nguyên văn và mức nghiêm trọng.</li>
      <li>Dựa trên phản hồi, thực hiện 1–2 thay đổi cụ thể trước demo và cập nhật vào §9 Changelog của <code>spec.md</code>.</li>
      <li>Soạn bộ slide đúng 6 trang theo <code>02-guide.md</code> §5.1, mỗi trang có ít nhất một con số, quote có nguồn hoặc kết quả đo:</li>
    </ol>
    <ul className="slide-list">
      <li><b>Trang 1 · User & Job:</b> job executor, core JTBD một câu, con số pain.</li>
      <li><b>Trang 2 · Vì sao chọn tính năng này:</b> bảng impact rút gọn 3 ứng viên.</li>
      <li><b>Trang 3 · Giải pháp & demo live:</b> lát cắt một câu, automation theo cost-of-error, demo một case chuẩn và một case chỗ khó.</li>
      <li><b>Trang 4 · Kết quả đo:</b> % qua golden set đối chiếu quality bar và failure đáng kể nhất.</li>
      <li><b>Trang 5 · User thật nói gì:</b> ≥2 quote nguyên văn kèm tên/vai và thay đổi đã làm.</li>
      <li><b>Trang 6 · Nếu có thêm 1 tuần:</b> 2–3 việc ưu tiên trở về feedback hoặc failure chưa xử lý.</li>
    </ul>
    <p>Xuất ra PDF và lưu tại thư mục gốc repository với tên chính xác <code>demo-slides.pdf</code>.</p>
    <ol className="numbered-steps" start="4">
      <li>Quay video demo dự phòng ghi lại đúng phần định demo trên sân khấu, sẵn sàng chiếu thay thế nếu gặp sự cố mạng.</li>
      <li>Đẩy các tệp hoàn thiện lên GitHub:</li>
    </ol>
    <CodeBlock>{`git add demo-slides.pdf validation/ spec.md
git commit -m "build: publish demo slides and R6 validation log for CP5"
git push origin main`}</CodeBlock>
    <p>Đội trưởng nộp tệp <code>demo-slides.pdf</code> và liên kết video demo dự phòng qua form CP5 trước <b>22:30 ngày 18/9</b>.</p>
    <Callout><b>Danh mục nghiệm thu hồ sơ CP5</b><p>Tệp PDF đúng 6 trang; video demo dự phòng truy cập công khai; <code>validation/</code> có nhật ký ≥2 người thử kèm quote; §9 Changelog ghi nhận thay đổi; đã dry run có bấm giờ.</p></Callout>
    <p>Mốc CP5 hoàn thành khi form nộp bài được ghi nhận trước 22:30 ngày 18/9 và repository chứa đầy đủ slide PDF kèm hồ sơ kiểm chứng.</p>
    <FeedbackBar />
  </>
);

const PageSeven = () => (
  <>
    <h1>Nộp bài tổng kết và quy trình thuyết trình vòng thi (CP6)</h1>
    <p>Hoàn thành CP5 khép lại toàn bộ quá trình phát triển để bước vào buổi thi đấu tại LAB 6. Buổi này không phải thời gian lập trình bổ sung mà là diễn đàn để các nhóm bảo vệ giải pháp, chứng minh năng lực kỹ thuật và thể hiện sự thấu hiểu bài toán trước hội đồng giám khảo.</p>
    <h2>Quy chuẩn cấu trúc repository nộp bài</h2>
    <p>Repository của nhóm phải đảm bảo cấu trúc chuẩn, sẵn sàng để giám khảo và trợ giảng đối chiếu từng hạng mục điểm:</p>
    <CodeBlock>{`K4-3B-<phòng>-<tên nhóm>/
├── README.md          # Bản sao README đề bài kèm bảng thành viên và phân công
├── spec.md            # Tài liệu AI Spec §1–§9 đã khóa quality bar
├── demo-slides.pdf    # Bộ slide báo cáo đúng 6 trang định dạng PDF
├── codebase/          # Mã nguồn prototype có gọi AI thật
├── eval/              # Golden set (≥20 case) và bảng kết quả các lượt chạy
├── validation/        # Nhật ký người ngoài dùng thử
└── reflection/        # Mỗi thành viên 1 file thu hoạch cá nhân`}</CodeBlock>
    <p>Mỗi học viên tự tạo một tệp thu hoạch cá nhân trong <code>reflection/</code>, trình bày rõ vai trò cá nhân, phần việc trực tiếp phụ trách, cách ứng dụng AI trong quá trình xây dựng và một bài học thực tế rút ra từ các trường hợp thất bại của nhóm.</p>

    <h2>Kênh nộp bài và thủ tục hoàn thành</h2>
    <p>Bài lab nộp qua hai kênh song song. Hoàn thành một kênh không thay thế được kênh còn lại.</p>
    <p><b>① Form checkpoint CP1–CP5 — đội trưởng đại diện nộp thay cả nhóm.</b> Mỗi mốc một phiếu duy nhất, dùng duy nhất một mã học viên đội trưởng cho cả năm mốc.</p>
    <p><b>② Link repo GitHub trên VLearn — mọi thành viên đều phải tự nộp.</b> Tất cả thành viên nộp cùng một liên kết repository chung của nhóm; đội trưởng không nộp thay được.</p>

    <h2>Thể thức thi đấu tại buổi LAB 6 (09:00–13:00 ngày 19/9)</h2>
    <p>Sự kiện tổ chức song song tại hai phòng: E403 và E402. Mỗi phòng có một tổ giám khảo riêng, chấm và trao giải riêng.</p>
    <ul>
      <li><b>Vòng cụm — game đầu tư:</b> mỗi nhóm trình bày 6 phút tại E403 hoặc 7 phút tại E402. Mỗi đội có 100 điểm vốn, đội trưởng đại diện xem và đầu tư. Hai luật bắt buộc: không đầu tư vào đội mình và tổng phải đúng 100.</li>
      <li><b>Vòng chung kết phòng:</b> E403 chọn Top 3, E402 chọn Top 2. Mỗi đội có 10 phút: 7 phút trình bày kèm demo trực tiếp và 3 phút hỏi đáp.</li>
      <li><b>Quy tắc vibe-coding:</b> giám khảo có quyền hỏi trực tiếp bất kỳ thành viên nào về phần có tên người đó trong bảng phân công và có thể yêu cầu chạy lại một case tại chỗ.</li>
    </ul>
    <Callout><b>Tín hiệu hoàn thành toàn diện</b><p>Repository công khai có đầy đủ các tệp theo cấu trúc chuẩn, mỗi thành viên đã nộp link repo trên VLearn, đội trưởng đã nộp đủ 5 mốc form, mỗi thành viên có reflection và nhóm sẵn sàng thuyết trình trực tiếp tại LAB 6.</p></Callout>
    <FeedbackBar />
  </>
);

export const labLessons = Object.freeze([
  { id: 'prepare', number: 1, label: 'Chuẩn bị đội ngũ, chọn track và khởi tạo repository', shortLabel: 'Chuẩn bị đội ngũ, chọn track và khởi tạo repo', component: PageOne },
  { id: 'cp1', number: 2, label: 'Khám phá bài toán, thu thập bằng chứng và chốt Canvas 7 dòng (CP1)', shortLabel: 'Khám phá bài toán, thu thập bằng chứng và chốt Canvas', component: PageTwo },
  { id: 'cp2', number: 3, label: 'Thiết kế luồng trải nghiệm và dựng bản mẫu tương tác (CP2)', shortLabel: 'Thiết kế luồng trải nghiệm và dựng bản mẫu', component: PageThree },
  { id: 'cp3', number: 4, label: 'Xây dựng prototype AI thật và đo lường kiểm thử sơ bộ (CP3)', shortLabel: 'Xây dựng prototype AI thật và đo lường kiểm thử', component: PageFour },
  { id: 'cp4', number: 5, label: 'Hoàn thiện tài liệu AI Spec và khóa ngưỡng chất lượng (CP4)', shortLabel: 'Hoàn thiện tài liệu AI Spec và khóa ngưỡng chất lượng', component: PageFive },
  { id: 'cp5', number: 6, label: 'Xác thực người dùng ngoài nhóm, xuất bản slide và đóng gói dự phòng (CP5)', shortLabel: 'Xác thực người dùng ngoài nhóm, xuất bản slide', component: PageSix },
  { id: 'cp6', number: 7, label: 'Nộp bài tổng kết và quy trình thuyết trình vòng thi (CP6)', shortLabel: 'Bài đọc', component: PageSeven },
  { id: 'submission', number: 8, label: 'Nộp bài và đánh giá Lab', shortLabel: 'Nộp bài và đánh giá Lab', component: null },
]);

