import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockApiClient } from './mockApiClient';

const store = new Map();

beforeEach(() => {
  store.clear();
  vi.stubGlobal('window', {
    setTimeout,
    sessionStorage: {
      getItem: (key) => store.get(key) ?? null,
      setItem: (key, value) => store.set(key, value),
      removeItem: (key) => store.delete(key),
    },
  });
});

describe('mockApiClient', () => {
  it('restores the selected demo account for the current session', async () => {
    const client = createMockApiClient();
    await client.login({ accountId: '2A202602678' });

    const session = await client.getSession();

    expect(session.user.role).toBe('member');
    expect(session.user.displayName).toBe('Lê Thị Thùy Trang');
  });

  it('rejects unknown accounts', async () => {
    const client = createMockApiClient();
    await expect(client.login({ accountId: 'unknown' })).rejects.toThrow(
      'Tài khoản demo không tồn tại.',
    );
  });

  it('keeps the empty workspace fixture in mock mode', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
    const client = createMockApiClient();

    const snapshot = await client.getWorkspaceSnapshot();

    expect(snapshot.tasks).toEqual([]);
    expect(snapshot.planStatus).toBe('draft');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not reuse another group chat when a new group is opened', async () => {
    const client = createMockApiClient();
    const oldMessages = await client.getGroupChatMessages('group-sloppers');
    const newMessages = await client.getGroupChatMessages('mock-new-group');

    expect(oldMessages).toHaveLength(2);
    expect(newMessages).toEqual([]);
  });

  it('creates a skill-based draft through the assignTasks client operation', async () => {
    const client = createMockApiClient();
    const draft = await client.assignTasks({
      group_name: 'Sloppers',
      members: [
        { id: 'ui', name: 'Trang', skills: ['UI'] },
        { id: 'ai', name: 'Dương', skills: ['AI'] },
      ],
      tasks: [{ id: 'task-1', title: 'AI evaluation', deliverable: 'golden set' }],
    });

    expect(draft).toMatchObject({
      status: 'ready',
      assignments: [{ task_id: 'task-1', owner_id: 'ai', matched_skills: ['AI'], confidence: 'high' }],
    });
  });

  it('keeps assignment approval in clarify while an invite is pending', async () => {
    const client = createMockApiClient();
    const draft = await client.assignTasks({
      members: [
        { id: 'leader', name: 'Leader', status: 'accepted', profileReady: true, skills: ['AI'] },
        { id: 'pending', name: 'Pending', status: 'pending', profileReady: false, skills: ['AI'] },
      ],
      tasks: [{ id: 'task-1', title: 'AI task', deliverable: 'result' }],
    });

    expect(draft).toMatchObject({ status: 'clarify', assignments: [] });
    expect(draft.gaps.join(' ')).toContain('Pending');
  });
});

