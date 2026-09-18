async function request(baseUrl, path, options = {}) {
  const { timeoutMs = 30000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Không thể kết nối API. Hãy kiểm tra backend đang chạy ở cổng 8000.');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.detail ?? errorBody.message ?? `API request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return null;
  return response.json();
}

export function createHttpApiClient({ baseUrl }) {
  return {
    source: 'http',
    login: (credentials) =>
      request(baseUrl, '/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
        timeoutMs: 10000,
      }),
    logout: () => request(baseUrl, '/auth/logout', { method: 'POST' }),
    getSession: () => request(baseUrl, '/auth/me'),
    getLabs: () => request(baseUrl, '/labs'),
    analyzeLab: (payload) =>
      request(baseUrl, '/labs/analyze', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getWorkspaceSnapshot: () => request(baseUrl, '/groups/current'),
    getUserDirectory: () => request(baseUrl, '/users/directory'),
    createGroup: (payload) => request(baseUrl, '/groups', { method: 'POST', body: JSON.stringify(payload) }),
    updateGroup: (groupId, payload) => request(baseUrl, `/groups/${groupId}`, {
      method: 'PATCH', body: JSON.stringify(payload),
    }),
    deleteGroup: (groupId) => request(baseUrl, `/groups/${groupId}`, { method: 'DELETE' }),
    inviteMembers: (groupId, studentCodes) => request(baseUrl, `/groups/${groupId}/invitations`, {
      method: 'POST', body: JSON.stringify({ student_codes: studentCodes }),
    }),
    removeGroupMember: (groupId, userId = 'me') => request(baseUrl, `/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
    }),
    respondInvitation: (invitationId, decision) => request(baseUrl, `/invitations/${invitationId}/${decision}`, { method: 'POST' }),
    saveSkillProfile: (groupId, profile) => request(baseUrl, `/groups/${groupId}/members/me/skill-profile`, {
      method: 'PUT',
      body: JSON.stringify({
        industry: profile.industry,
        skills: profile.skillsWithLevel.map((item) => ({ name: item.skill, level: item.level })),
      }),
    }),
    updateTask: (taskId, updates) =>
      request(baseUrl, `/groups/current/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    approvePlan: () =>
      request(baseUrl, '/groups/current/plan/approve', {
        method: 'POST',
      }),
    createGroupAssignmentDraft: (groupId) => request(baseUrl, `/groups/${groupId}/assignment-drafts`, { method: 'POST' }),
    overrideAssignment: (draftId, taskId, ownerId) => request(baseUrl, `/assignment-drafts/${draftId}/items/${taskId}`, {
      method: 'PATCH', body: JSON.stringify({ owner_id: ownerId }),
    }),
    approveAssignmentDraft: (draftId) => request(baseUrl, `/assignment-drafts/${draftId}/approve`, { method: 'POST' }),
    getCoachSnapshot: () => request(baseUrl, '/coach/groups'),
    assignTasks: (payload) => request(baseUrl, '/assignments/assign_tasks', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
    getSupportRequests: () => request(baseUrl, '/coach/support-requests'),
    createSupportRequest: (payload) =>
      request(baseUrl, '/coach/support-requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    resolveSupportRequest: (requestId, response) =>
      request(baseUrl, `/coach/support-requests/${requestId}/resolve`, {
        method: 'POST',
        body: JSON.stringify({ response }),
      }),
    checkGithubSubmission: (repoUrl) =>
      request(baseUrl, '/submissions/check-github', {
        method: 'POST',
        body: JSON.stringify({ repo_url: repoUrl }),
      }),
    sendChatMessage: (payload) =>
      request(baseUrl, '/chat', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    getGroupChatMessages: () => request(baseUrl, '/groups/current/chat'),
    sendGroupChatMessage: (payload) =>
      request(baseUrl, '/groups/current/chat', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    createAssignmentDraft: (payload) =>
      request(baseUrl, '/assignments/draft', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  };
}

