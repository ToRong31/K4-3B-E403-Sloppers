import { useCallback, useEffect, useMemo, useState } from 'react';

import { apiClient } from '../api/createApiClient';
import { AuthContext } from './AuthContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    apiClient
      .getSession()
      .then((session) => {
        if (active) setUser(session.user ?? null);
      })
      .catch(() => {
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setStatus('ready');
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (credentials) => {
    setStatus('loading');
    try {
      const session = await apiClient.login(credentials);
      setUser(session.user);
      return session.user;
    } finally {
      setStatus('ready');
    }
  }, []);

  const logout = useCallback(async () => {
    setStatus('loading');
    try {
      await apiClient.logout();
      setUser(null);
    } finally {
      setStatus('ready');
    }
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout, dataSource: apiClient.source }),
    [login, logout, status, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

