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
  Lan: { initial: 'L', className: 'blue-bg', skill: 'Product · Research' },
  Minh: { initial: 'M', className: 'teal-bg', skill: 'Frontend · UI/UX' },
  An: { initial: 'A', className: 'purple-bg', skill: 'AI · Prompt' },
  Bình: { initial: 'B', className: 'orange-bg', skill: 'Backend · Data' },
  'Cả nhóm': { initial: '•', className: 'blue-bg', skill: 'Cùng thực hiện' }
};

const initialAiProposals = {
  0: { name: 'Lan', desc: 'Product & Research · Match 95%' },
  1: { name: 'Lan', desc: 'Product Lead · Match 98%' },
  2: { name: 'Minh', desc: 'Frontend 4★, UI/UX 4★ · Match 96%' },
  3: { name: 'An', desc: 'Prompt Eng 3★, AI · Match 93%' },
  4: { name: 'Bình', desc: 'Backend 4★, Data · Match 92%' }
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
    sender: 'Lan',
    role: 'leader',
    roleName: '👑 Nhóm trưởng',
    avatarChar: 'L',
    avatarClass: 'leader',
    time: '20:30',
    text: 'Chào cả nhóm Sloppers! Lan vừa tạo xong workspace cho bài Mini Hackathon AI. Mọi người kiểm tra kết nối nhé.',
    attachment: null
  },
  {
    id: 2,
    sender: 'Minh',
    role: 'member',
    roleName: 'UI / Frontend',
    avatarChar: 'M',
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
    sender: 'An',
    role: 'member',
    roleName: 'AI / Prompt Eng',
    avatarChar: 'A',
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
    sender: 'Lan',
    role: 'leader',
    roleName: '👑 Nhóm trưởng',
    avatarChar: 'L',
    avatarClass: 'leader',
    time: '20:38',
    text: 'Cảm ơn Minh và An nhé! Giờ mình sẽ dùng tính năng "Phân chia task AI" để thuật toán phân bổ nhiệm vụ theo ma trận kỹ năng chuẩn nhất cho 4 bạn.',
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
  showToast('Đã thu gọn sidebar chat. Bấm tab mép phải để mở lại.');
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

    const isMine = (currentRole === 'leader' && msg.sender === 'Lan') ||
                   (currentRole === 'member' && msg.sender === 'Minh') ||
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

window.handlePreviewDocument = function(docName) {
  showToast(`📂 Đang mở tài liệu: ${docName}`);
};

/* --- GROUP CHAT SEND & AI MENTION IN GROUP --- */
function sendChatMessage(text, attachment) {
  if (!text && !attachment) return;

  let sender = 'Lan';
  let role = 'leader';
  let roleName = '👑 Nhóm trưởng';
  let avatarChar = 'L';
  let avatarClass = 'leader';

  if (currentRole === 'member') {
    sender = 'Minh';
    role = 'member';
    roleName = 'UI / Frontend';
    avatarChar = 'M';
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
      <li>1. <b>Nhóm trưởng phê duyệt phân công:</b> Lan bấm nút <code>✦ Phân chia task</code> để AI khớp thế mạnh 4 thành viên và duyệt bảng nháp.</li>
      <li>2. <b>Triển khai Checkpoint 2:</b> Minh (Frontend/UI) bắt tay dựng Wireframe & Flow trên Figma theo Canvas đã chốt.</li>
      <li>3. <b>Triển khai Checkpoint 3:</b> An (AI Lead) nạp bộ 20 prompt test vào file <code>Golden_Set_Benchmark_CP3.csv</code>.</li>
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
      <li><b>Nhóm trưởng Lan có toàn quyền ghi đè (Override):</b> Đổi bất kỳ ai phụ trách nếu nhóm thấy phù hợp hơn.</li>
      <li>Nếu cần trợ giúp thêm từ Giảng viên, bạn có thể bấm nút <b>'Yêu cầu hỗ trợ Lab Coach'</b> trên Workspace!</li>
    </ul>`;
  }

  return `Cảm ơn câu hỏi của bạn! Với nội dung bài <b>Mini Hackathon AI</b>, mình khuyến nghị nhóm:
  <ul>
    <li>Bám sát <b>Checklist chính thức</b> ở góc phải Workspace.</li>
    <li>Phân chia công việc theo thế mạnh: Lan (Product), Minh (Frontend), An (AI), Bình (Backend).</li>
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
      '<b>CP2 (Wireframe & Flow):</b> Minh đã gửi bản mockup <code>Flow_Mockup_CP2_Figma.png</code> (2.4 MB) để cả nhóm tham khảo.',
      '<b>CP3 (Prompt & Benchmark):</b> An đã chuẩn bị sẵn bộ kiểm thử <code>Golden_Set_Benchmark_CP3.csv</code> (680 KB).',
      '<b>Bước tiếp theo:</b> Nhóm trưởng Lan kích hoạt tính năng <b>Phân chia task AI</b> để thuật toán tính toán ma trận kỹ năng.'
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
      addAiLog('👥', '[Profiles] Đọc điểm tự đánh giá: Lan (Product Lead), Minh (Frontend 4★, UI 4★), An (AI 3★), Bình (Backend 4★)...', 'active');
    }, 400));

    aiAnalysisTimers.push(setTimeout(() => {
      markLastLogDone();
      if (barFill) barFill.style.width = '70%';
      if (barPercent) barPercent.textContent = '70%';
      if (barStatus) barStatus.textContent = 'Đang tính toán Match Rate & tối ưu hóa...';
      addAiLog('🧠', '[Matching] Tính toán độ tương thích thế mạnh: Lan 98% · Minh 96% · An 93% · Bình 92%...', 'active');
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
      addAiLog('✨', '[Complete] Đã sinh bản nháp tối ưu! Bàn giao quyền kiểm duyệt cho Nhóm trưởng Lan.', 'done');
    }, 1650));

    aiAnalysisTimers.push(setTimeout(() => {
      finishAiAnalysis(false);
    }, 1950));
  }
}

function openAssignment() {
  if (currentRole !== 'leader') {
    showToast('Chỉ Nhóm trưởng (Lan) mới có quyền tạo bản nháp và phân task AI.');
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

  // 1. Cập nhật Dock cố định ở chân màn hình
  document.querySelectorAll('.dock-role-item').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.role === role);
  });

  const dockFootnote = document.getElementById('dockFootnote');
  if (dockFootnote) {
    if (role === 'leader') {
      dockFootnote.innerHTML = 'Đang ở góc nhìn: <b>👑 Nhóm trưởng (Lan)</b> — Toàn quyền tạo nhóm, phân chia task AI và duyệt kế hoạch.';
    } else if (role === 'member') {
      dockFootnote.innerHTML = 'Đang ở góc nhìn: <b>👤 Học viên được mời (Minh)</b> — Nhận thông báo mời vào nhóm Sloppers & onboarding kỹ năng.';
    } else if (role === 'coach') {
      dockFootnote.innerHTML = 'Đang ở góc nhìn: <b>👨‍🏫 Lab Coach (E403)</b> — Giám sát tiến độ 12 nhóm, can thiệp khi có task blocked.';
    }
  }

  // 2. Cập nhật Header: Role Chip, Avatar, Thông báo
  const roleChipIcon = document.getElementById('roleChipIcon');
  const roleChipText = document.getElementById('roleChipText');
  const headerAvatar = document.getElementById('headerAvatar');
  const notifBadge = document.getElementById('notifBadge');

  if (role === 'leader') {
    if (roleChipIcon) roleChipIcon.textContent = '👑';
    if (roleChipText) roleChipText.textContent = 'Lan · Nhóm trưởng';
    if (headerAvatar) {
      headerAvatar.textContent = 'L';
      headerAvatar.style.background = 'var(--blue)';
      headerAvatar.title = 'Tài khoản: Lan (Nhóm trưởng)';
    }
    if (notifBadge) notifBadge.style.display = 'none';
  } else if (role === 'member') {
    if (roleChipIcon) roleChipIcon.textContent = '👤';
    if (roleChipText) roleChipText.textContent = 'Minh · Thành viên';
    if (headerAvatar) {
      headerAvatar.textContent = 'M';
      headerAvatar.style.background = '#098b8e';
      headerAvatar.title = 'Tài khoản: Minh (Thành viên)';
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
  const workspaceRoleAlert = document.getElementById('workspaceRoleAlert');
  const wsAlertIcon = document.getElementById('wsAlertIcon');
  const wsAlertContent = document.getElementById('wsAlertContent');
  const wsAlertActionBtn = document.getElementById('wsAlertActionBtn');
  const startAssignment = document.getElementById('startAssignment');
  const startAssignmentBoard = document.getElementById('startAssignmentBoard');
  const memberRoleLock = document.getElementById('memberRoleLock');
  const tagLan = document.getElementById('tagLan');
  const tagMinh = document.getElementById('tagMinh');
  const requestCoach = document.getElementById('requestCoach');

  if (role === 'leader') {
    if (workspaceRoleTag) workspaceRoleTag.textContent = 'VIEW NHÓM TRƯỞNG · LAN';
    if (workspaceRoleDesc) workspaceRoleDesc.textContent = 'Mini Hackathon AI · Toàn quyền quản lý & phân task';
    if (workspaceRoleAlert) {
      workspaceRoleAlert.className = 'workspace-role-alert leader';
      if (wsAlertIcon) wsAlertIcon.textContent = '👑';
      if (wsAlertContent) wsAlertContent.innerHTML = '<b>Góc nhìn Nhóm trưởng (Lan):</b> Bạn có toàn quyền quản lý nhóm Sloppers, gửi lời mời thành viên, tạo bản nháp phân công AI và phê duyệt kế hoạch.';
      if (wsAlertActionBtn) {
        wsAlertActionBtn.style.display = 'inline-block';
        wsAlertActionBtn.textContent = '✦ Phân chia task AI';
        wsAlertActionBtn.onclick = openAssignment;
      }
    }
    if (startAssignment) startAssignment.hidden = false;
    if (startAssignmentBoard) startAssignmentBoard.hidden = false;
    if (memberRoleLock) memberRoleLock.style.display = 'none';
    if (tagLan) { tagLan.style.display = 'inline-block'; tagLan.textContent = '(Bạn - Trưởng nhóm)'; }
    if (tagMinh) { tagMinh.style.display = 'none'; }
    if (requestCoach) requestCoach.textContent = '☝ Yêu cầu Coach hỗ trợ';

    if (!planApproved) {
      document.getElementById('planStatus').textContent = 'Chờ nhóm trưởng tạo bản nháp phân công. Checklist vẫn lấy từ bài LAB chính thức.';
    }
  } else if (role === 'member') {
    if (workspaceRoleTag) workspaceRoleTag.textContent = 'VIEW THÀNH VIÊN · MINH';
    if (workspaceRoleDesc) workspaceRoleDesc.textContent = 'Mini Hackathon AI · Đã tham gia nhóm Sloppers';
    if (workspaceRoleAlert) {
      workspaceRoleAlert.className = 'workspace-role-alert member';
      if (wsAlertIcon) wsAlertIcon.textContent = '👤';
      if (wsAlertContent) {
        if (!minhProfileSubmitted) {
          wsAlertContent.innerHTML = '<b>Góc nhìn Học viên (Minh):</b> Bạn nhận được lời mời tham gia nhóm Sloppers từ Lan. Hãy hoàn thành hồ sơ năng lực để AI phân công đúng chuyên môn.';
        } else {
          wsAlertContent.innerHTML = '<b>Góc nhìn Học viên (Minh):</b> Bạn đã tham gia nhóm Sloppers (chuyên môn Frontend & UI/UX). Đang đợi nhóm trưởng Lan phê duyệt phân công task.';
        }
      }
      if (wsAlertActionBtn) {
        if (!minhProfileSubmitted) {
          wsAlertActionBtn.style.display = 'inline-block';
          wsAlertActionBtn.textContent = '📩 Xem lời mời & Onboarding';
          wsAlertActionBtn.onclick = openNotifications;
        } else {
          wsAlertActionBtn.style.display = 'none';
        }
      }
    }
    if (startAssignment) startAssignment.hidden = true;
    if (startAssignmentBoard) startAssignmentBoard.hidden = true;
    if (memberRoleLock) memberRoleLock.style.display = 'block';
    if (tagLan) { tagLan.style.display = 'inline-block'; tagLan.textContent = '(Trưởng nhóm)'; }
    if (tagMinh) { tagMinh.style.display = 'inline-block'; tagMinh.textContent = '(Bạn)'; }
    if (requestCoach) requestCoach.textContent = '☝ Yêu cầu Coach hỗ trợ';

    if (!planApproved) {
      document.getElementById('planStatus').textContent = 'Bạn đã vào nhóm. Đang chờ nhóm trưởng kiểm tra và phê duyệt kế hoạch.';
    }
  } else if (role === 'coach') {
    if (workspaceRoleTag) workspaceRoleTag.textContent = 'VIEW LAB COACH · GIÁM SÁT';
    if (workspaceRoleDesc) workspaceRoleDesc.textContent = 'Chế độ xem của Giảng viên / Mentor (Read-only)';
    if (workspaceRoleAlert) {
      workspaceRoleAlert.className = 'workspace-role-alert coach';
      if (wsAlertIcon) wsAlertIcon.textContent = '👨‍🏫';
      if (wsAlertContent) wsAlertContent.innerHTML = '<b>Góc nhìn Lab Coach:</b> Bạn đang quan sát nhóm Sloppers ở chế độ Giám sát. Bạn có thể theo dõi tiến độ hoàn thành deliverable và hỗ trợ khi nhóm bị blocked.';
      if (wsAlertActionBtn) {
        wsAlertActionBtn.style.display = 'inline-block';
        wsAlertActionBtn.textContent = '📊 Xem toàn bộ 12 nhóm';
        wsAlertActionBtn.onclick = () => showView('coach');
      }
    }
    if (startAssignment) startAssignment.hidden = true;
    if (startAssignmentBoard) startAssignmentBoard.hidden = true;
    if (memberRoleLock) memberRoleLock.style.display = 'none';
    if (tagLan) { tagLan.style.display = 'inline-block'; tagLan.textContent = '(Trưởng nhóm)'; }
    if (tagMinh) { tagMinh.style.display = 'none'; }
    if (requestCoach) requestCoach.textContent = '✓ Gửi phản hồi / Hỗ trợ nhóm này';
  }

  // 4. Cập nhật Banner bài học (Lesson View)
  const lessonBannerTitle = document.getElementById('lessonBannerTitle');
  const lessonBannerDesc = document.getElementById('lessonBannerDesc');
  const lessonBannerActions = document.getElementById('lessonBannerActions');
  if (lessonBannerTitle && lessonBannerDesc && lessonBannerActions) {
    if (role === 'leader') {
      lessonBannerTitle.textContent = 'Lập nhóm trước, phân công khi cả nhóm đã sẵn sàng';
      lessonBannerDesc.textContent = 'Đang ở góc nhìn Nhóm trưởng (Lan): Tạo nhóm, gửi lời mời thành viên và phê duyệt bản nháp phân công AI.';
      lessonBannerActions.innerHTML = '<button class="primary-button" id="openSetup" type="button">＋ Tạo nhóm Lab</button>';
      document.getElementById('openSetup').addEventListener('click', () => {
        setDialogStep(1);
        dialog.showModal();
      });
    } else if (role === 'member') {
      lessonBannerTitle.textContent = 'Lời mời tham gia nhóm Sloppers · Mini Hackathon AI';
      lessonBannerDesc.textContent = 'Đang ở góc nhìn Học viên (Minh): Lan đã gửi cho bạn lời mời tham gia nhóm. Hãy xác nhận và khai báo kỹ năng phiên LAB.';
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
      chatSenderRoleName.innerHTML = '👑 Lan (Nhóm trưởng)';
    } else if (role === 'member') {
      chatSenderRoleName.innerHTML = '👤 Minh (Thành viên - UI/Frontend)';
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
      showToast('Đã chuyển sang góc nhìn: Lab Coach (Giảng viên E403)');
    } else if (role === 'member') {
      showView('workspace');
      showToast('Đã chuyển sang góc nhìn: Học viên được mời (Minh)');
    } else if (role === 'leader') {
      const activeView = views.find(v => v.classList.contains('active'));
      if (activeView && activeView.id === 'view-coach') {
        showView('workspace');
      }
      showToast('Đã chuyển sang góc nhìn: Nhóm trưởng (Lan)');
    }
  }
}

// Bắt sự kiện Click cho Dock cố định
document.getElementById('dockBtnLeader')?.addEventListener('click', () => setGlobalRole('leader'));
document.getElementById('dockBtnMember')?.addEventListener('click', () => setGlobalRole('member'));
document.getElementById('dockBtnCoach')?.addEventListener('click', () => setGlobalRole('coach'));

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

// Setup dialog
document.getElementById('openSetup')?.addEventListener('click', () => {
  setGlobalRole('leader', false);
  setDialogStep(1);
  dialog.showModal();
});
document.getElementById('closeDialog')?.addEventListener('click', () => dialog.close());
dialog?.addEventListener('click', event => closeOnBackdrop(dialog, event));

document.getElementById('createGroup')?.addEventListener('click', () => {
  dialog.close();
  setGlobalRole('leader', false);
  showView('workspace');
  showToast('Đã tạo Sloppers và gửi 3 lời mời. Học viên xác nhận trong Thông báo của họ.');
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
  const notifBadge = document.getElementById('notifBadge');
  if (notifBadge) notifBadge.style.display = 'none';
  setGlobalRole('member', false);
  showView('workspace');
  showToast('Đã lưu hồ sơ phiên Lab của Minh! Lan sẽ thấy cập nhật thành viên trong LabSpace.');
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

document.getElementById('requestCoach')?.addEventListener('click', () => {
  if (currentRole === 'coach') {
    showToast('Lab Coach đã ghi nhận và gửi hỗ trợ cho nhóm Sloppers.');
  } else {
    showToast('Yêu cầu hỗ trợ đã được gửi cho Lab Coach');
  }
});

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
