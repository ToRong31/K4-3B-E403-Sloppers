# VLearn LabSpace — UI Implementation Checklist

> Cập nhật gần nhất: 18/09/2026  
> UI owner: **Lê Thị Thùy Trang**  
> Phạm vi kiểm tra: frontend React trong `codebase/frontend/` so với mockup tham chiếu trong `codebase/vlearn-labspace/` và ảnh VLearn chính thức do nhóm cung cấp.

## Cách đọc trạng thái

- `[x] ✅` — UI đã dựng, có thể mở và kiểm tra trên frontend React.
- `[ ] 🟡` — Đã có khung hoặc dữ liệu hiển thị, nhưng còn thiếu trạng thái/tương tác so với mockup.
- `[ ] ⚪` — Chưa triển khai trong frontend React.
- Trạng thái trong file này chỉ đánh giá **UI frontend**. Backend, AI thật, persistence và WebSocket được theo dõi riêng ở cuối file.

## Tổng quan nhanh

| Khu vực | Trạng thái | Ghi chú |
|---|---:|---|
| Đăng nhập desktop + responsive | ✅ | Đã đối chiếu trực quan với VLearn chính thức |
| Danh sách bài Lab | ✅ | Có bài Mini Hackathon mẫu |
| Trình đọc bài Mini Hackathon | ✅ | Đủ chuẩn bị, CP1–CP6 và điều hướng |
| Trang nộp bài Lab | ✅ | Đã có trạng thái nộp mẫu |
| App shell và điều hướng theo role | 🟡 | Có route/nav/logout; chưa có notification panel |
| Workspace nhóm | 🟡 | Có board chính và dialog lập nhóm; AI/help chưa hoạt động |
| Flow Nhóm trưởng | 🟡 | Đã có tạo nhóm, mời thành viên; còn thiếu review và approve plan |
| Flow Thành viên | 🟡 | Đã có invitation và khai skill; còn thiếu thao tác task |
| AI assignment review | ⚪ | Chưa có draft/reason/confidence/override/approve UI |
| Coach dashboard | 🟡 | Có bảng tổng quan; chưa có chi tiết help request |
| Notification/help/chat sidebar | 🟡 | Đã có notification lời mời; help/chat chưa chuyển sang React |
| GitHub double-check và nộp thật | ⚪ | Mới có trang trạng thái nộp tĩnh |
| Responsive + accessibility toàn hệ thống | 🟡 | Login/Lesson tốt; Workspace/Coach cần hoàn thiện |

**Tiến độ theo module giao diện:** 4 hoàn thiện · 7 một phần · 2 chưa làm.

---

## 1. Đăng nhập và phân quyền UI

- [x] ✅ Background campus toàn màn hình.
- [x] ✅ Overlay xanh vát chéo và hero content ở desktop.
- [x] ✅ Logo VLearn, tagline, mô tả và copyright.
- [x] ✅ Card đăng nhập bên phải đúng desktop layout.
- [x] ✅ Email, password, hiện/ẩn password và ghi nhớ email.
- [x] ✅ Link quên mật khẩu, đăng nhập lần đầu và hỗ trợ.
- [x] ✅ Responsive chuyển sang card giữa dưới breakpoint `1000px`.
- [x] ✅ Bộ chọn tài khoản demo Leader/Member/Coach được ẩn mặc định để không phá template.
- [x] ✅ Hiển thị lỗi đăng nhập.
- [x] ✅ Đăng nhập xong chuyển đúng trang theo role.
- [x] ✅ Route guard và logout.
- [ ] 🟡 Trạng thái loading hiện bằng text; cần bổ sung spinner/focus lock nếu UI owner yêu cầu.
- [ ] ⚪ Chưa có UI “đăng nhập lần đầu” thật; hiện nút này mở danh sách tài khoản demo.

**Nguồn React:** `src/features/login/LoginPage.jsx`, `src/auth/**`  
**Acceptance:** desktop ≥1000px hiển thị hai vùng; mobile/tablet hiển thị card giữa; ba tài khoản demo vào đúng role.

## 2. App shell và điều hướng chung

- [x] ✅ Logo và thanh điều hướng chính.
- [x] ✅ Menu được lọc theo Leader/Member/Coach.
- [x] ✅ Hiển thị tài khoản, role và logout.
- [x] ✅ Badge phân biệt dữ liệu mô phỏng.
- [x] ✅ Connection indicator cho trạng thái realtime client.
- [ ] 🟡 Header hiện tại mới bám visual language chung, chưa đối chiếu pixel-by-pixel toàn bộ mockup.
- [ ] 🟡 Thành viên đã có nút thông báo, unread count và drawer tại Workspace; chưa dùng chung toàn app.
- [ ] ⚪ Menu tài khoản/profile mở rộng.
- [ ] ⚪ Toast thành công/lỗi dùng chung.

**Nguồn React:** `src/layout/AppShell.jsx`

## 3. Danh sách bài Lab

- [x] ✅ Tiêu đề “Bài Lab của tôi”.
- [x] ✅ Các thẻ thống kê đã nộp/đang làm/cần nộp.
- [x] ✅ Card bài “Bài 16 · MINI HACKATHON”.
- [x] ✅ Badge LabSpace, progress bar và CTA mở bài.
- [x] ✅ Loading và error/retry state.
- [x] ✅ Dữ liệu bài Lab nằm trong fixture/API adapter, không đặt trực tiếp trong component.
- [ ] 🟡 Số liệu thống kê tổng vẫn là fixture cố định.
- [ ] ⚪ Empty state khi không có bài Lab.
- [ ] ⚪ Filter/search/sort nếu mockup cuối yêu cầu.

**Nguồn React:** `src/features/labs/LabsPage.jsx`, `src/api/mockData.js`

## 4. Trình đọc bài Mini Hackathon

- [x] ✅ Topbar bài học, progress, nút AI, gửi yêu cầu và avatar.
- [x] ✅ Sidebar Slides, Video và danh sách nội dung bài học.
- [x] ✅ Trạng thái `Đang học`/`Đã xong` trong sidebar.
- [x] ✅ Bài chuẩn bị đội ngũ và repository.
- [x] ✅ CP1 — khám phá bài toán và Canvas 7 dòng.
- [x] ✅ CP2 — thiết kế flow và prototype tương tác.
- [x] ✅ CP3 — prototype AI thật và kiểm thử sơ bộ.
- [x] ✅ CP4 — AI Spec và quality bar.
- [x] ✅ CP5 — validation, slide và video dự phòng.
- [x] ✅ CP6 — nộp tổng kết và quy trình thuyết trình.
- [x] ✅ Bảng, callout, code block, diagram và feedback bar.
- [x] ✅ Điều hướng bài trước/bài tiếp theo và query param `lesson`.
- [x] ✅ Sidebar dạng drawer trên mobile.
- [ ] 🟡 Progress `0/21` và trạng thái hoàn thành hiện là dữ liệu giao diện mẫu.
- [ ] 🟡 Nút hỏi AI/gửi yêu cầu mới hiển thị thông báo “chưa tích hợp”.
- [ ] ⚪ Slides và Video chưa mở nội dung thật.
- [ ] ⚪ Like/dislike/report chưa có mutation.

**Nguồn React:** `src/features/lesson/LessonPage.jsx`, `src/features/lesson/labContent.jsx`

## 5. Trang nộp bài Lab

- [x] ✅ Trạng thái “Đã nộp bài”.
- [x] ✅ Đánh giá 5/5, nộp đúng hạn và timestamp mẫu.
- [x] ✅ CTA xem bài đã nộp và sửa/nộp lại.
- [x] ✅ Đồng bộ trạng thái “Đã xong” trong sidebar khi mở trang nộp.
- [ ] 🟡 Đây là trạng thái fixture để demo UI, chưa phải submission thật.
- [ ] ⚪ CTA xem/sửa/nộp lại chưa có hành động.
- [ ] ⚪ Chưa có form nhập link GitHub và validate URL.
- [ ] ⚪ Chưa có bảng AI double-check deliverable `pass/fail/uncertain`.

## 6. Workspace nhóm — màn hình chính

- [x] ✅ Breadcrumb, tên nhóm, role badge và mã nhóm.
- [x] ✅ Danh sách thành viên và trạng thái lời mời.
- [x] ✅ Task board với category, title, deliverable, owner và status.
- [x] ✅ Progress bar và vòng tiến độ nhóm.
- [x] ✅ Checklist deliverable bên phải.
- [x] ✅ Ghi rõ nguồn checklist đang là fixture.
- [x] ✅ Loading và error/retry state.
- [x] ✅ Leader/member có CTA khác nhau theo quyền.
- [x] ✅ Leader mở được dialog lập nhóm trực tiếp từ Workspace.
- [x] ✅ Sau thao tác demo, tên/mã nhóm và trạng thái thành viên được cập nhật ngay trên UI.
- [ ] 🟡 CTA AI, copy mã nhóm và yêu cầu Coach chưa hoạt động.
- [ ] 🟡 Task/checklist đang read-only, chưa có hover/focus/interaction đầy đủ như mockup.
- [ ] 🟡 Layout tablet/mobile mới ở mức cơ bản.
- [ ] ⚪ Empty state khi chưa có nhóm hoặc chưa có plan.
- [ ] ⚪ Blocked reason và trạng thái unblocked.

**Nguồn React:** `src/features/workspace/WorkspacePage.jsx`

## 7. Flow Nhóm trưởng

- [x] ✅ Dialog tạo nhóm theo bài Lab.
- [x] ✅ Form tên nhóm và validation.
- [x] ✅ Dialog mời thành viên bằng mã học viên.
- [x] ✅ Trạng thái resolve mã → tên học viên.
- [x] ✅ Validation mã sai, trùng, chính mình và quá số thành viên.
- [x] ✅ Theo dõi invitation `pending/accepted/declined` trên Workspace; trạng thái sau khi gửi là `pending`.
- [ ] ⚪ Trạng thái chờ thành viên hoàn tất skill profile.
- [ ] ⚪ CTA chạy AI draft với loading animation và nút bỏ qua.
- [ ] ⚪ Màn hình review bản nháp AI.
- [ ] ⚪ Override owner và đánh dấu khác đề xuất AI.
- [ ] ⚪ Approve plan final gate.
- [ ] ⚪ Regenerate/version draft.

## 8. Flow Thành viên

- [x] ✅ Notification lời mời vào nhóm.
- [x] ✅ Accept/decline invitation.
- [x] ✅ Onboarding khai kỹ năng theo Engineering/AI-Data/Product-Design.
- [x] ✅ Slider lựa chọn level 1–5 cho từng kỹ năng đã chọn.
- [x] ✅ Review và xác nhận skill profile.
- [ ] ⚪ Màn hình chờ leader phê duyệt plan.
- [ ] ⚪ Xem task được giao.
- [ ] ⚪ Tick done/reopen task theo quyền.
- [ ] ⚪ Đánh dấu blocked và nhập lý do.

## 9. AI assignment review UI

- [ ] ⚪ Trạng thái `CLARIFY` kèm dữ liệu còn thiếu.
- [ ] ⚪ Trạng thái `READY` với toàn bộ canonical task.
- [ ] ⚪ Proposed owner cho từng task.
- [ ] ⚪ Reason, confidence và gap.
- [ ] ⚪ Cảnh báo low-confidence.
- [ ] ⚪ Cảnh báo workload mất cân bằng.
- [ ] ⚪ Dropdown đổi owner cho Leader.
- [ ] ⚪ Audit “AI đề xuất / Leader đã đổi”.
- [ ] ⚪ Nút approve và confirmation dialog.
- [ ] ⚪ Timeout/invalid-output/retry state.

## 10. Coach dashboard và hỗ trợ

- [x] ✅ Dashboard tổng số nhóm, nhóm ≥80%, blocked và cần hỗ trợ.
- [x] ✅ Bảng nhóm, progress, blocked, check-in và help status.
- [x] ✅ Coach chỉ thấy dữ liệu tổng hợp cấp nhóm trong fixture.
- [x] ✅ Loading và error/retry state.
- [ ] 🟡 Nút “Xem yêu cầu” chưa hoạt động.
- [ ] ⚪ Drawer/dialog chi tiết yêu cầu hỗ trợ.
- [ ] ⚪ Lịch sử trao đổi với nhóm.
- [ ] ⚪ Form Coach reply.
- [ ] ⚪ Resolve/reopen help request.
- [ ] ⚪ Filter nhóm blocked/help pending.
- [ ] ⚪ Empty state khi không có yêu cầu.

**Nguồn React:** `src/features/coach/CoachDashboardPage.jsx`

## 11. Notification, help request và chat

- [ ] 🟡 Notification panel lời mời đã bám mockup; các loại thông báo khác chưa có.
- [x] ✅ Unread count cho lời mời và trạng thái sau accept/decline.
- [ ] ⚪ Dialog gửi yêu cầu Coach: topic, question, urgent.
- [ ] ⚪ Trạng thái pending/replied/resolved tại workspace.
- [ ] ⚪ Chat sidebar nhóm.
- [ ] ⚪ Danh sách tin nhắn và composer.
- [ ] ⚪ Mention `@Trợ lý AI`.
- [ ] ⚪ File attachment/preview.
- [ ] ⚪ AI summary và AI mentor 1:1.

## 12. Trạng thái dùng chung, responsive và accessibility

- [x] ✅ Loading/error/retry component dùng chung.
- [x] ✅ Login responsive desktop/tablet/mobile.
- [x] ✅ Lesson reader responsive với sidebar drawer.
- [x] ✅ Form login có label và keyboard-native controls.
- [ ] 🟡 Labs/Workspace/Coach có responsive cơ bản nhưng chưa visual QA đầy đủ ở nhiều kích thước.
- [ ] 🟡 Focus style mới đầy đủ nhất ở login; các CTA khác cần rà soát.
- [ ] ⚪ Empty state component dùng chung.
- [ ] ⚪ Dialog focus trap, Escape-to-close và restore focus.
- [ ] ⚪ Skeleton loading theo từng màn hình.
- [ ] ⚪ Offline/reconnecting banner và action retry rõ ràng.
- [ ] ⚪ Accessibility audit bằng keyboard và screen reader.

---

## 13. Phần không được tính là “UI hoàn thiện chức năng”

Các mục sau chưa hoàn thành dù một số màn hình đã có dữ liệu mô phỏng:

- [ ] Backend auth/session thật.
- [ ] API canonical cho Lab/checklist/group/invitation/profile/plan/progress.
- [ ] AI model call thật và structured output `READY/CLARIFY`.
- [ ] Persistence sau reload.
- [ ] WebSocket đa role và reconcile khi reconnect.
- [ ] Mutation tạo nhóm, mời thành viên, approve plan và update task.
- [ ] Coach reply/resolve thật.
- [ ] GitHub validation và submission thật.

## 14. Thứ tự UI nên hoàn thiện tiếp theo

1. **P0 — Leader:** tạo nhóm → mời thành viên → trạng thái chờ.
2. **P0 — Member:** nhận lời mời → accept → khai skill + level.
3. **P0 — AI review:** `CLARIFY/READY` → reason/confidence → override → approve.
4. **P0 — Execution:** task interaction, quyền update và trạng thái reconnect.
5. **P1 — Coach/help:** gửi yêu cầu → reply → resolve.
6. **P1 — Responsive/accessibility QA** cho Workspace và Coach.
7. **P2 — Notification/chat/GitHub validator** sau khi working slice P0 chạy end-to-end.

## 15. Acceptance checklist trước mỗi lần merge UI

- [ ] Đối chiếu trực tiếp với `codebase/vlearn-labspace/index.html` và `styles.css`.
- [ ] Không sửa visual/template ngoài phạm vi đã được Lê Thị Thùy Trang duyệt.
- [ ] Không đặt production code trong `codebase/vlearn-labspace/`.
- [ ] Phân biệt rõ fixture/mock với dữ liệu backend thật.
- [ ] Kiểm tra đúng ba role Leader/Member/Coach.
- [ ] Kiểm tra desktop, tablet và mobile.
- [ ] Kiểm tra keyboard/focus cho form và dialog.
- [ ] Có loading/error/empty/reconnect phù hợp.
- [ ] Chạy `npm test`.
- [ ] Chạy `npm run build`.
- [ ] Không có console error/warning mới.
