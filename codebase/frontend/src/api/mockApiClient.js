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
    getWorkspaceSnapshot: () => wait(workspaceFixture),
    getCoachSnapshot: () => wait(coachFixture),
  };
}
