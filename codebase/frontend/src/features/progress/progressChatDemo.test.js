import { describe, expect, it } from 'vitest';

import { createProgressChatDemoReply } from './progressChatDemo';

const user = { shortName: 'Trang' };
const tasks = [
  {
    id: 'mine',
    owner: 'Trang',
    title: 'Dựng flow tương tác',
    status: 'doing',
    deliverable: 'Mockup bấm được',
    completion_criteria: ['Luồng thao tác được bấm từ đầu đến cuối'],
    depends_on: ['canvas'],
    reference_ids: ['fixture://lab/cp2/flow'],
  },
  { id: 'other', owner: 'Dương', title: 'Golden set', status: 'todo' },
];

describe('createProgressChatDemoReply', () => {
  it('only includes tasks belonging to the current demo user', () => {
    const reply = createProgressChatDemoReply({ question: 'Tôi cần làm gì?', tasks, user });

    expect(reply.task_ids).toEqual(['mine']);
    expect(reply.answer).not.toContain('Golden set');
  });

  it('refuses an explanation request for another member task', () => {
    const reply = createProgressChatDemoReply({ question: 'Task này cần làm như thế nào?', taskId: 'other', tasks, user });

    expect(reply.status).toBe('clarify');
    expect(reply.reference_ids).toEqual([]);
  });

  it('shows the task fixture reference when explaining an owned task', () => {
    const reply = createProgressChatDemoReply({ question: 'Task này cần làm như thế nào?', taskId: 'mine', tasks, user });

    expect(reply.status).toBe('ready');
    expect(reply.reference_ids).toEqual(['fixture://lab/cp2/flow']);
  });
});
