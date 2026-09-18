const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase('vi-VN');

function isMine(task, user) {
  return task.owner === user.shortName;
}

function taskReference(task) {
  return task.reference_ids ?? [];
}

function explainTask(task) {
  if (!task) {
    return {
      status: 'clarify',
      answer: 'Mình chỉ có thể giải thích task được giao cho bạn trong nhóm hiện tại.',
      task_ids: [],
      reference_ids: [],
      suggested_next_action: 'Chọn một task của bạn trong LabSpace.',
    };
  }

  const criteria = task.completion_criteria?.join('; ') ?? 'chưa có trong dữ liệu demo';
  const dependencies = task.depends_on?.join(', ') || 'không có';
  return {
    status: 'ready',
    answer: `${task.title}: đầu ra cần có là ${task.deliverable}. Hoàn thành khi: ${criteria}. Phụ thuộc: ${dependencies}.`,
    task_ids: [task.id],
    reference_ids: taskReference(task),
    suggested_next_action: 'Làm theo tiêu chí hoàn thành rồi cập nhật tiến độ task.',
  };
}

export function createProgressChatDemoReply({ question, taskId, tasks, user }) {
  const normalizedQuestion = normalize(question);
  const myTasks = tasks.filter((task) => isMine(task, user));

  if (normalizedQuestion.includes('tiến độ') || normalizedQuestion.includes('nhóm còn')) {
    const done = tasks.filter((task) => task.status === 'done').length;
    const blocked = tasks.filter((task) => task.status === 'blocked').length;
    const remaining = tasks.length - done;
    return {
      status: 'ready',
      answer: `Nhóm đã xong ${done}/${tasks.length} việc, còn ${remaining} việc.${blocked ? ` Có ${blocked} việc đang bị chặn.` : ''}`,
      task_ids: [],
      reference_ids: [],
      suggested_next_action: 'Mở task board để xem owner và trạng thái mới nhất.',
    };
  }

  if (normalizedQuestion.includes('tôi cần làm gì') || normalizedQuestion.includes('việc của tôi')) {
    if (!myTasks.length) {
      return {
        status: 'ready',
        answer: 'Hiện bạn chưa có task nào được giao trong nhóm này.',
        task_ids: [],
        reference_ids: [],
        suggested_next_action: 'Chờ nhóm trưởng phê duyệt kế hoạch hoặc kiểm tra lại phân công.',
      };
    }
    return {
      status: 'ready',
      answer: `Việc của bạn: ${myTasks.map((task) => `${task.title} (${task.status})`).join(' · ')}.`,
      task_ids: myTasks.map((task) => task.id),
      reference_ids: [],
      suggested_next_action: 'Chọn một task để xem deliverable và tiêu chí hoàn thành.',
    };
  }

  return explainTask(myTasks.find((task) => task.id === taskId));
}
