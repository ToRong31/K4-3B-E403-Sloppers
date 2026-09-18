const DEFAULT_GROUP_ID = 'Nhom-03';
const DEFAULT_LAB_ID = 'K4-L3B-DAY05-06-MINI-HACKATHON';

export function buildPrivateChatRequest({ question, user, snapshot, taskId }) {
  const groupId = snapshot.group?.id || DEFAULT_GROUP_ID;
  const userId = user.shortName || user.name || user.accountId;

  return {
    message: question,
    user_id: userId,
    group_id: groupId,
    thread_id: `${groupId}:${user.accountId || userId}`,
    lab_id: snapshot.labId || DEFAULT_LAB_ID,
    task_id: taskId || undefined,
    tasks: snapshot.tasks.map((task) => ({
      ...task,
      group_id: task.group_id || groupId,
      owner_id: task.owner_id || task.owner || '',
    })),
  };
}
