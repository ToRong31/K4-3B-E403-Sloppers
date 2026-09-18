import { coachFixture, demoAccounts, labFixture, workspaceFixture } from './mockData';

const SESSION_KEY = 'vlearn-labspace.mock-session';

const wait = (value, delay = 180) =>
  new Promise((resolve) => window.setTimeout(() => resolve(structuredClone(value)), delay));

export function createMockApiClient() {
  return {
    source: 'mock',
    async login({ accountId, email }) {
      const user = demoAccounts.find(
        (account) => account.accountId === accountId || account.email === email,
      );
      if (!user) throw new Error('Tài khoản demo không tồn tại.');
      window.sessionStorage.setItem(SESSION_KEY, user.id);
      return wait({ user });
    },
    async logout() {
      window.sessionStorage.removeItem(SESSION_KEY);
      return wait(null, 80);
    },
    async getSession() {
      const userId = window.sessionStorage.getItem(SESSION_KEY);
      const user = demoAccounts.find((account) => account.id === userId) ?? null;
      return wait({ user }, 80);
    },
    getDemoAccounts: () => wait(demoAccounts, 60),
    getLabs: async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/labs');
        if (res.ok) return await res.json();
      } catch {}
      return wait([labFixture]);
    },
    getWorkspaceSnapshot: async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/groups/current');
        if (res.ok) return await res.json();
      } catch {}
      return wait(workspaceFixture);
    },
    getCoachSnapshot: async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/coach/groups');
        if (res.ok) return await res.json();
      } catch {}
      return wait(coachFixture);
    },
    updateTask: async (taskId, updates) => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/groups/current/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (res.ok) return await res.json();
      } catch {}
      return wait({ id: taskId, ...updates });
    },
    approvePlan: async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/groups/current/plan/approve', {
          method: 'POST',
        });
        if (res.ok) return await res.json();
      } catch {}
      return wait({ status: 'approved' });
    },
    getSupportRequests: async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/coach/support-requests');
        if (res.ok) return await res.json();
      } catch {}
      return wait([]);
    },
    createSupportRequest: async (payload) => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/coach/support-requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) return await res.json();
      } catch {}
      return wait({ id: `req-${Date.now()}`, ...payload, status: 'pending' });
    },
    resolveSupportRequest: async (requestId, response) => {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/v1/coach/support-requests/${requestId}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response }),
        });
        if (res.ok) return await res.json();
      } catch {}
      return wait({ id: requestId, response, status: 'resolved' });
    },
    checkGithubSubmission: async (repoUrl) => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/submissions/check-github', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo_url: repoUrl }),
        });
        if (res.ok) return await res.json();
      } catch {}
      return wait({
        valid: true,
        repo_url: repoUrl,
        summary: 'AI Double Check hoàn tất: Đầy đủ các tệp bàn giao bắt buộc.',
      });
    },
    sendChatMessage: async (payload) => {
      let response;
      try {
        response = await fetch('http://127.0.0.1:8000/api/v1/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (err) {
        console.warn('Backend chat API connection error, using local fallback:', err);
        return null;
      }
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail ?? `Chat API failed (${response.status})`);
      }
      return response.json();
    },
    getGroupChatMessages: async () => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/groups/current/chat');
        if (res.ok) return await res.json();
      } catch {}
      return wait([
        {
          id: 'msg-init-1',
          author: 'Phạm Hoàng Trọng',
          shortName: 'Trọng',
          initial: 'T',
          role: 'Nhóm trưởng',
          isLeader: true,
          time: '10:00',
          text: 'Mọi người kiểm tra lại task và tiêu chí hoàn thành trước khi bắt đầu nhé.',
        },
        {
          id: 'msg-init-2',
          author: 'Lê Thị Thùy Trang',
          shortName: 'Trang',
          initial: 'T',
          role: 'Frontend · UI/UX',
          isLeader: false,
          time: '10:05',
          text: 'Mình đang tiến hành dựng flow tương tác cho mockup rồi nhé.',
        },
      ]);
    },
    sendGroupChatMessage: async (payload) => {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/v1/groups/current/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) return await res.json();
      } catch {}
      return wait({
        id: `msg-${Date.now()}`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        ...payload,
      });
    },
  };
}
