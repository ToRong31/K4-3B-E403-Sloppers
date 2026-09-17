const views = [...document.querySelectorAll('.view')];
const navButtons = [...document.querySelectorAll('[data-view-link]')];
const dialog = document.getElementById('setupDialog');
const toast = document.getElementById('toast');
let toastTimer;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function showView(name) {
  views.forEach(view => view.classList.toggle('active', view.id === `view-${name}`));
  document.querySelectorAll('.main-nav [data-view-link]').forEach(button => {
    button.classList.toggle('active', button.dataset.viewLink === name || (name === 'lesson' && button.dataset.viewLink === 'labs'));
  });
  history.replaceState(null, '', `#${name}`);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navButtons.forEach(button => button.addEventListener('click', event => {
  event.preventDefault();
  showView(button.dataset.viewLink);
}));

function setDialogStep(step) {
  document.querySelectorAll('.dialog-step').forEach(section => section.classList.toggle('active', Number(section.dataset.step) === step));
  document.querySelectorAll('.stepper span').forEach((item, index) => item.classList.toggle('active', index < step));
}

document.getElementById('openSetup').addEventListener('click', () => {
  setDialogStep(1);
  dialog.showModal();
});
document.getElementById('closeDialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
document.querySelectorAll('.next-step').forEach(button => button.addEventListener('click', () => setDialogStep(2)));
document.querySelectorAll('.prev-step').forEach(button => button.addEventListener('click', () => {
  const active = document.querySelector('.dialog-step.active');
  setDialogStep(Math.max(1, Number(active.dataset.step) - 1));
}));
document.querySelectorAll('.skill-chips button').forEach(button => button.addEventListener('click', () => button.classList.toggle('selected')));
document.getElementById('generatePlan').addEventListener('click', event => {
  const button = event.currentTarget;
  const previous = button.textContent;
  button.disabled = true;
  button.textContent = '✦ Đang phân tích checklist...';
  setTimeout(() => {
    button.disabled = false;
    button.textContent = previous;
    setDialogStep(3);
  }, 700);
});
document.getElementById('confirmPlan').addEventListener('click', () => {
  dialog.close();
  showView('workspace');
  showToast('Đã tạo LabSpace cho nhóm Sloppers');
});
document.getElementById('editPlan').addEventListener('click', () => {
  setDialogStep(3);
  dialog.showModal();
});

function copyText(text, message) {
  if (navigator.clipboard) navigator.clipboard.writeText(text).catch(() => undefined);
  showToast(message);
}
document.getElementById('copyCode').addEventListener('click', () => copyText('SLOP-3B', 'Đã sao chép mã nhóm SLOP-3B'));
document.getElementById('copyInvite').addEventListener('click', () => copyText('SLOP-3B', 'Đã sao chép mã mời'));

const tasks = [...document.querySelectorAll('[data-task]')];
function updateProgress() {
  const complete = tasks.filter(task => task.querySelector('input').checked).length;
  const percent = Math.round((complete / tasks.length) * 100);
  document.getElementById('progressPill').textContent = `${percent}% hoàn thành`;
  document.getElementById('progressBar').style.width = `${percent}%`;
  document.getElementById('readyPercent').textContent = `${percent}%`;
  document.querySelector('.ring').style.background = `conic-gradient(var(--blue) ${percent}%, #e6e8eb 0)`;
  document.getElementById('remainingText').textContent = percent === 100 ? 'Tất cả deliverable đã hoàn thành' : `Còn ${tasks.length - complete} mục cần hoàn thành`;
  document.querySelector('.ready-score h2').textContent = percent === 100 ? 'Sẵn sàng kiểm tra để nộp' : 'Chưa sẵn sàng nộp';
  document.querySelectorAll('.deliverable-list input').forEach((input, index) => { input.checked = tasks[index].querySelector('input').checked; });
}
tasks.forEach(task => task.querySelector('input').addEventListener('change', event => {
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
    title: 'Bắt đầu tạo nhóm LabSpace',
    description: 'Mở bài Mini Hackathon và bắt đầu flow tạo workspace nhóm LabSpace.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute() {
      showView('lesson');
      setDialogStep(1);
      dialog.showModal();
      return { status: 'setup_open', lab: 'K4-L3B-DAY05-06-MINI-HACKATHON' };
    }
  });

  register({
    name: 'read_labspace_progress',
    title: 'Đọc tiến độ nhóm LabSpace',
    description: 'Đọc số task đã hoàn thành và các task còn lại của nhóm Sloppers.',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    annotations: { readOnlyHint: true, untrustedContentHint: false },
    execute() {
      const completed = tasks.filter(task => task.querySelector('input').checked).length;
      return { group: 'Sloppers', completed, total: tasks.length, percent: Math.round((completed / tasks.length) * 100) };
    }
  });

  register({
    name: 'set_labspace_task_completion',
    title: 'Cập nhật trạng thái task LabSpace',
    description: 'Đánh dấu một task trong board LabSpace hoàn thành hoặc mở lại. taskIndex bắt đầu từ 0.',
    inputSchema: {
      type: 'object',
      properties: {
        taskIndex: { type: 'integer', minimum: 0, maximum: 4 },
        completed: { type: 'boolean' }
      },
      required: ['taskIndex', 'completed'],
      additionalProperties: false
    },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || !Number.isInteger(input.taskIndex) || input.taskIndex < 0 || input.taskIndex >= tasks.length || typeof input.completed !== 'boolean') {
        throw new Error('taskIndex hoặc completed không hợp lệ');
      }
      const task = tasks[input.taskIndex];
      const checkbox = task.querySelector('input');
      checkbox.checked = input.completed;
      task.classList.toggle('done', input.completed);
      updateProgress();
      showView('workspace');
      const completed = tasks.filter(item => item.querySelector('input').checked).length;
      return { taskIndex: input.taskIndex, completed: input.completed, groupProgress: `${completed}/${tasks.length}` };
    }
  });
}

registerWebMcpTools();

