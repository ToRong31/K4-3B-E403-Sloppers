import { canonicalTasksFixture, coachFixture, demoAccounts, labFixture, workspaceFixture } from './mockData';

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
    getLabs: () => wait([labFixture]),
    analyzeLab: async (payload) => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/v1/labs/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.status === 'ready' && data.checklist_draft) {
            return data;
          }
        }
      } catch {
        // Fallback to local wait if backend is unreachable
      }
      return wait({
        status: 'ready',
        checklist_draft: {
          lab_id: payload?.lab_id ?? payload?.lab_manifest?.lab_id ?? 'K4-L3B-DAY05-06-MINI-HACKATHON',
          version: '1.0.0',
          tasks: canonicalTasksFixture,
        },
        gaps: [],
        questions: [],
      }, 400);
    },
    getWorkspaceSnapshot: () => wait(workspaceFixture),
    getCoachSnapshot: () => wait(coachFixture),
  };
}
