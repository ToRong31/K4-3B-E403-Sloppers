async function request(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.message ?? `API request failed (${response.status})`);
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
      }),
    logout: () => request(baseUrl, '/auth/logout', { method: 'POST' }),
    getSession: () => request(baseUrl, '/auth/me'),
    getLabs: () => request(baseUrl, '/labs'),
    getWorkspaceSnapshot: () => request(baseUrl, '/groups/current'),
    updateTask: (taskId, updates) =>
      request(baseUrl, `/groups/current/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }),
    approvePlan: () =>
      request(baseUrl, '/groups/current/plan/approve', {
        method: 'POST',
      }),
    getCoachSnapshot: () => request(baseUrl, '/coach/groups'),
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

