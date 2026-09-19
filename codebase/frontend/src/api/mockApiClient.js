import { canonicalTasksFixture, coachFixture, demoAccounts, labFixture, workspaceFixture } from './mockData';

const SESSION_KEY = 'vlearn-labspace.mock-session';

const wait = (value, delay = 180) =>
  new Promise((resolve) => window.setTimeout(() => resolve(structuredClone(value)), delay));

function createAssignmentDraft({ members, tasks }) {
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

export function createMockApiClient({ baseUrl = 'http://127.0.0.1:8000/api/v1' } = {}) {
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
        const response = await fetch(`${baseUrl}/labs`);
        if (response.ok) return await response.json();
      } catch {}
      return wait([labFixture]);
    },
    analyzeLab: async (payload) => {
      try {
        const response = await fetch(`${baseUrl}/labs/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          const data = await response.json();
          if (data?.status === 'ready' && data.checklist_draft) return data;
        }
      } catch {}
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
    getCoachSnapshot: async () => {
      try {
        const response = await fetch(`${baseUrl}/coach/groups`);
        if (response.ok) return await response.json();
      } catch {}
      return wait(coachFixture);
    },
    assignTasks: (payload) => wait(createAssignmentDraft(payload), 420),
    updateTask: async (taskId, updates) => {
      try {
        const response = await fetch(`${baseUrl}/groups/current/tasks/${taskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (response.ok) return await response.json();
      } catch {}
      return wait({ id: taskId, ...updates });
    },
    approvePlan: async () => {
      try {
        const response = await fetch(`${baseUrl}/groups/current/plan/approve`, { method: 'POST' });
        if (response.ok) return await response.json();
      } catch {}
      return wait({ status: 'approved' });
    },
    getSupportRequests: async () => {
      try {
        const response = await fetch(`${baseUrl}/coach/support-requests`);
        if (response.ok) return await response.json();
      } catch {}
      return wait([]);
    },
    createSupportRequest: async (payload) => {
      try {
        const response = await fetch(`${baseUrl}/coach/support-requests`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) return await response.json();
      } catch {}
      return wait({ id: `req-${Date.now()}`, ...payload, status: 'pending' });
    },
    resolveSupportRequest: async (requestId, responseText) => {
      try {
        const response = await fetch(`${baseUrl}/coach/support-requests/${requestId}/resolve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ response: responseText }),
        });
        if (response.ok) return await response.json();
      } catch {}
      return wait({ id: requestId, response: responseText, status: 'resolved' });
    },
    checkGithubSubmission: async (repoUrl) => {
      try {
        const response = await fetch(`${baseUrl}/submissions/check-github`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repo_url: repoUrl }),
        });
        if (response.ok) return await response.json();
      } catch {}
      return wait({ valid: true, repo_url: repoUrl, summary: 'AI Double Check hoàn tất: Đầy đủ các tệp bàn giao bắt buộc.' });
    },
    sendChatMessage: async (payload) => {
      let response;
      try {
        response = await fetch(`${baseUrl}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } catch (error) {
        console.warn('Backend chat API connection error, using local fallback:', error);
        return null;
      }
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.detail ?? `Chat API failed (${response.status})`);
      }
      return response.json();
    },
    getAiChatHistory: async ({ threadId, userId, groupId } = {}) => {
      const params = new URLSearchParams();
      if (threadId) params.set('thread_id', threadId);
      if (userId) params.set('user_id', userId);
      if (groupId) params.set('group_id', groupId);
      const qs = params.toString();
      try {
        const response = await fetch(`${baseUrl}/chat/history${qs ? `?${qs}` : ''}`);
        if (response.ok) return await response.json();
      } catch {}
      return wait([]);
    },
    clearAiChatHistory: async ({ threadId, userId, groupId } = {}) => {
      const params = new URLSearchParams();
      if (threadId) params.set('thread_id', threadId);
      if (userId) params.set('user_id', userId);
      if (groupId) params.set('group_id', groupId);
      const qs = params.toString();
      try {
        const response = await fetch(`${baseUrl}/chat/history${qs ? `?${qs}` : ''}`, {
          method: 'DELETE',
        });
        if (response.ok) return await response.json();
      } catch {}
      return wait({ status: 'cleared', count: 0 });
    },
    getGroupChatMessages: async (groupId) => {
      try {
        const response = await fetch(`${baseUrl}/groups/current/chat${groupId ? `?groupId=${encodeURIComponent(groupId)}` : ''}`);
        if (response.ok) return await response.json();
      } catch {}
      return wait([
        { id: 'msg-init-1', author: 'Phạm Hoàng Trọng', shortName: 'Trọng', initial: 'T', role: 'Nhóm trưởng', isLeader: true, time: '10:00', text: 'Mọi người kiểm tra lại task và tiêu chí hoàn thành trước khi bắt đầu nhé.' },
        { id: 'msg-init-2', author: 'Lê Thị Thùy Trang', shortName: 'Trang', initial: 'T', role: 'Frontend · UI/UX', isLeader: false, time: '10:05', text: 'Mình đang tiến hành dựng flow tương tác cho mockup rồi nhé.' },
      ]);
    },
    sendGroupChatMessage: async (payload) => {
      try {
        const response = await fetch(`${baseUrl}/groups/current/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) return await response.json();
      } catch {}
      return wait({
        id: `msg-${Date.now()}`,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        ...payload,
      });
    },
  };
}
