const views = [...document.querySelectorAll('.view')];
const navButtons = [...document.querySelectorAll('[data-view-link]')];
const dialog = document.getElementById('setupDialog');
const memberDialog = document.getElementById('memberDialog');
const assignmentDialog = document.getElementById('assignmentDialog');
const tourDialog = document.getElementById('tourDialog');
const notificationPanel = document.getElementById('notificationPanel');
const toast = document.getElementById('toast');
const tasks = [...document.querySelectorAll('[data-task]')];
let toastTimer;
let planApproved = false;
let currentRole = 'leader';
let minhProfileSubmitted = false;

const ownerMeta = {
  Trọng: { initial: 'T', className: 'blue-bg', skill: 'Product · Research' },
  Trang: { initial: 'T', className: 'teal-bg', skill: 'Frontend · UI/UX' },
  Dương: { initial: 'D', className: 'purple-bg', skill: 'AI · Prompt' },
  Dũng: { initial: 'D', className: 'orange-bg', skill: 'Backend · Data' },
  'Cả nhóm': { initial: '•', className: 'blue-bg', skill: 'Cùng thực hiện' }
};

const initialAiProposals = {
  0: { name: 'Trọng', desc: 'Product & Research · Match 95%' },
  1: { name: 'Trọng', desc: 'Product Lead · Match 98%' },
  2: { name: 'Trang', desc: 'Frontend 4★, UI/UX 4★ · Match 96%' },
  3: { name: 'Dương', desc: 'Prompt Eng 4★, AI · Match 94%' },
  4: { name: 'Dũng', desc: 'Backend 4★, Data · Match 92%' }
};

/* =========================================================
   DISCORD-STYLE CHAT SIDEBAR & LAB AI ASSISTANT MODULE
   ========================================================= */

let activeChatTab = 'group'; // 'group' | 'ai'
let chatSidebarCollapsed = false;
let currentAttachment = null;
let unreadChatCount = 2;

let chatMessagesData = [
  {
    id: 1,
    sender: 'Trọng',
    role: 'leader',
    roleName: '👑 Nhóm trưởng',
    avatarChar: 'T',
    avatarClass: 'leader',
    time: '20:30',
    text: 'Chào cả nhóm Sloppers! Trọng vừa tạo xong workspace cho bài Mini Hackathon AI. Mọi người kiểm tra kết nối nhé.',
    attachment: null
  },
  {
    id: 2,
    sender: 'Trang',
    role: 'member',
    roleName: 'UI / Frontend',
    avatarChar: 'T',
    avatarClass: 'member',
    time: '20:33',
    text: 'Em đã chuẩn bị sẵn sơ đồ thiết kế luồng Canvas CP1 và Flow CP2 cho sản phẩm. Em đính kèm file mockup ở đây để nhóm xem trước và đóng góp ý kiến ạ!',
    attachment: {
      name: 'Flow_Mockup_CP2_Figma.png',
      size: '2.4 MB',
      type: 'img',
      icon: '🖼️'
    }
  },
  {
    id: 3,
    sender: 'Dương',
    role: 'member',
    roleName: 'AI / Prompt Eng',
    avatarChar: 'D',
    avatarClass: 'member',
    time: '20:36',
    text: 'Về phần bài test Golden Set CP3, em đã tổng hợp bộ 20 prompt test và rubric đánh giá. Em gửi trước file dữ liệu benchmark.',
    attachment: {
      name: 'Golden_Set_Benchmark_CP3.csv',
      size: '680 KB',
      type: 'data',
      icon: '📊'
    }
  },
  {
    id: 4,
    sender: 'Trọng',
    role: 'leader',
    roleName: '👑 Nhóm trưởng',
    avatarChar: 'T',
    avatarClass: 'leader',
    time: '20:38',
    text: 'Cảm ơn Trang và Dương nhé! Giờ mình sẽ dùng tính năng "Phân chia task AI" để thuật toán phân bổ nhiệm vụ theo ma trận kỹ năng chuẩn nhất cho 4 bạn.',
    attachment: null
  }
];

let aiPrivateChatData = [
  {
    id: 1,
    sender: 'assistant',
    time: '20:30',
    html: `Chào bạn! Mình là <strong>Trợ lý học tập VLearn AI (Lab Mentor)</strong> đồng hành cùng bạn trong bài <strong>Mini Hackathon AI (Day 5-6)</strong>.<br><br>
    Bạn có thể hỏi mình bất kỳ thắc mắc nào về bài Lab:
    <ul>
      <li>📌 <code>Lab này cần nộp gì?</code> (Checklist 5 deliverable)</li>
      <li>🚀 <code>Tôi đã làm xong Checkpoint 1 thì làm gì nữa?</code></li>
      <li>🎯 <code>Tiêu chí chấm điểm và Golden set CP3?</code></li>
      <li>⚖️ <code>Giải quyết mâu thuẫn phân task trong nhóm?</code></li>
    </ul>
    Hãy bấm gợi ý phía trên hoặc nhập câu hỏi bên dưới nhé!`
  }
];

function formatTimeNow() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* --- TAB SWITCHING & SIDEBAR TOGGLING --- */
function switchChatTab(tab) {
  activeChatTab = tab;
  const btnGroup = document.getElementById('tabBtnGroupChat');
  const btnAi = document.getElementById('tabBtnAiChat');
  const contentGroup = document.getElementById('chatTabGroupContent');
  const contentAi = document.getElementById('chatTabAiContent');

  if (btnGroup) btnGroup.classList.toggle('active', tab === 'group');
  if (btnAi) btnAi.classList.toggle('active', tab === 'ai');
  if (contentGroup) contentGroup.classList.toggle('active', tab === 'group');
  if (contentAi) contentAi.classList.toggle('active', tab === 'ai');

  if (tab === 'group') {
    renderChatMessages();
    setTimeout(() => document.getElementById('chatInputText')?.focus(), 50);
  } else {
    renderAiPrivateMessages();
    setTimeout(() => document.getElementById('aiChatInputText')?.focus(), 50);
  }
}

function collapseChatSidebar() {
  chatSidebarCollapsed = true;
  const sidebar = document.getElementById('chatSidebar');
  const rail = document.getElementById('chatExpandRail');
  if (sidebar) sidebar.classList.add('collapsed');
  if (rail) rail.classList.add('visible');
  document.body.classList.remove('chat-sidebar-open');
}

function expandChatSidebar() {
  chatSidebarCollapsed = false;
  const sidebar = document.getElementById('chatSidebar');
  const rail = document.getElementById('chatExpandRail');
  if (sidebar) sidebar.classList.remove('collapsed');
  if (rail) rail.classList.remove('visible');
  document.body.classList.add('chat-sidebar-open');

  if (activeChatTab === 'group') {
    renderChatMessages();
    setTimeout(() => document.getElementById('chatInputText')?.focus(), 100);
  } else {
    renderAiPrivateMessages();
    setTimeout(() => document.getElementById('aiChatInputText')?.focus(), 100);
  }
}

window.switchChatTab = switchChatTab;
window.collapseChatSidebar = collapseChatSidebar;
window.expandChatSidebar = expandChatSidebar;

/* --- RENDER GROUP CHAT MESSAGES --- */
function renderChatMessages() {
  const container = document.getElementById('chatMessages');
  if (!container) return;

  container.innerHTML = '';

  chatMessagesData.forEach(msg => {
    if (msg.isAiSummary) {
      const card = document.createElement('div');
      card.className = 'chat-msg-row ai-system';
      card.innerHTML = `
        <div class="chat-ai-card">
          <div class="chat-ai-card-title">
            <span>✨ AI COPILOT · TÓM TẮT THẢO LUẬN NHÓM (${msg.time})</span>
          </div>
          <ul>
            ${msg.summary.map(item => `<li>${item}</li>`).join('')}
          </ul>
        </div>
      `;
      container.appendChild(card);
      return;
    }

    const isMine = (currentRole === 'leader' && msg.sender === 'Trọng') ||
      (currentRole === 'member' && (msg.sender === 'Trang' || msg.sender === 'Thùy Trang')) ||
      (currentRole === 'coach' && msg.sender === 'Coach E403');

    const row = document.createElement('div');
    row.className = `chat-msg-row ${msg.isBot ? 'ai-bot' : (isMine ? 'mine' : 'peer')}`;

    let attachmentHtml = '';
    if (msg.attachment) {
      attachmentHtml = `
        <div class="chat-doc-card" onclick="handlePreviewDocument('${escapeHtml(msg.attachment.name)}')" title="Click để xem / tải tài liệu">
          <span class="doc-icon-badge">${msg.attachment.icon || '📄'}</span>
          <div class="doc-text-meta">
            <span class="doc-title">${escapeHtml(msg.attachment.name)}</span>
            <span class="doc-sub">${escapeHtml(msg.attachment.size)} · Nhấn để xem</span>
          </div>
          <button type="button" class="doc-action-btn">Mở tệp</button>
        </div>
      `;
    }

    row.innerHTML = `
      <div class="chat-msg-avatar ${msg.avatarClass || ''}">${msg.avatarChar || msg.sender[0]}</div>
      <div class="chat-msg-content">
        <div class="chat-msg-meta">
          <span class="author-name">${escapeHtml(msg.sender)}</span>
          <span class="author-role-tag">${escapeHtml(msg.roleName || '')}</span>
          <span class="msg-time">${msg.time}</span>
        </div>
        <div class="chat-msg-bubble">
          ${msg.html ? msg.html : (msg.text ? `<div>${escapeHtml(msg.text)}</div>` : '')}
          ${attachmentHtml}
        </div>
      </div>
    `;
    container.appendChild(row);
  });

  container.scrollTop = container.scrollHeight;
}

/* --- RENDER 1:1 AI PRIVATE CHAT --- */
function renderAiPrivateMessages() {
  const container = document.getElementById('aiChatMessages');
  if (!container) return;

  container.innerHTML = '';

  aiPrivateChatData.forEach(msg => {
    const row = document.createElement('div');
    row.className = `ai-chat-row ${msg.sender === 'user' ? 'user' : 'assistant'}`;

    const meta = document.createElement('div');
    meta.className = 'ai-chat-meta';
    meta.textContent = msg.sender === 'user' ? `Bạn · ${msg.time}` : `Trợ lý Lab AI · ${msg.time}`;

    const bubble = document.createElement('div');
    bubble.className = msg.sender === 'user' ? 'ai-user-bubble' : 'ai-bot-bubble';
    bubble.innerHTML = msg.html ? msg.html : (msg.text ? `<div>${escapeHtml(msg.text)}</div>` : '');

    row.appendChild(meta);
    row.appendChild(bubble);
    container.appendChild(row);
  });

  container.scrollTop = container.scrollHeight;
}

window.handlePreviewDocument = function (docName) {
  showToast(`📂 Đang mở tài liệu: ${docName}`);
};

/* --- GROUP CHAT SEND & AI MENTION IN GROUP --- */
function sendChatMessage(text, attachment) {
  if (!text && !attachment) return;

  let sender = 'Trọng';
  let role = 'leader';
  let roleName = '👑 Nhóm trưởng';
  let avatarChar = 'T';
  let avatarClass = 'leader';

  if (currentRole === 'member') {
    sender = 'Trang';
    role = 'member';
    roleName = 'UI / Frontend';
    avatarChar = 'T';
    avatarClass = 'member';
  } else if (currentRole === 'coach') {
    sender = 'Coach E403';
    role = 'coach';
    roleName = 'Lab Coach';
    avatarChar = 'GV';
    avatarClass = 'ai';
  }

  const rawText = (text || '').trim();
  const newMsg = {
    id: Date.now(),
    sender,
    role,
    roleName,
    avatarChar,
    avatarClass,
    time: formatTimeNow(),
    text: rawText,
    attachment: attachment ? { ...attachment } : null
  };

  chatMessagesData.push(newMsg);
  clearChatAttachment();
  renderChatMessages();

  if (attachment) {
    showToast(`📎 Đã gửi tài liệu vào nhóm: ${attachment.name}`);
  }

  // Check if user mentioned @Trợ lý AI in group chat
  if (rawText.toLowerCase().includes('@trợ lý ai') || rawText.toLowerCase().includes('@ai')) {
    const query = rawText.replace(/@trợ lý ai/gi, '').replace(/@ai/gi, '').trim();
    setTimeout(() => {
      respondAiInGroup(query, sender);
    }, 450);
  }
}

function respondAiInGroup(query, askerName) {
  const answer = generateLabAiAnswer(query);
  const aiMsg = {
    id: Date.now(),
    sender: 'Trợ lý Lab AI [BOT]',
    role: 'bot',
    roleName: 'Cố vấn nhóm',
    avatarChar: '🤖',
    avatarClass: 'ai',
    isBot: true,
    time: formatTimeNow(),
    html: `<div><strong>Chào ${askerName}!</strong> Dưới đây là giải đáp cho cả nhóm:<br><br>${answer}</div>`
  };
  chatMessagesData.push(aiMsg);
  renderChatMessages();
}

/* --- AI KNOWLEDGE ENGINE FOR LAB DAY 5-6 --- */
function generateLabAiAnswer(prompt) {
  const p = (prompt || '').toLowerCase();

  if (p.includes('cần nộp gì') || p.includes('nộp gì') || p.includes('deliverable') || p.includes('checklist')) {
    return `<strong>Danh sách 5 Deliverable chính thức của Mini Hackathon Day 5-6:</strong>
    <ul>
      <li>1. <b>CP1: Canvas 7 dòng</b> (Bản phác thảo bài toán, đối tượng người dùng, giá trị cốt lõi)</li>
      <li>2. <b>CP2: Flow & Mockup sản phẩm</b> (Wireframe Figma bấm được hoặc video demo giao diện)</li>
      <li>3. <b>CP3: Golden Set & AI Rubric</b> (Bộ 20 prompt test chuẩn + rubric chấm tính chính xác)</li>
      <li>4. <b>CP4: Evidence log</b> (Khảo sát ≥20 học viên + 5 quote trích dẫn nguyên văn)</li>
      <li>5. <b>CP5: Slide thuyết trình & Demo</b> (Trình bày trong phiên chấm Lab cuối ngày)</li>
    </ul>
    Hạn chót nộp toàn bộ link là trước <b>17:30 ngày Day 6</b>!`;
  }

  if (p.includes('checkpoint 1') || p.includes('cp1') || p.includes('làm gì tiếp') || p.includes('xong cp1')) {
    return `<strong>Bạn đã hoàn thành Checkpoint 1 (Canvas 7 dòng)? Các bước tiếp theo:</strong>
    <ul>
      <li>1. <b>Nhóm trưởng phê duyệt phân công:</b> Trọng bấm nút <code>✦ Phân chia task</code> để AI khớp thế mạnh 4 thành viên và duyệt bảng nháp.</li>
      <li>2. <b>Triển khai Checkpoint 2:</b> Trang (Frontend/UI) bắt tay dựng Wireframe & Flow trên Figma theo Canvas đã chốt.</li>
      <li>3. <b>Triển khai Checkpoint 3:</b> Dương (AI Lead) nạp bộ 20 prompt test vào file <code>Golden_Set_Benchmark_CP3.csv</code>.</li>
      <li>4. <b>Tự động cập nhật:</b> Khi từng bạn hoàn thành deliverable của mình, tick vào checkbox để tiến độ nhóm tăng lên!</li>
    </ul>`;
  }

  if (p.includes('checkpoint 3') || p.includes('cp3') || p.includes('golden set') || p.includes('rubric') || p.includes('tiêu chí')) {
    return `<strong>Tiêu chuẩn Checkpoint 3 (Golden Set & AI Rubric):</strong>
    <ul>
      <li><b>Số lượng:</b> Tối thiểu 20 câu prompt kiểm thử đa dạng (câu dễ, câu bẫy, edge-cases).</li>
      <li><b>Tiêu chí chấm:</b> Độ chính xác phản hồi (≥85%), tuân thủ format, thời gian xử lý < 2.5s.</li>
      <li><b>Tài liệu tham khảo:</b> Nhóm có thể tải file mẫu <code>Golden_Set_Benchmark_CP3.csv</code> ngay trong nút 'Tài liệu Lab' ở khung chat!</li>
    </ul>`;
  }

  if (p.includes('mâu thuẫn') || p.includes('phân chia task') || p.includes('bất đồng') || p.includes('ai quyết định')) {
    return `<strong>Ranh giới AI & Quyết định của Con người:</strong>
    <ul>
      <li>AI <b>chỉ gợi ý bản nháp</b> dựa trên ma trận kỹ năng của 4 bạn.</li>
      <li><b>Nhóm trưởng Trọng có toàn quyền ghi đè (Override):</b> Đổi bất kỳ ai phụ trách nếu nhóm thấy phù hợp hơn.</li>
      <li>Nếu cần trợ giúp thêm từ Giảng viên, bạn có thể bấm nút <b>'Yêu cầu hỗ trợ Lab Coach'</b> trên Workspace!</li>
    </ul>`;
  }

  return `Cảm ơn câu hỏi của bạn! Với nội dung bài <b>Mini Hackathon AI</b>, mình khuyến nghị nhóm:
  <ul>
    <li>Bám sát <b>Checklist chính thức</b> ở góc phải Workspace.</li>
    <li>Phân chia công việc theo thế mạnh: Trọng (Product), Trang (Frontend), Dương (AI), Dũng (Backend).</li>
    <li>Đính kèm file báo cáo trực tiếp trong kênh chat này để đồng đội tiện theo dõi!</li>
  </ul>`;
}

/* --- 1:1 PRIVATE CHAT INTERACTIONS --- */
function sendAiPrivateMessage(prompt) {
  if (!prompt || !prompt.trim()) return;
  const userText = prompt.trim();

  aiPrivateChatData.push({
    id: Date.now(),
    sender: 'user',
    time: formatTimeNow(),
    text: userText
  });
  renderAiPrivateMessages();

  setTimeout(() => {
    const answer = generateLabAiAnswer(userText);
    aiPrivateChatData.push({
      id: Date.now() + 1,
      sender: 'assistant',
      time: formatTimeNow(),
      html: answer
    });
    renderAiPrivateMessages();
  }, 400);
}

function askAiPrompt(promptText) {
  switchChatTab('ai');
  sendAiPrivateMessage(promptText);
}
window.askAiPrompt = askAiPrompt;

function clearAiPrivateHistory() {
  aiPrivateChatData = [
    {
      id: Date.now(),
      sender: 'assistant',
      time: formatTimeNow(),
      html: `Chào bạn! Cuộc trò chuyện đã được làm mới. Bạn cần hỗ trợ gì về bài Lab Mini Hackathon? Hãy chọn gợi ý hoặc đặt câu hỏi nhé!`
    }
  ];
  renderAiPrivateMessages();
  showToast('Đã làm mới cuộc trò chuyện với Trợ lý AI.');
}
window.clearAiPrivateHistory = clearAiPrivateHistory;

function setChatAttachment(name, size, type, icon) {
  currentAttachment = { name, size, type, icon: icon || '📄' };
  const tray = document.getElementById('chatAttachmentTray');
  const fName = document.getElementById('attachFileName');
  const fSize = document.getElementById('attachFileSize');
  const fIcon = document.getElementById('attachFileIcon');
  if (fName) fName.textContent = name;
  if (fSize) fSize.textContent = size;
  if (fIcon) fIcon.textContent = icon || '📄';
  if (tray) tray.style.display = 'block';
  const quickMenu = document.getElementById('quickDocsMenu');
  if (quickMenu) quickMenu.style.display = 'none';
}

function clearChatAttachment() {
  currentAttachment = null;
  const tray = document.getElementById('chatAttachmentTray');
  const fileInput = document.getElementById('chatFileInput');
  if (tray) tray.style.display = 'none';
  if (fileInput) fileInput.value = '';
}

function triggerAiChatSummary() {
  const summaryMsg = {
    id: Date.now(),
    isAiSummary: true,
    time: formatTimeNow(),
    summary: [
      '<b>CP2 (Wireframe & Flow):</b> Trang đã gửi bản mockup <code>Flow_Mockup_CP2_Figma.png</code> (2.4 MB) để cả nhóm tham khảo.',
      '<b>CP3 (Prompt & Benchmark):</b> Dương đã chuẩn bị sẵn bộ kiểm thử <code>Golden_Set_Benchmark_CP3.csv</code> (680 KB).',
      '<b>Bước tiếp theo:</b> Nhóm trưởng Trọng kích hoạt tính năng <b>Phân chia task AI</b> để thuật toán tính toán ma trận kỹ năng.'
    ]
  };
  chatMessagesData.push(summaryMsg);
  renderChatMessages();
  showToast('✨ AI Copilot đã tóm tắt các điểm thảo luận chính!');
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

function showView(name) {
  views.forEach(view => view.classList.toggle('active', view.id === `view-${name}`));
  document.querySelectorAll('.main-nav [data-view-link]').forEach(button => {
    button.classList.toggle('active', button.dataset.viewLink === name || (name === 'lesson' && button.dataset.viewLink === 'labs'));
  });
  history.replaceState(null, '', `#${name}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setDialogStep(step) {
  document.querySelectorAll('.dialog-step').forEach(section => section.classList.toggle('active', Number(section.dataset.step) === step));
  document.querySelectorAll('.stepper span').forEach((item, index) => item.classList.toggle('active', index < step));
}

function setMemberStep(step) {
  document.querySelectorAll('.member-dialog-step').forEach(section => section.classList.toggle('active', Number(section.dataset.memberStep) === step));
}

function openNotifications() {
  if (notificationPanel) notificationPanel.hidden = false;
}

function closeNotifications() {
  if (notificationPanel) notificationPanel.hidden = true;
}

let aiAnalysisTimers = [];

function clearAiAnalysisTimers() {
  aiAnalysisTimers.forEach(t => clearTimeout(t));
  aiAnalysisTimers = [];
}

function addAiLog(icon, text, status = 'active') {
  const terminal = document.getElementById('aiTerminalLog');
  if (!terminal) return;
  const entry = document.createElement('div');
  entry.className = `ai-log-entry ${status}`;
  entry.innerHTML = `<span class="ai-log-icon">${icon}</span><span class="ai-log-text">${text}</span>`;
  terminal.appendChild(entry);
  terminal.scrollTop = terminal.scrollHeight;
}

function markLastLogDone() {
  const terminal = document.getElementById('aiTerminalLog');
  if (!terminal) return;
  const entries = terminal.querySelectorAll('.ai-log-entry.active');
  if (entries.length > 0) {
    const last = entries[entries.length - 1];
    last.classList.remove('active');
    last.classList.add('done');
    const icon = last.querySelector('.ai-log-icon');
    if (icon) icon.textContent = '✓';
  }
}

function finishAiAnalysis(isRegenerate = false) {
  clearAiAnalysisTimers();

  const aiBox = document.getElementById('aiAnalyzingBox');
  const resultBody = document.getElementById('aiResultBody');
  const step1 = document.getElementById('stageStep1');
  const step2 = document.getElementById('stageStep2');

  if (aiBox) aiBox.style.display = 'none';
  if (resultBody) resultBody.style.display = 'block';
  if (step1) step1.className = 'active';
  if (step2) step2.className = 'active';

  document.querySelectorAll('#assignmentList .assignment-item').forEach((item, index) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(6px)';
    setTimeout(() => {
      item.style.transition = 'opacity .22s ease, transform .22s ease';
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    }, index * 60);
  });

  if (isRegenerate) {
    showToast('✨ AI đã tạo lại bản nháp mới theo ma trận tối ưu!');
  } else {
    showToast('✨ AI đã phân tích xong! Nhóm trưởng Lan hãy kiểm tra và chỉnh sửa trước khi duyệt.');
  }
}

function runAiTaskAnalysis(isRegenerate = false) {
  clearAiAnalysisTimers();

  const aiBox = document.getElementById('aiAnalyzingBox');
  const resultBody = document.getElementById('aiResultBody');
  const barFill = document.getElementById('aiBarFill');
  const barStatus = document.getElementById('aiBarStatus');
  const barPercent = document.getElementById('aiBarPercent');
  const terminal = document.getElementById('aiTerminalLog');
  const title = document.getElementById('aiAnalyzingTitle');
  const subtitle = document.getElementById('aiAnalyzingSubtitle');
  const step1 = document.getElementById('stageStep1');
  const step2 = document.getElementById('stageStep2');
  const step3 = document.getElementById('stageStep3');

  if (aiBox) aiBox.style.display = 'flex';
  if (resultBody) resultBody.style.display = 'none';
  if (step1) step1.className = 'active';
  if (step2) step2.className = '';
  if (step3) step3.className = '';

  if (barFill) barFill.style.width = '0%';
  if (barPercent) barPercent.textContent = '0%';
  if (terminal) terminal.innerHTML = '';

  if (isRegenerate) {
    if (title) title.textContent = 'AI đang tái cân bằng ma trận phân công...';
    if (subtitle) subtitle.textContent = 'Đang tính toán lại tổ hợp nhiệm vụ theo tiêu chí tối ưu mới';
    if (barStatus) barStatus.textContent = 'Đang kích hoạt thuật toán tái cân bằng...';

    addAiLog('↻', '[Khởi động] Đọc lại ma trận phân công của nhóm...', 'active');

    aiAnalysisTimers.push(setTimeout(() => {
      markLastLogDone();
      if (barFill) barFill.style.width = '45%';
      if (barPercent) barPercent.textContent = '45%';
      if (barStatus) barStatus.textContent = 'Đang cân bằng lại khối lượng công việc...';
      addAiLog('⚖️', '[Rebalance] Đảm bảo mỗi thành viên có ít nhất 1 nhiệm vụ trọng tâm...', 'active');
    }, 320));

    aiAnalysisTimers.push(setTimeout(() => {
      markLastLogDone();
      if (barFill) barFill.style.width = '85%';
      if (barPercent) barPercent.textContent = '85%';
      if (barStatus) barStatus.textContent = 'Đang kiểm tra lại độ phủ deliverable...';
      addAiLog('🧠', '[Optimize] Đã tinh chỉnh lại bản nháp theo chuyên môn sâu...', 'active');
    }, 680));

    aiAnalysisTimers.push(setTimeout(() => {
      markLastLogDone();
      if (barFill) barFill.style.width = '100%';
      if (barPercent) barPercent.textContent = '100%';
      if (barStatus) barStatus.textContent = 'Đã hoàn tất bản nháp mới!';
      addAiLog('✨', '[Ready] Bản nháp mới đã sẵn sàng cho Nhóm trưởng kiểm tra!', 'done');
    }, 1000));

    aiAnalysisTimers.push(setTimeout(() => {
      finishAiAnalysis(true);
    }, 1250));

  } else {
    if (title) title.textContent = 'AI đang phân tích ma trận kỹ năng & bài lab...';
    if (subtitle) subtitle.textContent = 'Đang đối soát hồ sơ 4 thành viên với 5 deliverable từ checklist chính thức';
    if (barStatus) barStatus.textContent = 'Đang khởi động AI Matching Engine...';

    addAiLog('🔍', '[Checklist] Bóc tách 5 deliverable từ Checklist bài LAB chính thức...', 'active');

    aiAnalysisTimers.push(setTimeout(() => {
      markLastLogDone();
      if (barFill) barFill.style.width = '35%';
      if (barPercent) barPercent.textContent = '35%';
      if (barStatus) barStatus.textContent = 'Đang nạp hồ sơ năng lực 4 thành viên...';
      addAiLog('👥', '[Profiles] Đọc điểm tự đánh giá: Trọng (Product Lead), Trang (Frontend 4★, UI 4★), Dương (AI 4★), Dũng (Backend 4★)...', 'active');
    }, 400));

    aiAnalysisTimers.push(setTimeout(() => {
      markLastLogDone();
      if (barFill) barFill.style.width = '70%';
      if (barPercent) barPercent.textContent = '70%';
      if (barStatus) barStatus.textContent = 'Đang tính toán Match Rate & tối ưu hóa...';
      addAiLog('🧠', '[Matching] Tính toán độ tương thích thế mạnh: Trọng 98% · Trang 96% · Dương 94% · Dũng 92%...', 'active');
    }, 850));

    aiAnalysisTimers.push(setTimeout(() => {
      markLastLogDone();
      if (barFill) barFill.style.width = '90%';
      if (barPercent) barPercent.textContent = '90%';
      if (barStatus) barStatus.textContent = 'Đang kiểm tra lỗ hổng kỹ năng nhóm...';
      addAiLog('⚠️', '[Gap Check] Phát hiện thiếu kỹ năng Presentation -> Đề xuất làm chung...', 'active');
    }, 1300));

    aiAnalysisTimers.push(setTimeout(() => {
      markLastLogDone();
      if (barFill) barFill.style.width = '100%';
      if (barPercent) barPercent.textContent = '100%';
      if (barStatus) barStatus.textContent = 'Hoàn tất phân tích bản nháp AI!';
      addAiLog('✨', '[Complete] Đã sinh bản nháp tối ưu! Bàn giao quyền kiểm duyệt cho Nhóm trưởng Trọng.', 'done');
    }, 1650));

    aiAnalysisTimers.push(setTimeout(() => {
      finishAiAnalysis(false);
    }, 1950));
  }
}

function openAssignment() {
  if (currentRole !== 'leader') {
    showToast('Chỉ Nhóm trưởng (Trọng) mới có quyền tạo bản nháp và phân task AI.');
    return;
  }
  assignmentDialog.showModal();
  runAiTaskAnalysis(false);
}

function closeOnBackdrop(targetDialog, event) {
  const rect = targetDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) {
    clearAiAnalysisTimers();
    targetDialog.close();
  }
}

/* =========================================================
   ONBOARDING TOUR: HƯỚNG DẪN TÍNH NĂNG MỚI & VAI TRÒ AI
   ========================================================= */
const tourTabs = [...document.querySelectorAll('.tour-tab-btn')];
const tourSteps = [...document.querySelectorAll('.tour-step-content')];

function setTourStep(stepNum) {
  tourTabs.forEach(tab => tab.classList.toggle('active', Number(tab.dataset.tourTab) === stepNum));
  tourSteps.forEach(step => step.classList.toggle('active', Number(step.dataset.tourStep) === stepNum));
}

function openTour() {
  setTourStep(1);
  if (tourDialog) tourDialog.showModal();
}

tourTabs.forEach(tab => {
  tab.addEventListener('click', () => setTourStep(Number(tab.dataset.tourTab)));
});

document.getElementById('openTourBtn')?.addEventListener('click', openTour);
document.getElementById('dockTourBtn')?.addEventListener('click', openTour);
document.getElementById('closeTourDialog')?.addEventListener('click', () => tourDialog?.close());
tourDialog?.addEventListener('click', event => closeOnBackdrop(tourDialog, event));

document.getElementById('tourNext1')?.addEventListener('click', () => setTourStep(2));
document.getElementById('tourPrev2')?.addEventListener('click', () => setTourStep(1));
document.getElementById('tourNext2')?.addEventListener('click', () => setTourStep(3));
document.getElementById('tourPrev3')?.addEventListener('click', () => setTourStep(2));
document.getElementById('tourFinish')?.addEventListener('click', () => {
  tourDialog?.close();
  showToast('🚀 Khám phá LabSpace ngay! Dùng thanh GÓC NHÌN DEMO ở chân màn hình để đổi vai trò.');
});

document.querySelectorAll('.tour-action-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const action = btn.dataset.tourAction;
    tourDialog?.close();
    if (action === 'leader') {
      setGlobalRole('leader', false);
      showView('lesson');
      setDialogStep(1);
      dialog.showModal();
    } else if (action === 'member') {
      setGlobalRole('member', true);
      openNotifications();
    } else if (action === 'assign') {
      setGlobalRole('leader', true);
      openAssignment();
    } else if (action === 'coach') {
      setGlobalRole('coach', true);
    }
  });
});

/* =========================================================
   CORE ROLE-BASED SYSTEM: CỐ ĐỊNH & ĐỔI TOÀN BỘ GIAO DIỆN
   ========================================================= */
function setGlobalRole(role, autoNavigate = true) {
  currentRole = role;

  // 1. Cập nhật trạng thái active trong Dropdown menu trên Header
  document.querySelectorAll('.role-menu-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.role === role);
  });

  // 2. Cập nhật Header: Role Chip, Avatar, Thông báo
  const roleChipIcon = document.getElementById('roleChipIcon');
  const roleChipText = document.getElementById('roleChipText');
  const headerAvatar = document.getElementById('headerAvatar');
  const notifBadge = document.getElementById('notifBadge');

  if (role === 'leader') {
    if (roleChipIcon) roleChipIcon.textContent = '👑';
    if (roleChipText) roleChipText.textContent = 'Trọng · Nhóm trưởng';
    if (headerAvatar) {
      headerAvatar.textContent = 'T';
      headerAvatar.style.background = 'var(--blue)';
      headerAvatar.title = 'Tài khoản: Trọng (Nhóm trưởng)';
    }
    if (notifBadge) notifBadge.style.display = 'none';
  } else if (role === 'member') {
    if (roleChipIcon) roleChipIcon.textContent = '👤';
    if (roleChipText) roleChipText.textContent = 'Thùy Trang · Thành viên';
    if (headerAvatar) {
      headerAvatar.textContent = 'T';
      headerAvatar.style.background = '#098b8e';
      headerAvatar.title = 'Tài khoản: Thùy Trang (Thành viên)';
    }
    if (notifBadge) {
      notifBadge.style.display = 'grid';
      notifBadge.textContent = '1';
    }
  } else if (role === 'coach') {
    if (roleChipIcon) roleChipIcon.textContent = '👨‍🏫';
    if (roleChipText) roleChipText.textContent = 'Lab Coach · GV E403';
    if (headerAvatar) {
      headerAvatar.textContent = 'GV';
      headerAvatar.style.background = '#1a2b49';
      headerAvatar.title = 'Tài khoản: Lab Coach (Giảng viên)';
    }
    if (notifBadge) {
      notifBadge.style.display = 'grid';
      notifBadge.textContent = '2';
    }
  }

  // 3. Cập nhật Workspace View
  const workspaceRoleTag = document.getElementById('workspaceRoleTag');
  const workspaceRoleDesc = document.getElementById('workspaceRoleDesc');
  const startAssignment = document.getElementById('startAssignment');
  const startAssignmentBoard = document.getElementById('startAssignmentBoard');
  const memberRoleLock = document.getElementById('memberRoleLock');
  const tagLan = document.getElementById('tagLan');
  const tagMinh = document.getElementById('tagMinh');
  const requestCoach = document.getElementById('requestCoach');

  if (role === 'leader') {
    if (workspaceRoleTag) workspaceRoleTag.textContent = 'VIEW NHÓM TRƯỞNG · PHẠM HOÀNG TRỌNG';
    if (workspaceRoleDesc) workspaceRoleDesc.textContent = 'Mini Hackathon AI · Toàn quyền quản lý & phân task';
    if (startAssignment) startAssignment.hidden = false;
    if (startAssignmentBoard) startAssignmentBoard.hidden = false;
    if (memberRoleLock) memberRoleLock.style.display = 'none';
    if (tagLan) { tagLan.style.display = 'inline-block'; tagLan.textContent = '(Bạn - Trưởng nhóm)'; }
    if (tagMinh) { tagMinh.style.display = 'none'; }
    updateRequestCoachButtonState();

    if (!planApproved) {
      document.getElementById('planStatus').textContent = 'Chờ nhóm trưởng tạo bản nháp phân công. Checklist vẫn lấy từ bài LAB chính thức.';
    }
  } else if (role === 'member') {
    if (workspaceRoleTag) workspaceRoleTag.textContent = 'VIEW THÀNH VIÊN · LÊ THỊ THÙY TRANG';
    if (workspaceRoleDesc) workspaceRoleDesc.textContent = 'Mini Hackathon AI · Đã tham gia nhóm Sloppers';
    if (startAssignment) startAssignment.hidden = true;
    if (startAssignmentBoard) startAssignmentBoard.hidden = true;
    if (memberRoleLock) memberRoleLock.style.display = 'block';
    if (tagLan) { tagLan.style.display = 'inline-block'; tagLan.textContent = '(Trưởng nhóm)'; }
    if (tagMinh) { tagMinh.style.display = 'inline-block'; tagMinh.textContent = '(Bạn)'; }
    updateRequestCoachButtonState();

    if (!planApproved) {
      document.getElementById('planStatus').textContent = 'Bạn đã vào nhóm. Đang chờ nhóm trưởng kiểm tra và phê duyệt kế hoạch.';
    }
  } else if (role === 'coach') {
    if (workspaceRoleTag) workspaceRoleTag.textContent = 'VIEW LAB COACH · GIÁM SÁT';
    if (workspaceRoleDesc) workspaceRoleDesc.textContent = 'Chế độ xem của Giảng viên / Mentor (Read-only)';
    if (startAssignment) startAssignment.hidden = true;
    if (startAssignmentBoard) startAssignmentBoard.hidden = true;
    if (memberRoleLock) memberRoleLock.style.display = 'none';
    if (tagLan) { tagLan.style.display = 'inline-block'; tagLan.textContent = '(Trưởng nhóm)'; }
    if (tagMinh) { tagMinh.style.display = 'none'; }
    updateRequestCoachButtonState();
    updateCoachViewIndicators();
  }
  updateGithubSubmitCardState();

  // 4. Cập nhật Banner bài học (Lesson View)
  const lessonBannerTitle = document.getElementById('lessonBannerTitle');
  const lessonBannerDesc = document.getElementById('lessonBannerDesc');
  const lessonBannerActions = document.getElementById('lessonBannerActions');
  if (lessonBannerTitle && lessonBannerDesc && lessonBannerActions) {
    if (role === 'leader') {
      lessonBannerTitle.textContent = 'Lập nhóm trước, phân công khi cả nhóm đã sẵn sàng';
      lessonBannerDesc.textContent = 'Đang ở góc nhìn Nhóm trưởng (Trọng): Tạo nhóm, gửi lời mời thành viên và phê duyệt bản nháp phân công AI.';
      lessonBannerActions.innerHTML = '<button class="primary-button" id="openSetup" type="button">＋ Tạo nhóm Lab</button>';
      document.getElementById('openSetup').addEventListener('click', () => {
        setDialogStep(1);
        dialog.showModal();
      });
    } else if (role === 'member') {
      lessonBannerTitle.textContent = 'Lời mời tham gia nhóm Sloppers · Mini Hackathon AI';
      lessonBannerDesc.textContent = 'Đang ở góc nhìn Học viên (Thùy Trang): Trọng đã gửi cho bạn lời mời tham gia nhóm. Hãy xác nhận và khai báo kỹ năng phiên LAB.';
      lessonBannerActions.innerHTML = '<button class="primary-button" id="openMemberInviteBtn" type="button">📩 Xem lời mời & Onboarding</button>';
      document.getElementById('openMemberInviteBtn').addEventListener('click', openNotifications);
    } else if (role === 'coach') {
      lessonBannerTitle.textContent = 'Giám sát bài học Mini Hackathon · Lớp E403';
      lessonBannerDesc.textContent = 'Đang ở góc nhìn Lab Coach: Theo dõi tiến độ 12 nhóm thực hành, 3 nhóm đang có task blocked.';
      lessonBannerActions.innerHTML = '<button class="primary-button" id="openCoachBoardBtn" type="button">👨‍🏫 Mở Bảng điều khiển Coach</button>';
      document.getElementById('openCoachBoardBtn').addEventListener('click', () => showView('coach'));
    }
  }

  // 4b. Cập nhật banner người gửi trong Chat
  const chatSenderRoleName = document.getElementById('chatSenderRoleName');
  if (chatSenderRoleName) {
    if (role === 'leader') {
      chatSenderRoleName.innerHTML = '👑 Trọng (Nhóm trưởng)';
    } else if (role === 'member') {
      chatSenderRoleName.innerHTML = '👤 Thùy Trang (Thành viên - UI/Frontend)';
    } else {
      chatSenderRoleName.innerHTML = '👨‍🏫 Lab Coach (Giảng viên E403)';
    }
  }
  if (typeof renderChatMessages === 'function') {
    renderChatMessages();
  }

  // 5. Tự động chuyển view tương ứng khi đổi role
  if (autoNavigate) {
    if (role === 'coach') {
      showView('coach');
    } else if (role === 'member') {
      showView('workspace');
    } else if (role === 'leader') {
      const activeView = views.find(v => v.classList.contains('active'));
      if (activeView && activeView.id === 'view-coach') {
        showView('workspace');
      }
    }
  }
}

// Bắt sự kiện Click cho Role Dropdown trên Header
const roleDropdownWrap = document.getElementById('headerRoleDropdownWrap');
const headerRoleChip = document.getElementById('headerRoleChip');
const roleDropdownMenu = document.getElementById('roleDropdownMenu');

function toggleRoleDropdown(forceState) {
  if (!roleDropdownMenu) return;
  const isHidden = roleDropdownMenu.hidden;
  const willShow = typeof forceState === 'boolean' ? forceState : isHidden;
  roleDropdownMenu.hidden = !willShow;
  if (roleDropdownWrap) roleDropdownWrap.classList.toggle('open', willShow);
  if (headerRoleChip) headerRoleChip.setAttribute('aria-expanded', String(willShow));
}

function closeRoleDropdown() {
  toggleRoleDropdown(false);
}

headerRoleChip?.addEventListener('click', event => {
  event.stopPropagation();
  toggleRoleDropdown();
});

// Click chọn vai trò trong dropdown
document.querySelectorAll('.role-menu-item').forEach(item => {
  item.addEventListener('click', event => {
    event.stopPropagation();
    const role = item.dataset.role;
    if (role) {
      setGlobalRole(role, true);
    }
    closeRoleDropdown();
  });
});

// Click ra ngoài đóng dropdown
document.addEventListener('click', event => {
  if (roleDropdownWrap && !roleDropdownWrap.contains(event.target)) {
    closeRoleDropdown();
  }
});

// Nút mở tour từ dropdown
document.getElementById('dropdownTourBtn')?.addEventListener('click', event => {
  event.stopPropagation();
  closeRoleDropdown();
  openTour();
});

// Điều hướng chung
navButtons.forEach(button => button.addEventListener('click', event => {
  event.preventDefault();
  const link = button.dataset.viewLink;
  if (link === 'coach') {
    setGlobalRole('coach', true);
  } else {
    showView(link);
  }
}));

/* =========================================================
   STUDENT ID BLOCK INTERFACE & AUTO-RESOLVE LOOKUP MODULE
   ========================================================= */

const studentDirectory = {
  '2A202602765': { name: 'Phạm Hoàng Trọng', role: '👑 Nhóm trưởng (Leader)', class: 'K4-E403', avatar: 'T', color: '#0284c7' },
  '2A202602678': { name: 'Lê Thị Thùy Trang', role: 'Frontend / UI/UX Design', class: 'K4-E403', avatar: 'T', color: '#0d9488' },
  '2A202602676': { name: 'Lâm Hải Dương', role: 'AI / Prompt Engineer', class: 'K4-E403', avatar: 'D', color: '#7c3aed' },
  '2A202602523': { name: 'Hoàng Quốc Dũng', role: 'Backend / Data Engineer', class: 'K4-E403', avatar: 'D', color: '#ea580c' },
  '2A202602501': { name: 'Nguyễn Văn An', role: 'Data Analyst & ML', class: 'K4-E403', avatar: 'A', color: '#16a34a' },
  '2A202602555': { name: 'Trần Tuấn Bảo', role: 'Fullstack Web Dev', class: 'K4-E403', avatar: 'B', color: '#2563eb' },
  '2A202602600': { name: 'Vũ Mai Linh', role: 'Product & Design', class: 'K4-E403', avatar: 'L', color: '#db2777' },
  '2A202602800': { name: 'Đỗ Thành Nam', role: 'DevOps / Cloud Architecture', class: 'K4-E403', avatar: 'N', color: '#4f46e5' }
};

let currentMemberSlots = ['2A202602678', '2A202602676', '2A202602523'];

function updateSlotCardView(cardEl, idValue) {
  const cleanId = (idValue || '').trim().toUpperCase();
  const student = studentDirectory[cleanId];
  
  const statusPill = cardEl.querySelector('.slot-status-pill');
  const resolvedCard = cardEl.querySelector('.slot-resolved-card');
  const avatarEl = cardEl.querySelector('.resolved-avatar');
  const infoEl = cardEl.querySelector('.resolved-info');

  cardEl.classList.remove('matched', 'not-found');

  if (!cleanId) {
    if (statusPill) {
      statusPill.className = 'slot-status-pill';
      statusPill.innerHTML = '<span class="status-icon">○</span> Chưa nhập mã';
    }
    if (resolvedCard) {
      resolvedCard.classList.remove('active');
    }
    if (avatarEl) {
      avatarEl.textContent = '?';
      avatarEl.style.background = '#94a3b8';
    }
    if (infoEl) {
      infoEl.innerHTML = '<span class="resolved-placeholder">Nhập mã học viên để hệ thống tự nhảy tên...</span>';
    }
  } else if (student) {
    cardEl.classList.add('matched');
    if (statusPill) {
      statusPill.className = 'slot-status-pill matched';
      statusPill.innerHTML = '<span class="status-icon">✓</span> Đã nhận diện';
    }
    if (resolvedCard) {
      resolvedCard.classList.add('active');
    }
    if (avatarEl) {
      avatarEl.textContent = student.avatar;
      avatarEl.style.background = student.color;
    }
    if (infoEl) {
      infoEl.innerHTML = `
        <div class="resolved-name-row">
          <strong class="resolved-name">${student.name}</strong>
          <span class="resolved-tag">${student.class}</span>
        </div>
        <div class="resolved-role">${student.role}</div>
      `;
    }
  } else {
    cardEl.classList.add('not-found');
    if (statusPill) {
      statusPill.className = 'slot-status-pill not-found';
      statusPill.innerHTML = '<span class="status-icon">⚠️</span> Chưa tìm thấy';
    }
    if (resolvedCard) {
      resolvedCard.classList.remove('active');
    }
    if (avatarEl) {
      avatarEl.textContent = '!';
      avatarEl.style.background = '#f59e0b';
    }
    if (infoEl) {
      infoEl.innerHTML = '<span class="resolved-warning">⚠️ Không tìm thấy học viên trong khóa K4</span>';
    }
  }

  updateCreateGroupButtonState();
}

function updateCreateGroupButtonState() {
  const validStudents = [];
  const inputs = document.querySelectorAll('.student-id-input');
  inputs.forEach(inp => {
    const val = inp.value.trim().toUpperCase();
    if (studentDirectory[val]) {
      validStudents.push(studentDirectory[val].name);
    }
  });

  const count = validStudents.length;
  const createBtn = document.getElementById('createGroup');
  const noticeEl = document.getElementById('setupNotice');

  if (createBtn) {
    if (count > 0) {
      createBtn.textContent = `Tạo nhóm & gửi ${count} lời mời →`;
      createBtn.disabled = false;
    } else {
      createBtn.textContent = 'Nhập ít nhất 1 mã học viên để mời';
      createBtn.disabled = true;
    }
  }

  if (noticeEl) {
    if (count > 0) {
      noticeEl.innerHTML = `⌁ Sau khi tạo nhóm, hệ thống gửi <b>${count} lời mời</b> tham gia tới (${validStudents.join(', ')}). Bạn sẽ thấy số người đã vào nhóm tại LabSpace.`;
    } else {
      noticeEl.innerHTML = '⌁ Hãy nhập mã học viên để hệ thống gửi lời mời tham gia nhóm.';
    }
  }
}

function renderStudentSlots() {
  const container = document.getElementById('studentSlotList');
  if (!container) return;

  container.innerHTML = '';

  currentMemberSlots.forEach((idVal, idx) => {
    const slotNum = String(idx + 1).padStart(2, '0');
    const card = document.createElement('div');
    card.className = 'student-slot-card';
    card.dataset.slotIndex = idx;

    card.innerHTML = `
      <div class="slot-card-header">
        <div class="slot-header-left">
          <span class="slot-badge-num">${slotNum}</span>
          <strong class="slot-member-label">Thành viên ${idx + 1}</strong>
        </div>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="slot-status-pill">
            <span class="status-icon">○</span> Đang kiểm tra
          </span>
          ${currentMemberSlots.length > 2 ? `<button type="button" class="slot-remove-btn" title="Xóa ô mời này" data-remove-index="${idx}">×</button>` : ''}
        </div>
      </div>
      <div class="slot-card-body">
        <div class="slot-input-wrap">
          <span class="slot-input-icon">🪪</span>
          <input type="text" class="student-id-input" value="${idVal}" placeholder="VD: 2A202602678" maxlength="15" autocomplete="off" spellcheck="false" data-slot-index="${idx}" />
          <button type="button" class="slot-clear-btn" title="Xóa trắng mã" tabindex="-1">×</button>
        </div>
        <div class="slot-resolved-card">
          <div class="resolved-avatar">?</div>
          <div class="resolved-info"></div>
        </div>
      </div>
    `;

    container.appendChild(card);

    const input = card.querySelector('.student-id-input');
    const clearBtn = card.querySelector('.slot-clear-btn');
    const removeBtn = card.querySelector('.slot-remove-btn');

    input.addEventListener('focus', () => card.classList.add('is-focused'));
    input.addEventListener('blur', () => card.classList.remove('is-focused'));

    input.addEventListener('input', (e) => {
      const upper = e.target.value.toUpperCase();
      e.target.value = upper;
      currentMemberSlots[idx] = upper;
      updateSlotCardView(card, upper);
    });

    clearBtn?.addEventListener('click', () => {
      input.value = '';
      currentMemberSlots[idx] = '';
      input.focus();
      updateSlotCardView(card, '');
    });

    removeBtn?.addEventListener('click', () => {
      if (currentMemberSlots.length <= 2) {
        showToast('Nhóm lab cần tối thiểu 2 thành viên.');
        return;
      }
      currentMemberSlots.splice(idx, 1);
      renderStudentSlots();
    });

    // Initial view update
    updateSlotCardView(card, idVal);
  });

  updateCreateGroupButtonState();
}

function initStudentIdBlockHandlers() {
  document.getElementById('addMemberSlotBtn')?.addEventListener('click', () => {
    if (currentMemberSlots.length >= 5) {
      showToast('Số lượng thành viên tối đa trong một nhóm là 5 người.');
      return;
    }
    currentMemberSlots.push('');
    renderStudentSlots();
    const inputs = document.querySelectorAll('.student-id-input');
    if (inputs.length) {
      inputs[inputs.length - 1].focus();
    }
  });

  document.querySelectorAll('.quick-tag-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const idToFill = chip.dataset.id;
      if (!idToFill) return;

      let targetIdx = currentMemberSlots.findIndex(s => !s || s === idToFill);
      if (targetIdx === -1) {
        if (currentMemberSlots.length < 5) {
          currentMemberSlots.push(idToFill);
          targetIdx = currentMemberSlots.length - 1;
        } else {
          targetIdx = currentMemberSlots.length - 1;
          currentMemberSlots[targetIdx] = idToFill;
        }
      } else {
        currentMemberSlots[targetIdx] = idToFill;
      }
      renderStudentSlots();
      const card = document.querySelector(`.student-slot-card[data-slot-index="${targetIdx}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        const input = card.querySelector('.student-id-input');
        if (input) input.focus();
      }
      const student = studentDirectory[idToFill];
      const name = student ? student.name : idToFill;
      showToast(`Đã điền mã ${idToFill} · ${name} tự động nhảy lên thẻ!`);
    });
  });
}

// Setup dialog
document.getElementById('openSetup')?.addEventListener('click', () => {
  setGlobalRole('leader', false);
  setDialogStep(1);
  renderStudentSlots();
  dialog.showModal();
});
document.getElementById('closeDialog')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => closeOnBackdrop(dialog, event));

document.getElementById('createGroup')?.addEventListener('click', () => {
  dialog.close();
  setGlobalRole('leader', false);
  showView('workspace');

  const validStudents = [];
  document.querySelectorAll('.student-id-input').forEach(inp => {
    const val = inp.value.trim().toUpperCase();
    if (studentDirectory[val]) {
      validStudents.push(studentDirectory[val].name);
    }
  });

  const memberNames = validStudents.length > 0 ? validStudents.join(', ') : '3 thành viên';
  showToast(`Đã tạo nhóm Sloppers và gửi ${validStudents.length} lời mời (${memberNames}). Học viên xác nhận trong Thông báo của họ.`);
});

document.querySelectorAll('.skill-chips button').forEach(button => button.addEventListener('click', () => button.classList.toggle('selected')));
document.querySelectorAll('.proficiency input[type="range"]').forEach(input => input.addEventListener('input', () => {
  input.previousElementSibling.textContent = input.value;
}));

// Notification panel
document.getElementById('notificationsButton')?.addEventListener('click', openNotifications);
document.getElementById('closeNotifications')?.addEventListener('click', closeNotifications);
document.getElementById('declineNotification')?.addEventListener('click', () => {
  closeNotifications();
  showToast('Lời mời vẫn chưa được xác nhận.');
});
document.getElementById('acceptNotification')?.addEventListener('click', () => {
  closeNotifications();
  setMemberStep(1);
  memberDialog.showModal();
});
document.getElementById('closeMemberDialog')?.addEventListener('click', () => memberDialog.close());
memberDialog?.addEventListener('click', event => closeOnBackdrop(memberDialog, event));

document.getElementById('submitMemberProfile')?.addEventListener('click', () => {
  memberDialog.close();
  minhProfileSubmitted = true;
  document.getElementById('memberCount').textContent = '2/4 xác nhận';
  document.getElementById('minhMemberStatus').textContent = 'Đã xác nhận · Hồ sơ đã lưu';
  const minhJoined = document.getElementById('minhJoinedStatus');
  if (minhJoined) {
    minhJoined.textContent = 'Đã vào';
    minhJoined.className = '';
  }
  const dockBadge = document.getElementById('dockMemberBadge');
  if (dockBadge) dockBadge.style.display = 'none';
  const memberDropdownBadge = document.getElementById('memberDropdownBadge');
  if (memberDropdownBadge) memberDropdownBadge.style.display = 'none';
  const notifBadge = document.getElementById('notifBadge');
  if (notifBadge) notifBadge.style.display = 'none';
  setGlobalRole('member', false);
  showView('workspace');
  showToast('Đã lưu hồ sơ phiên Lab của Thùy Trang! Trọng sẽ thấy cập nhật thành viên trong LabSpace.');
});

// Phân công task & Tương tác AI vs Human Override
document.getElementById('startAssignment')?.addEventListener('click', openAssignment);
document.getElementById('startAssignmentBoard')?.addEventListener('click', openAssignment);
document.getElementById('closeAssignment')?.addEventListener('click', () => {
  clearAiAnalysisTimers();
  assignmentDialog.close();
});
assignmentDialog?.addEventListener('click', event => closeOnBackdrop(assignmentDialog, event));
document.getElementById('aiSkipWaitBtn')?.addEventListener('click', () => finishAiAnalysis(false));

document.querySelectorAll('#assignmentList select').forEach(select => {
  select.addEventListener('change', () => {
    const idx = select.dataset.idx;
    const chip = document.getElementById(`aiTag-${idx}`);
    const original = initialAiProposals[idx];
    if (chip && original) {
      if (select.value === original.name) {
        chip.className = 'ai-proposal-chip';
        chip.textContent = `🤖 AI đề xuất: ${original.name} (${original.desc})`;
      } else {
        chip.className = 'ai-proposal-chip overridden';
        chip.textContent = `✏ Nhóm trưởng đã ghi đè: Đổi sang ${select.value} (thay vì AI đề xuất ${original.name})`;
      }
    }
  });
});

document.getElementById('regeneratePlan')?.addEventListener('click', () => {
  // Reset all selects to AI proposal
  document.querySelectorAll('#assignmentList select').forEach(select => {
    const idx = select.dataset.idx;
    const original = initialAiProposals[idx];
    if (original) {
      select.value = original.name;
      const chip = document.getElementById(`aiTag-${idx}`);
      if (chip) {
        chip.className = 'ai-proposal-chip';
        chip.textContent = `🤖 AI đề xuất: ${original.name} (${original.desc})`;
      }
    }
  });
  runAiTaskAnalysis(true);
});

document.getElementById('approvePlan')?.addEventListener('click', () => {
  document.querySelectorAll('#assignmentList select').forEach((select, index) => {
    const owner = select.value;
    const meta = ownerMeta[owner] || { initial: '?', className: 'blue-bg', skill: 'Thành viên' };
    const target = tasks[index].querySelector('.task-owner');
    target.classList.remove('unassigned');
    target.innerHTML = `<span class="member-avatar ${meta.className}">${meta.initial}</span><div><b>${owner}</b><small>${meta.skill}</small></div>`;
  });
  planApproved = true;
  assignmentDialog.close();
  document.getElementById('planStatus').textContent = 'Đã phê duyệt. Từng thành viên tick task khi hoàn thành; tiến độ cập nhật cho cả nhóm.';
  const planButton = document.getElementById('startAssignmentBoard');
  if (planButton) {
    planButton.textContent = '✓ Đã phê duyệt';
    planButton.disabled = true;
  }
  const teamButton = document.getElementById('startAssignment');
  if (teamButton) {
    teamButton.textContent = '✓ Phân công đã duyệt';
    teamButton.disabled = true;
  }
  document.querySelector('.ready-score h2').textContent = 'Bắt đầu thực hiện kế hoạch';
  document.getElementById('remainingText').textContent = 'Còn 5 mục cần hoàn thành';
  showToast('Đã phê duyệt phân công. Kế hoạch đã mở cho cả nhóm.');
});

function copyText(text, message) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => undefined);
  showToast(message);
}
document.getElementById('copyCode')?.addEventListener('click', () => copyText('SLOP-3B', 'Đã sao chép mã nhóm SLOP-3B'));

function updateProgress() {
  const complete = tasks.filter(task => task.querySelector('input').checked).length;
  const percent = Math.round((complete / tasks.length) * 100);
  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('readyPercent').textContent = `${percent}%`;
  document.querySelector('.ring').style.background = `conic-gradient(var(--blue) ${percent}%, #e6e8eb 0)`;
  document.getElementById('remainingText').textContent = percent === 100 ? 'Tất cả deliverable đã hoàn thành' : `Còn ${tasks.length - complete} mục cần hoàn thành`;
  document.querySelectorAll('.deliverable-list input').forEach((input, index) => { input.checked = tasks[index].querySelector('input').checked; });
}

tasks.forEach(task => task.querySelector('input').addEventListener('change', event => {
  if (currentRole === 'coach') {
    event.target.checked = !event.target.checked;
    showToast('Chế độ Lab Coach chỉ xem, không thể cập nhật trực tiếp task của sinh viên.');
    return;
  }
  if (!planApproved) {
    event.target.checked = false;
    showToast('Nhóm trưởng cần phê duyệt phân công trước khi cập nhật tiến độ.');
    return;
  }
  task.classList.toggle('done', event.target.checked);
  updateProgress();
  showToast(event.target.checked ? 'Đã đánh dấu task hoàn thành' : 'Đã mở lại task');
}));

/* =========================================================
   AI DOUBLE-CHECK GITHUB DELIVERABLES SUBMISSION SYSTEM
   ========================================================= */

let labGithubSubmitted = false;
let aiGithubChecked = false;
let aiScanTimers = [];

function clearAiScanTimers() {
  aiScanTimers.forEach(t => clearTimeout(t));
  aiScanTimers = [];
}

const githubCheckModalEl = document.getElementById('githubCheckModal');
githubCheckModalEl?.addEventListener('click', event => closeOnBackdrop(githubCheckModalEl, event));
githubCheckModalEl?.addEventListener('close', () => {
  clearAiScanTimers();
});

window.openGithubCheckModal = function () {
  const repoInput = document.getElementById('githubRepoInput');
  const repoUrl = repoInput ? repoInput.value.trim() : '';

  if (!repoUrl || !repoUrl.toLowerCase().includes('github.com')) {
    showToast('Vui lòng nhập đường dẫn GitHub Repository hợp lệ của nhóm (VD: https://github.com/sloppers-team/vlearn-hackathon-cp1-5).');
    if (repoInput) repoInput.focus();
    return;
  }

  const modal = document.getElementById('githubCheckModal');
  if (!modal) return;

  const targetUrlDisplay = document.getElementById('scanTargetUrlDisplay');
  if (targetUrlDisplay) targetUrlDisplay.textContent = repoUrl;

  const progressBar = document.getElementById('scanProgressBar');
  const liveLogs = document.getElementById('scanLiveLogs');
  const summaryBanner = document.getElementById('verificationSummaryBanner');
  const btnConfirm = document.getElementById('btnConfirmFinalSubmit');

  if (progressBar) progressBar.style.width = '0%';
  if (liveLogs) {
    liveLogs.innerHTML = `
      <div class="scan-log-item info">
        <span>⏳ Đang kết nối tới ${escapeHtml(repoUrl)}...</span>
      </div>
    `;
  }
  if (summaryBanner) summaryBanner.style.display = 'none';
  if (btnConfirm) btnConfirm.disabled = true;

  // Đặt lại các huy hiệu trạng thái về scanning
  const checkpoints = ['Cp1', 'Cp2', 'Cp3', 'Cp4', 'Cp5'];
  checkpoints.forEach(cp => {
    const pill = document.getElementById('statusPill' + cp);
    if (pill) {
      pill.className = 'status-pill scanning';
      pill.textContent = '⏳ Đang quét...';
    }
  });

  clearAiScanTimers();
  modal.showModal();

  // Chuỗi quét đối chiếu mô phỏng trực quan
  aiScanTimers.push(setTimeout(() => {
    if (progressBar) progressBar.style.width = '20%';
    const pill1 = document.getElementById('statusPillCp1');
    if (pill1) { pill1.className = 'status-pill ok'; pill1.textContent = '✓ Đã có'; }
    appendScanLog('✓ [1. Canvas CP1] docs/canvas-7-dong.md: 22 dòng, đủ 7 mục bài toán & giá trị.');
  }, 450));

  aiScanTimers.push(setTimeout(() => {
    if (progressBar) progressBar.style.width = '45%';
    const pill2 = document.getElementById('statusPillCp2');
    if (pill2) { pill2.className = 'status-pill ok'; pill2.textContent = '✓ Đã có'; }
    appendScanLog('✓ [2. Flow CP2] mockups/Flow_Mockup_CP2_Figma.png: 2.4 MB, sơ đồ luồng tương tác UX/UI.');
  }, 900));

  aiScanTimers.push(setTimeout(() => {
    if (progressBar) progressBar.style.width = '70%';
    const pill3 = document.getElementById('statusPillCp3');
    if (pill3) { pill3.className = 'status-pill ok'; pill3.textContent = '✓ Đạt chuẩn'; }
    appendScanLog('✓ [3. Golden Set CP3] benchmarks/Golden_Set_Benchmark_CP3.csv: 20 prompt test + ground truth rubric.');
  }, 1350));

  aiScanTimers.push(setTimeout(() => {
    if (progressBar) progressBar.style.width = '90%';
    const pill4 = document.getElementById('statusPillCp4');
    if (pill4) { pill4.className = 'status-pill ok'; pill4.textContent = '✓ Đạt chuẩn'; }
    appendScanLog('✓ [4. Evidence Log] evidence/evidence_log_20_users.csv: 20 mẫu khảo sát người dùng.');
  }, 1800));

  aiScanTimers.push(setTimeout(() => {
    if (progressBar) progressBar.style.width = '100%';
    const pill5 = document.getElementById('statusPillCp5');
    if (pill5) { pill5.className = 'status-pill ok'; pill5.textContent = '✓ Đã có'; }
    appendScanLog('✓ [5. Slide & README] README.md & slides/day06_pitch.pdf: Đặc tả & slide báo cáo.');
    appendScanLog('✨ AI SUBMISSION VALIDATOR: Toàn bộ 5/5 Deliverables đã đầy đủ & hợp lệ theo Rubric!', 'success');

    if (summaryBanner) summaryBanner.style.display = 'flex';
    if (btnConfirm) btnConfirm.disabled = false;

    aiGithubChecked = true;
    const btnFinalSubmitLab = document.getElementById('btnFinalSubmitLab');
    if (btnFinalSubmitLab) btnFinalSubmitLab.disabled = false;
  }, 2250));
};

function appendScanLog(text, type = 'info') {
  const liveLogs = document.getElementById('scanLiveLogs');
  if (!liveLogs) return;
  const item = document.createElement('div');
  item.className = `scan-log-item ${type}`;
  item.innerHTML = `<span>${escapeHtml(text)}</span>`;
  liveLogs.appendChild(item);
  liveLogs.scrollTop = liveLogs.scrollHeight;
}

window.confirmFinalSubmitLab = function () {
  const modal = document.getElementById('githubCheckModal');
  if (modal) modal.close();
  executeFinalSubmitLab();
};

window.handleFinalSubmitLab = function () {
  if (!aiGithubChecked) {
    openGithubCheckModal();
    return;
  }
  executeFinalSubmitLab();
};

function executeFinalSubmitLab() {
  if (currentRole === 'coach') {
    showToast('Chế độ Lab Coach chỉ xem, không thể nộp bài thay nhóm sinh viên.');
    return;
  }

  const repoInput = document.getElementById('githubRepoInput');
  const repoUrl = repoInput ? repoInput.value.trim() : 'https://github.com/sloppers-team/vlearn-hackathon-cp1-5';

  labGithubSubmitted = true;
  planApproved = true;

  // 1. Đánh dấu tất cả 5 task hoàn thành
  tasks.forEach(task => {
    const chk = task.querySelector('input');
    if (chk) chk.checked = true;
    task.classList.add('done');
  });
  updateProgress();

  // 2. Tick tất cả deliverable trong submit-panel
  document.querySelectorAll('.deliverable-list input').forEach(input => {
    input.checked = true;
  });

  // 3. Cập nhật vòng tròn tiến độ và tiêu đề
  const readyPercent = document.getElementById('readyPercent');
  if (readyPercent) readyPercent.textContent = '100%';
  const ring = document.querySelector('.ring');
  if (ring) ring.style.background = 'conic-gradient(var(--blue) 100%, #e6e8eb 0)';
  const readyScoreTitle = document.querySelector('.ready-score h2');
  if (readyScoreTitle) readyScoreTitle.textContent = 'Đã hoàn thành bài Lab!';
  const remainingText = document.getElementById('remainingText');
  if (remainingText) remainingText.textContent = 'Đã nộp bài chính thức qua GitHub (5/5 Deliverables)';

  // 4. Cập nhật thẻ nộp GitHub
  const card = document.getElementById('githubSubmitCard');
  if (card) card.classList.add('submitted');
  if (repoInput) repoInput.disabled = true;

  const btnAi = document.getElementById('btnAiCheckGithub');
  if (btnAi) {
    btnAi.innerHTML = '✓ Đã kiểm tra đối chiếu AI (5/5 Đạt chuẩn)';
    btnAi.classList.remove('primary-button');
    btnAi.classList.add('secondary-button');
  }

  const btnFinal = document.getElementById('btnFinalSubmitLab');
  if (btnFinal) {
    btnFinal.disabled = true;
    btnFinal.innerHTML = '✓ Đã nộp bài qua GitHub';
    btnFinal.style.background = '#16a34a';
    btnFinal.style.color = '#ffffff';
  }

  // 5. Gửi thông báo chúc mừng vào Kênh thảo luận nhóm
  const senderName = currentRole === 'leader' ? 'Trọng' : 'Trang';
  const senderRoleName = currentRole === 'leader' ? '👑 Nhóm trưởng' : 'UI / Frontend';
  const avatarChar = 'T';
  const avatarClass = currentRole === 'leader' ? 'leader' : 'member';

  chatMessagesData.push({
    id: Date.now(),
    sender: senderName,
    role: currentRole,
    roleName: senderRoleName,
    avatarChar: avatarChar,
    avatarClass: avatarClass,
    time: formatTimeNow(),
    html: `
      <div class="chat-help-notice-card resolved">
        <div class="chat-help-notice-title" style="color: #166534;">
          <span>🎉 NỘP BÀI LAB QUA GITHUB THÀNH CÔNG (5/5 DELIVERABLES)</span>
        </div>
        <div style="font-size: 12.5px; color: #166534; line-height: 1.45; margin-bottom: 6px;">
          ${senderName} (${senderRoleName}) đã hoàn tất nộp link GitHub sau khi AI Double-Check xác nhận đầy đủ <b>5/5 Deliverables</b>!
        </div>
        <div style="font-size: 11.5px; background: rgba(22, 163, 74, 0.08); padding: 6px 10px; border-radius: 6px; color: #15803d; word-break: break-all;">
          🔗 <b>Repository:</b> <a href="${escapeHtml(repoUrl)}" target="_blank" style="color: #0369a1; text-decoration: underline; font-family: ui-monospace, monospace;">${escapeHtml(repoUrl)}</a>
        </div>
        <div style="margin-top: 6px; font-size: 11px; color: #64748b;">
          🛡️ Đã đối chiếu: Canvas CP1, Flow CP2, Golden Set CP3, Evidence Log, Slide & README.
        </div>
      </div>
    `,
    attachment: null
  });
  renderChatMessages();
  unreadChatCount++;
  updateRailBadge();

  // 6. Cập nhật Bảng giám sát của Lab Coach
  const sloppersRow = document.getElementById('coachRowSloppers');
  if (sloppersRow) {
    const checklistCell = sloppersRow.children[1];
    if (checklistCell) {
      checklistCell.innerHTML = `
        <i class="mini-progress"><em style="width:100%"></em></i><b>100%</b>
        <small style="display:block; color:#0284c7; font-size:10.5px; margin-top:2px;">Repo: sloppers-team/vlearn... ↗</small>
      `;
    }
  }

  showToast('🎉 Nhóm Sloppers đã nộp bài Lab thành công! Toàn bộ 5 Deliverable đã hoàn tất.');
}

function updateGithubSubmitCardState() {
  const card = document.getElementById('githubSubmitCard');
  const btnAi = document.getElementById('btnAiCheckGithub');
  const btnFinal = document.getElementById('btnFinalSubmitLab');
  const repoInput = document.getElementById('githubRepoInput');
  if (!card) return;

  if (labGithubSubmitted) {
    card.classList.add('submitted');
    if (repoInput) repoInput.disabled = true;
    if (btnAi) {
      btnAi.innerHTML = '✓ Đã kiểm tra đối chiếu AI (5/5 Đạt chuẩn)';
      btnAi.classList.remove('primary-button');
      btnAi.classList.add('secondary-button');
    }
    if (btnFinal) {
      btnFinal.disabled = true;
      btnFinal.innerHTML = '✓ Đã nộp bài qua GitHub';
      btnFinal.style.background = '#16a34a';
      btnFinal.style.color = '#ffffff';
    }
  } else {
    if (currentRole === 'coach') {
      if (btnAi) btnAi.title = 'Chế độ Coach chỉ xem, không thay thế sinh viên thao tác';
      if (btnFinal) btnFinal.title = 'Chế độ Coach chỉ xem';
    } else {
      if (btnAi) btnAi.removeAttribute('title');
      if (btnFinal) btnFinal.removeAttribute('title');
    }
  }
}

/* =========================================================
   COACH HELP REQUEST & RESPONSE SYSTEM (STUDENT & COACH FLOW)
   ========================================================= */

let coachHelpRequests = {
  Sloppers: {
    id: 'req-slop-01',
    team: 'Sloppers',
    teamCode: 'SLOP-3B',
    sender: 'Trọng (Nhóm trưởng)',
    senderRole: 'leader',
    senderAvatar: '👑',
    topic: 'Checkpoint 3: Golden Set Benchmark & Prompt (CP3)',
    question: 'Nhóm em đang bị vướng tiêu chí đánh giá độ chính xác của Golden Set CP3, mong Coach xem giúp bộ test 20 prompt ạ!',
    time: '2 phút trước',
    isUrgent: true,
    status: 'pending', // 'pending' | 'resolved'
    replies: []
  },
  'Null Pointers': {
    id: 'req-null-02',
    team: 'Null Pointers',
    teamCode: 'NULL-12',
    sender: 'Đức (Nhóm trưởng)',
    senderRole: 'leader',
    senderAvatar: '👑',
    topic: 'Kỹ thuật: Kết nối API & Pipeline CP1',
    question: 'Nhóm em gặp lỗi timeout khi gọi LLM API để parse dữ liệu evidence log, nhờ Coach hỗ trợ cấu hình key và rate limit ạ.',
    time: '11 phút trước',
    isUrgent: true,
    status: 'pending',
    replies: []
  }
};

let currentViewingCoachTeam = 'Sloppers';

const coachHelpModal = document.getElementById('coachHelpModal');
const coachResponseModal = document.getElementById('coachResponseModal');

// Nút ở Workspace
document.getElementById('requestCoach')?.addEventListener('click', () => {
  if (currentRole === 'coach') {
    openCoachResponseModal('Sloppers');
    return;
  }
  openCoachHelpModal();
});

function updateRequestCoachButtonState() {
  const requestCoach = document.getElementById('requestCoach');
  if (!requestCoach) return;

  if (currentRole === 'coach') {
    requestCoach.className = 'primary-button full';
    requestCoach.textContent = '👨‍🏫 Xem & Giải đáp yêu cầu nhóm này';
    return;
  }

  const req = coachHelpRequests['Sloppers'];
  if (req && req.status === 'pending') {
    requestCoach.className = 'danger-outline full pending-request';
    requestCoach.textContent = '⏳ Đang chờ Coach hỗ trợ (1 yêu cầu)';
  } else if (req && req.status === 'resolved') {
    requestCoach.className = 'secondary-button full resolved-request';
    requestCoach.textContent = '✓ Coach đã giải đáp · Gửi yêu cầu mới';
  } else {
    requestCoach.className = 'danger-outline full';
    requestCoach.textContent = '☝ Yêu cầu Coach hỗ trợ';
  }
}

function openCoachHelpModal() {
  if (!coachHelpModal) return;
  const senderBadge = document.getElementById('helpSenderBadge');
  if (senderBadge) {
    const roleTitle = currentRole === 'leader' ? 'Trọng (Nhóm trưởng)' : 'Thùy Trang (Thành viên)';
    senderBadge.textContent = `Người gửi: ${roleTitle} · Mini Hackathon AI`;
  }
  coachHelpModal.showModal();
}

window.applyQuickQuestion = function (text) {
  const textarea = document.getElementById('helpQuestionText');
  if (textarea) {
    textarea.value = text;
    textarea.focus();
  }
};

window.handleSendHelpRequest = function (event) {
  event.preventDefault();
  const topicSelect = document.getElementById('helpTopicSelect');
  const questionInput = document.getElementById('helpQuestionText');
  const urgentCheck = document.getElementById('helpUrgentCheck');

  const topic = topicSelect ? topicSelect.value : 'Hỗ trợ chung bài Lab';
  const question = questionInput ? questionInput.value.trim() : '';
  const isUrgent = urgentCheck ? urgentCheck.checked : false;

  if (!question) {
    showToast('Vui lòng nhập nội dung câu hỏi hoặc vấn đề nhóm đang gặp phải.');
    return;
  }

  const senderName = currentRole === 'leader' ? 'Trọng (Nhóm trưởng)' : 'Trang (Thành viên)';
  const senderAvatar = currentRole === 'leader' ? '👑' : '👤';

  coachHelpRequests.Sloppers = {
    id: 'req-slop-' + Date.now(),
    team: 'Sloppers',
    teamCode: 'SLOP-3B',
    sender: senderName,
    senderRole: currentRole,
    senderAvatar: senderAvatar,
    topic: topic,
    question: question,
    time: 'Vừa xong',
    isUrgent: isUrgent,
    status: 'pending',
    replies: []
  };

  // Thông báo vào Kênh thảo luận nhóm
  chatMessagesData.push({
    id: Date.now(),
    sender: currentRole === 'leader' ? 'Trọng' : 'Trang',
    role: currentRole,
    roleName: currentRole === 'leader' ? '👑 Nhóm trưởng' : 'UI / Frontend',
    avatarChar: 'T',
    avatarClass: currentRole === 'leader' ? 'leader' : 'member',
    time: formatTimeNow(),
    html: `
      <div class="chat-help-notice-card">
        <div class="chat-help-notice-title">
          <span>☝ Đã gửi yêu cầu hỗ trợ tới Lab Coach</span>
        </div>
        <div style="font-size: 12px; margin-bottom: 5px; color: #0369a1;">
          <b>Chủ đề:</b> ${escapeHtml(topic)}
        </div>
        <div class="chat-help-notice-body">"${escapeHtml(question)}"</div>
        <div style="margin-top: 6px; font-size: 11px; color: #64748b;">
          ⏳ Đang chờ Lab Coach (E403) xem xét và giải đáp...
        </div>
      </div>
    `,
    attachment: null
  });
  renderChatMessages();

  // Cập nhật nút bấm và chỉ số
  updateRequestCoachButtonState();
  updateCoachViewIndicators();

  if (coachHelpModal) coachHelpModal.close();
  showToast('🚀 Đã gửi yêu cầu hỗ trợ tới Lab Coach thành công!');
};

// Lab Coach mở modal xem chi tiết yêu cầu của nhóm
window.openCoachResponseModal = function (teamName) {
  currentViewingCoachTeam = teamName || 'Sloppers';
  const req = coachHelpRequests[currentViewingCoachTeam];
  if (!req || !coachResponseModal) return;

  const title = document.getElementById('coachResponseTitle');
  const kicker = document.getElementById('coachResponseKicker');
  const avatar = document.getElementById('coachReqAvatar');
  const senderName = document.getElementById('coachReqSenderName');
  const time = document.getElementById('coachReqTime');
  const topic = document.getElementById('coachReqTopic');
  const questionText = document.getElementById('coachReqQuestionText');
  const statusBadge = document.getElementById('coachReqStatusBadge');
  const replyInput = document.getElementById('coachReplyText');

  if (title) title.textContent = `Yêu cầu hỗ trợ — Nhóm ${req.team} (${req.teamCode})`;
  if (kicker) kicker.textContent = `LAB COACH · PHIÊN HỖ TRỢ NHÓM ${req.team.toUpperCase()}`;
  if (avatar) avatar.textContent = req.senderAvatar || '👑';
  if (senderName) senderName.textContent = `${req.sender} · Nhóm ${req.team}`;
  if (time) time.textContent = `Gửi lúc ${req.time} · Mã nhóm: ${req.teamCode}`;
  if (topic) topic.textContent = req.topic;
  if (questionText) questionText.textContent = `"${req.question}"`;

  if (statusBadge) {
    if (req.status === 'pending') {
      statusBadge.className = 'request-status-badge pending';
      statusBadge.textContent = '⏳ Chờ giải đáp';
    } else {
      statusBadge.className = 'request-status-badge resolved';
      statusBadge.textContent = '✓ Đã hoàn thành';
    }
  }

  if (replyInput) replyInput.value = '';
  renderCoachReplyHistory(req);

  coachResponseModal.showModal();
};

function renderCoachReplyHistory(req) {
  const historySection = document.getElementById('coachHistorySection');
  const historyList = document.getElementById('coachHistoryList');
  if (!historySection || !historyList) return;

  if (req.replies && req.replies.length > 0) {
    historySection.style.display = 'block';
    historyList.innerHTML = req.replies.map(r => `
      <div class="coach-history-item">
        <strong>👨‍🏫 Lời giải đáp:</strong> ${escapeHtml(r.text)}
        <small>Gửi lúc: ${r.time}</small>
      </div>
    `).join('');
  } else {
    historySection.style.display = 'none';
    historyList.innerHTML = '';
  }
}

window.applyCoachQuickReply = function (text) {
  const replyTextarea = document.getElementById('coachReplyText');
  if (replyTextarea) {
    replyTextarea.value = text;
    replyTextarea.focus();
  }
};

window.handleCoachSendReply = function () {
  const replyTextarea = document.getElementById('coachReplyText');
  const replyText = replyTextarea ? replyTextarea.value.trim() : '';

  if (!replyText) {
    showToast('Vui lòng nhập nội dung giải đáp cho nhóm.');
    return;
  }

  const req = coachHelpRequests[currentViewingCoachTeam];
  if (!req) return;

  const timeNow = formatTimeNow();
  req.replies.push({
    time: timeNow,
    text: replyText
  });

  // Gửi trực tiếp vào Kênh chat nhóm
  chatMessagesData.push({
    id: Date.now(),
    sender: 'Lab Coach (E403)',
    role: 'coach',
    roleName: '👨‍🏫 Lab Coach',
    avatarChar: '👨‍🏫',
    avatarClass: 'ai',
    time: timeNow,
    html: `
      <div style="border-left: 3px solid #0284c7; padding-left: 8px; margin-bottom: 6px; font-size: 12px; color: #0369a1;">
        📌 <b>Giải đáp yêu cầu hỗ trợ:</b> ${escapeHtml(req.topic)}
      </div>
      <div style="line-height: 1.5; color: #0f172a;">${escapeHtml(replyText).replace(/\n/g, '<br>')}</div>
    `,
    attachment: null
  });
  renderChatMessages();
  unreadChatCount++;
  updateRailBadge();

  renderCoachReplyHistory(req);
  if (replyTextarea) replyTextarea.value = '';

  showToast(`💬 Đã gửi lời giải đáp của Coach tới nhóm ${req.team}!`);
};

window.handleCoachCompleteRequest = function () {
  const req = coachHelpRequests[currentViewingCoachTeam];
  if (!req) return;

  req.status = 'resolved';

  // Thêm thông báo hoàn thành vào chat nhóm
  chatMessagesData.push({
    id: Date.now(),
    sender: 'Lab Coach (E403)',
    role: 'coach',
    roleName: '👨‍🏫 Lab Coach',
    avatarChar: '👨‍🏫',
    avatarClass: 'ai',
    time: formatTimeNow(),
    html: `
      <div class="chat-help-notice-card resolved">
        <div class="chat-help-notice-title">
          <span>✓ Lab Coach đã hoàn thành phiên giải đáp</span>
        </div>
        <div style="font-size: 12.5px; color: #166534; line-height: 1.45;">
          Yêu cầu hỗ trợ về <b>${escapeHtml(req.topic)}</b> đã được giải đáp hoàn tất. Chúc nhóm ${req.team} tiếp tục hoàn thành tốt bài Lab!
        </div>
      </div>
    `,
    attachment: null
  });
  renderChatMessages();
  unreadChatCount++;
  updateRailBadge();

  // Cập nhật giao diện
  updateRequestCoachButtonState();
  updateCoachViewIndicators();

  if (coachResponseModal) coachResponseModal.close();
  showToast(`✅ Đã hoàn thành giải đáp cho nhóm ${req.team}!`);
};

function updateCoachViewIndicators() {
  const sloppersReq = coachHelpRequests['Sloppers'];
  const sloppersActionCell = document.getElementById('coachSloppersActionCell');
  const sloppersBlocked = document.getElementById('coachSloppersBlocked');

  if (sloppersActionCell && sloppersReq) {
    if (sloppersReq.status === 'pending') {
      sloppersActionCell.innerHTML = `<button class="danger-outline coach-btn-req-pending" type="button" id="btnCoachViewSloppers" onclick="openCoachResponseModal('Sloppers')">⚠️ Xem yêu cầu</button>`;
      if (sloppersBlocked) {
        sloppersBlocked.className = 'warning';
        sloppersBlocked.textContent = '1 task';
      }
    } else {
      sloppersActionCell.innerHTML = `<button class="secondary-button coach-btn-req-done" type="button" id="btnCoachViewSloppers" onclick="openCoachResponseModal('Sloppers')">✓ Đã giải đáp</button>`;
      if (sloppersBlocked) {
        sloppersBlocked.className = '';
        sloppersBlocked.textContent = '0 task';
      }
    }
  }

  // Cập nhật số liệu Coach summary
  let pendingCount = 0;
  for (const team in coachHelpRequests) {
    if (coachHelpRequests[team].status === 'pending') pendingCount++;
  }
  const helpCountEl = document.getElementById('coachHelpNeededCount');
  if (helpCountEl) helpCountEl.textContent = pendingCount;
}

function initTeamChatListeners() {
  // Sidebar Controls
  document.getElementById('chatCollapseBtn')?.addEventListener('click', collapseChatSidebar);
  document.getElementById('chatExpandRail')?.addEventListener('click', expandChatSidebar);

  // 2 Channel Tabs
  document.getElementById('tabBtnGroupChat')?.addEventListener('click', () => switchChatTab('group'));
  document.getElementById('tabBtnAiChat')?.addEventListener('click', () => switchChatTab('ai'));

  // Tab 1: Group Chat Form
  document.getElementById('chatInputForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('chatInputText');
    const text = input ? input.value : '';
    if (!text.trim() && !currentAttachment) return;
    sendChatMessage(text, currentAttachment);
    if (input) input.value = '';
  });

  // Tab 1: Ask AI in Group mention button
  document.getElementById('chatAskAiInGroupBtn')?.addEventListener('click', () => {
    const input = document.getElementById('chatInputText');
    if (input) {
      input.value = '@Trợ lý AI ';
      input.focus();
    }
  });

  document.getElementById('chatAttachPickerBtn')?.addEventListener('click', () => {
    document.getElementById('chatFileInput')?.click();
  });

  document.getElementById('chatFileInput')?.addEventListener('change', event => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    let sizeStr = `${(file.size / 1024).toFixed(1)} KB`;
    if (file.size > 1024 * 1024) {
      sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    }
    let icon = '📄';
    if (file.type.includes('image')) icon = '🖼️';
    else if (file.name.endsWith('.pdf')) icon = '📑';
    else if (file.name.endsWith('.csv') || file.name.endsWith('.xlsx')) icon = '📊';

    setChatAttachment(file.name, sizeStr, file.type, icon);
  });

  document.getElementById('chatQuickDocsBtn')?.addEventListener('click', () => {
    const menu = document.getElementById('quickDocsMenu');
    if (menu) {
      menu.style.display = menu.style.display === 'none' ? 'flex' : 'none';
    }
  });

  document.querySelectorAll('.quick-doc-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.name;
      const size = btn.dataset.size;
      const type = btn.dataset.type;
      let icon = '📄';
      if (type === 'img') icon = '🖼️';
      if (type === 'data') icon = '📊';
      if (type === 'pdf') icon = '📑';
      setChatAttachment(name, size, type, icon);
    });
  });

  document.getElementById('removeAttachBtn')?.addEventListener('click', clearChatAttachment);
  document.getElementById('chatAiSummaryBtn')?.addEventListener('click', triggerAiChatSummary);

  // Tab 2: AI 1:1 Chat Form
  document.getElementById('aiChatInputForm')?.addEventListener('submit', event => {
    event.preventDefault();
    const input = document.getElementById('aiChatInputText');
    const text = input ? input.value : '';
    if (!text.trim()) return;
    sendAiPrivateMessage(text);
    if (input) input.value = '';
  });

  document.getElementById('aiClearHistoryBtn')?.addEventListener('click', clearAiPrivateHistory);

  // Initial rendering
  document.body.classList.add('chat-sidebar-open');
  renderChatMessages();
  renderAiPrivateMessages();
}

initTeamChatListeners();
updateRequestCoachButtonState();
updateCoachViewIndicators();

// Khởi tạo ban đầu
const initial = location.hash.replace('#', '');
if (initial === 'coach') {
  setGlobalRole('coach', false);
  showView('coach');
} else {
  setGlobalRole('leader', false);
  showView(['home', 'labs', 'lesson', 'workspace', 'coach'].includes(initial) ? initial : 'labs');
}

// Tự động mở Tour Onboarding lần đầu tiên để chào đón người dùng
if (!sessionStorage.getItem('vlearn_labspace_tour_seen')) {
  setTimeout(() => {
    openTour();
    sessionStorage.setItem('vlearn_labspace_tour_seen', '1');
  }, 500);
}

// Web MCP Tools
function registerWebMcpTools() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const register = tool => Promise.resolve(context.registerTool(tool)).catch(() => undefined);
  register({
    name: 'start_labspace_group_setup',
    title: 'Bắt đầu lập nhóm LabSpace',
    description: 'Mở bài Mini Hackathon và flow tạo hoặc tham gia một nhóm LabSpace.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      setGlobalRole('leader', false);
      showView('lesson');
      setDialogStep(1);
      dialog.showModal();
      return { status: 'group_setup_open', lab: 'K4-L3B-DAY05-06-MINI-HACKATHON' };
    }
  });
  register({
    name: 'read_labspace_progress',
    title: 'Đọc tiến độ nhóm LabSpace',
    description: 'Đọc số task đã hoàn thành và trạng thái phê duyệt phân công của Sloppers.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute() {
      const completed = tasks.filter(task => task.querySelector('input').checked).length;
      return { group: 'Sloppers', currentRole, planApproved, completed, total: tasks.length, percent: Math.round((completed / tasks.length) * 100) };
    }
  });
  register({
    name: 'set_labspace_task_completion',
    title: 'Cập nhật trạng thái task LabSpace',
    description: 'Đánh dấu task hoàn thành sau khi kế hoạch đã được nhóm trưởng phê duyệt.',
    inputSchema: { type: 'object', properties: { taskIndex: { type: 'integer', minimum: 0, maximum: 4 }, completed: { type: 'boolean' } }, required: ['taskIndex', 'completed'], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!planApproved) throw new Error('Nhóm trưởng cần phê duyệt phân công trước');
      if (!input || !Number.isInteger(input.taskIndex) || input.taskIndex < 0 || input.taskIndex >= tasks.length || typeof input.completed !== 'boolean') throw new Error('taskIndex hoặc completed không hợp lệ');
      const task = tasks[input.taskIndex];
      task.querySelector('input').checked = input.completed;
      task.classList.toggle('done', input.completed);
      updateProgress();
      showView('workspace');
      return { taskIndex: input.taskIndex, completed: input.completed };
    }
  });
}

registerWebMcpTools();
initStudentIdBlockHandlers();
renderStudentSlots();
