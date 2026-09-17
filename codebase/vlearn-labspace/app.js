const views = [...document.querySelectorAll('.view')];
const navButtons = [...document.querySelectorAll('[data-view-link]')];
const dialog = document.getElementById('setupDialog');
const memberDialog = document.getElementById('memberDialog');
const assignmentDialog = document.getElementById('assignmentDialog');
const toast = document.getElementById('toast');
const tasks = [...document.querySelectorAll('[data-task]')];
let toastTimer;
let planApproved = false;

const ownerMeta = {
  Lan: { initial: 'L', className: 'blue-bg', skill: 'Product · Research' },
  Minh: { initial: 'M', className: 'teal-bg', skill: 'Frontend · UI/UX' },
  An: { initial: 'A', className: 'purple-bg', skill: 'AI · Prompt' },
  Bình: { initial: 'B', className: 'orange-bg', skill: 'Backend · Data' },
  'Cả nhóm': { initial: '•', className: 'blue-bg', skill: 'Cùng thực hiện' }
};

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2600);
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

function setWorkspaceRole(role) {
  const isLeader = role === 'leader';
  document.getElementById('workspaceRoleTag').textContent = isLeader ? 'VIEW NHÓM TRƯỞNG · LAN' : 'VIEW THÀNH VIÊN · MINH';
  document.getElementById('startAssignment').hidden = !isLeader;
  document.getElementById('startAssignmentBoard').hidden = !isLeader;
  if (!planApproved) document.getElementById('planStatus').textContent = isLeader
    ? 'Chờ nhóm trưởng tạo bản nháp phân công. Checklist vẫn lấy từ bài LAB chính thức.'
    : 'Bạn đã vào nhóm. Đang chờ nhóm trưởng kiểm tra và phê duyệt kế hoạch.';
}

function closeOnBackdrop(targetDialog, event) {
  const rect = targetDialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) targetDialog.close();
}

navButtons.forEach(button => button.addEventListener('click', event => {
  event.preventDefault();
  showView(button.dataset.viewLink);
}));

document.getElementById('openSetup').addEventListener('click', () => {
  setWorkspaceRole('leader');
  setDialogStep(1);
  dialog.showModal();
});
document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => closeOnBackdrop(dialog, event));

document.getElementById('createGroup').addEventListener('click', () => {
  dialog.close();
  setWorkspaceRole('leader');
  showView('workspace');
  showToast('Đã tạo Sloppers và gửi 3 lời mời. Học viên xác nhận trong Thông báo của họ.');
});
document.querySelectorAll('.skill-chips button').forEach(button => button.addEventListener('click', () => button.classList.toggle('selected')));
document.querySelectorAll('.proficiency input[type="range"]').forEach(input => input.addEventListener('input', () => {
  input.previousElementSibling.textContent = input.value;
}));

const notificationPanel = document.getElementById('notificationPanel');
function openNotifications() {
  notificationPanel.hidden = false;
}
function closeNotifications() {
  notificationPanel.hidden = true;
}
document.getElementById('openMemberView').addEventListener('click', openNotifications);
document.getElementById('notificationsButton').addEventListener('click', openNotifications);
document.getElementById('closeNotifications').addEventListener('click', closeNotifications);
document.getElementById('declineNotification').addEventListener('click', () => {
  closeNotifications();
  showToast('Lời mời vẫn chưa được xác nhận.');
});
document.getElementById('acceptNotification').addEventListener('click', () => {
  closeNotifications();
  setMemberStep(1);
  memberDialog.showModal();
});
document.getElementById('closeMemberDialog').addEventListener('click', () => memberDialog.close());
memberDialog.addEventListener('click', event => closeOnBackdrop(memberDialog, event));
document.getElementById('submitMemberProfile').addEventListener('click', () => {
  memberDialog.close();
  setWorkspaceRole('member');
  document.getElementById('memberCount').textContent = '2/4 xác nhận';
  document.getElementById('minhMemberStatus').textContent = 'Đã xác nhận · Hồ sơ đã lưu';
  showView('workspace');
  showToast('Đã vào nhóm Sloppers. Lan sẽ thấy cập nhật thành viên trong LabSpace.');
});

function openAssignment() {
  assignmentDialog.showModal();
}
document.getElementById('startAssignment').addEventListener('click', openAssignment);
document.getElementById('startAssignmentBoard').addEventListener('click', openAssignment);
document.getElementById('closeAssignment').addEventListener('click', () => assignmentDialog.close());
assignmentDialog.addEventListener('click', event => closeOnBackdrop(assignmentDialog, event));
document.getElementById('regeneratePlan').addEventListener('click', event => {
  const button = event.currentTarget;
  button.disabled = true;
  button.textContent = '↻ Đang tạo lại...';
  setTimeout(() => {
    button.disabled = false;
    button.textContent = '↻ Tạo lại bản nháp';
    showToast('AI đã tạo lại bản nháp để nhóm tiếp tục kiểm tra');
  }, 650);
});
document.getElementById('approvePlan').addEventListener('click', () => {
  document.querySelectorAll('.assignment-list select').forEach((select, index) => {
    const owner = select.value;
    const meta = ownerMeta[owner];
    const target = tasks[index].querySelector('.task-owner');
    target.classList.remove('unassigned');
    target.innerHTML = `<span class="member-avatar ${meta.className}">${meta.initial}</span><div><b>${owner}</b><small>${meta.skill}</small></div>`;
  });
  planApproved = true;
  assignmentDialog.close();
  document.getElementById('planStatus').textContent = 'Đã phê duyệt. Từng thành viên tick task khi hoàn thành; tiến độ cập nhật cho cả nhóm.';
  const planButton = document.getElementById('startAssignmentBoard');
  planButton.textContent = '✓ Đã phê duyệt';
  planButton.disabled = true;
  const teamButton = document.getElementById('startAssignment');
  teamButton.textContent = '✓ Phân công đã duyệt';
  teamButton.disabled = true;
  document.querySelector('.ready-score h2').textContent = 'Bắt đầu thực hiện kế hoạch';
  document.getElementById('remainingText').textContent = 'Còn 5 mục cần hoàn thành';
  showToast('Đã phê duyệt phân công. Kế hoạch đã mở cho cả nhóm.');
});

function copyText(text, message) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => undefined);
  showToast(message);
}
document.getElementById('copyCode').addEventListener('click', () => copyText('SLOP-3B', 'Đã sao chép mã nhóm SLOP-3B'));

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
  if (!planApproved) {
    event.target.checked = false;
    showToast('Nhóm trưởng cần phê duyệt phân công trước khi cập nhật tiến độ.');
    return;
  }
  task.classList.toggle('done', event.target.checked);
  updateProgress();
  showToast(event.target.checked ? 'Đã đánh dấu task hoàn thành' : 'Đã mở lại task');
}));
document.getElementById('requestCoach').addEventListener('click', () => showToast('Yêu cầu hỗ trợ đã được gửi cho Lab Coach'));

const initial = location.hash.replace('#', '');
showView(['home', 'labs', 'lesson', 'workspace', 'coach'].includes(initial) ? initial : 'labs');

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
      return { group: 'Sloppers', planApproved, completed, total: tasks.length, percent: Math.round((completed / tasks.length) * 100) };
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
