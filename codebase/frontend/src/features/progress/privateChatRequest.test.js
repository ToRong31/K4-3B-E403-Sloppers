import { describe, expect, it } from 'vitest';

import { buildPrivateChatRequest } from './privateChatRequest';

describe('buildPrivateChatRequest', () => {
  it('sends the current workspace assignments instead of backend demo tasks', () => {
    const request = buildPrivateChatRequest({
      question: 'Tôi đang có task gì?',
      user: { accountId: 'student-1', shortName: 'Trọng' },
      snapshot: {
        group: { id: 'group-current' },
        tasks: [
          {
            id: 'actual-task',
            title: 'Nộp link repository công khai',
            owner: 'Trọng',
            status: 'todo',
            completion_criteria: ['Repository truy cập công khai'],
          },
        ],
      },
      taskId: 'actual-task',
    });

    expect(request.tasks).toEqual([
      expect.objectContaining({
        id: 'actual-task',
        owner_id: 'Trọng',
        group_id: 'group-current',
        completion_criteria: ['Repository truy cập công khai'],
      }),
    ]);
    expect(request.thread_id).toBe('group-current:student-1');
  });

  it('sends an empty task list when the workspace has not been analyzed', () => {
    const request = buildPrivateChatRequest({
      question: 'Tôi đang có task gì?',
      user: { accountId: 'student-1', shortName: 'Trọng' },
      snapshot: { group: { id: 'group-current' }, tasks: [] },
    });

    expect(request.tasks).toEqual([]);
  });
});
