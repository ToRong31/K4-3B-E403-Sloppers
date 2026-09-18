const normalize = (value) => String(value ?? '').trim().toLocaleLowerCase('vi-VN');

function isMine(task, user) {
  return task.owner === user.shortName;
}

function taskReference(task) {
  return task.reference_ids ?? [];
}

export function createGroupChatDemoMessages({ members, tasks, user }) {
  const leader = members.find((member) => member.role === 'Nhóm trưởng') ?? members[0];
  const currentMember = members.find((member) => member.studentCode === user.accountId);
  const previewMember = leader?.studentCode === user.accountId
    ? members.find((member) => member.studentCode !== user.accountId) ?? leader
    : leader;
  const myTasks = tasks.filter((task) => task.owner === user.shortName);
  const myTaskSummary = myTasks.length
    ? myTasks.map((task) => task.title).join(', ')
    : 'chưa có task được giao';

  return [
    {
      id: 'group-demo-leader',
      author: previewMember?.name ?? 'Thành viên',
      initial: previewMember?.name?.[0] ?? 'N',
      role: previewMember?.role ?? 'Thành viên',
      isLeader: previewMember?.role === 'Nhóm trưởng',
      mine: false,
      time: 'Vừa xong',
      text: previewMember?.role === 'Nhóm trưởng'
        ? 'Mọi người kiểm tra lại task và tiêu chí hoàn thành trước khi bắt đầu nhé.'
        : 'Mình đã kiểm tra task và tiêu chí hoàn thành được giao rồi nhé.',
    },
    {
      id: 'group-demo-current-user',
      author: currentMember?.name ?? user.shortName,
      initial: currentMember?.name?.[0] ?? user.shortName?.[0] ?? 'B',
      role: currentMember?.role ?? user.roleLabel,
      isLeader: currentMember?.role === 'Nhóm trưởng',
      mine: true,
      time: 'Vừa xong',
      text: `Mình đã nhận phần: ${myTaskSummary}.`,
    },
  ];
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
