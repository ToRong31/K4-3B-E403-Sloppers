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
});

