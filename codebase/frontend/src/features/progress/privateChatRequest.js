export function buildPrivateChatRequest({ question, user, snapshot, taskId, labId: explicitLabId, attachment }) {
  const groupId = snapshot?.group?.id || snapshot?.groupId || '';
  const userId = user?.shortName || user?.name || user?.accountId || '';

  let rawLabId =
    explicitLabId ||
    snapshot?.labId ||
    snapshot?.lab_id ||
    snapshot?.group?.labId ||
    snapshot?.group?.lab_id;

  if (!rawLabId && snapshot?.checklistSource) {
    const sourcePart = snapshot.checklistSource.split('·')[0].trim();
    if (sourcePart && !sourcePart.toLowerCase().includes('chưa')) {
      rawLabId = sourcePart;
    }
  }

  const finalLabId = (rawLabId || 'K4-L3B-DAY05-06-MINI-HACKATHON')
    .replace(/\u2013/g, '-')
    .replace(/\u2014/g, '-')
    .trim();

  const msgText = question?.trim() || (attachment?.name ? `[Đính kèm: ${attachment.name}]` : 'Chào AI');

  return {
    message: msgText,
    user_id: userId,
    group_id: groupId,
    thread_id: `${groupId}:${user?.accountId || userId}`,
    lab_id: finalLabId,
    task_id: taskId || undefined,
    attachment_name: attachment?.name,
    attachment_type: attachment?.type,
    attachment_url: attachment?.dataUrl,
    tasks: (snapshot?.tasks || []).map((task) => ({
      ...task,
      group_id: task.group_id || groupId,
      owner_id: task.owner_id || task.owner || '',
    })),
  };
}
