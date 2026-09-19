import { describe, expect, it } from 'vitest';

import { buildPrivateChatRequest } from './privateChatRequest';

describe('buildPrivateChatRequest', () => {
  it('sends the current workspace assignments instead of backend demo tasks', () => {
    const request = buildPrivateChatRequest({
      question: 'Tôi đang có task gì?',
      user: { accountId: 'student-1', shortName: 'Trọng' },
      snapshot: {
        group: { id: 'group-current' },
        members: [{ id: 'member-1', studentCode: 'student-1', name: 'Trọng' }],
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
        owner_id: 'member-1',
        group_id: 'group-current',
        completion_criteria: ['Repository truy cập công khai'],
      }),
    ]);
    expect(request.user_id).toBe('member-1');
    expect(request.user_label).toBe('Trọng');
    expect(request.thread_id).toBe('group-current:student-1');
  });

  it('sends an empty task list when the workspace has not been analyzed', () => {
    const request = buildPrivateChatRequest({
      question: 'Tôi đang có task gì?',
      user: { accountId: 'student-1', shortName: 'Trọng' },
      snapshot: { group: { id: 'group-current' }, members: [{ id: 'member-1', studentCode: 'student-1', name: 'Trọng' }], tasks: [] },
    });

    expect(request.tasks).toEqual([]);
  });

  it('includes attachment fields and default text when attachment is provided', () => {
    const request = buildPrivateChatRequest({
      question: '',
      user: { accountId: 'student-1', shortName: 'Trọng' },
      snapshot: { group: { id: 'group-current' }, members: [{ id: 'member-1', studentCode: 'student-1', name: 'Trọng' }], tasks: [] },
      attachment: {
        name: 'design-mockup.png',
        type: 'image/png',
        dataUrl: 'data:image/png;base64,iVBORw0KGgo...',
      },
    });

    expect(request.attachment_name).toBe('design-mockup.png');
    expect(request.attachment_type).toBe('image/png');
    expect(request.attachment_url).toBe('data:image/png;base64,iVBORw0KGgo...');
    expect(request.message).toBe('[Đính kèm: design-mockup.png]');
  });
});
