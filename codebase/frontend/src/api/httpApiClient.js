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
    getCoachSnapshot: () => request(baseUrl, '/coach/groups'),
  };
}

