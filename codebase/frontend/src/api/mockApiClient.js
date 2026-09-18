import { canonicalTasksFixture, coachFixture, demoAccounts, labFixture, workspaceFixture } from './mockData';

const SESSION_KEY = 'vlearn-labspace.mock-session';

const wait = (value, delay = 180) =>
  new Promise((resolve) => window.setTimeout(() => resolve(structuredClone(value)), delay));

function createAssignmentDraft({ group_name, members, tasks }) {
  const eligibleMembers = members.filter((member) => member.skills?.length);
  if (!eligibleMembers.length) {
    return { status: 'clarify', assignments: [], gaps: ['Ít nhất một thành viên cần khai báo kỹ năng trước khi phân công.'] };
  }

  const workload = Object.fromEntries(eligibleMembers.map((member) => [member.id, 0]));
  let hasGap = false;
  const assignments = tasks.map((task) => {
    const taskText = `${task.title} ${task.deliverable}`.toLocaleLowerCase();
    const candidates = eligibleMembers.map((member) => ({
      member,
      matchedSkills: member.skills.filter((skill) => taskText.includes(skill.toLocaleLowerCase())),
    }));
    candidates.sort((left, right) => right.matchedSkills.length - left.matchedSkills.length || workload[left.member.id] - workload[right.member.id]);
    const winner = candidates[0];
    workload[winner.member.id] += 1;
    const matched = winner.matchedSkills.length > 0;
    hasGap ||= !matched;
    return {
      task_id: task.id,
      owner_id: winner.member.id,
      matched_skills: winner.matchedSkills,
      reason: matched ? `Kỹ năng tự khai phù hợp: ${winner.matchedSkills.join(', ')}.` : 'Chưa có skill khớp trực tiếp; tạm cân bằng số task trong nhóm.',
      confidence: matched ? 'high' : 'low',
    };
  });
  return { status: 'ready', assignments, gaps: hasGap ? ['Có task chưa khớp skill; nhóm cần kiểm tra trước khi xác nhận.'] : [] };
}

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
    assignTasks: (payload) => wait(createAssignmentDraft(payload), 420),
  };
}
