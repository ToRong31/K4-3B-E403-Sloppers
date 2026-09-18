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
    getLabs: () => wait([labFixture]),
    analyzeLab: (payload) =>
      wait({
        status: 'ready',
        checklist_draft: {
          lab_id: payload?.lab_id ?? payload?.lab_manifest?.lab_id ?? 'K4-L3B-DAY05-06-MINI-HACKATHON',
          version: '1.0.0',
          tasks: workspaceFixture.tasks,
        },
        gaps: [],
        questions: [],
      }),
    createAssignmentDraft: () =>
      wait({
        status: 'ready',
        assignments: [
          { task_id: 't1', owner_id: 'm1', reason: 'Sở trường Product & Research' },
          { task_id: 't2', owner_id: 'm1', reason: 'Kinh nghiệm Product Lead' },
          { task_id: 't3', owner_id: 'm2', reason: 'Frontend + UI/UX' },
          { task_id: 't4', owner_id: 'm3', reason: 'AI / Golden set' },
          { task_id: 't5', owner_id: 'm4', reason: 'Backend + Data' },
        ],
        gaps: [],
      }),
    getWorkspaceSnapshot: () => wait(workspaceFixture),
    getCoachSnapshot: () => wait(coachFixture),
  };
}
