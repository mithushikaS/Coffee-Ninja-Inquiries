'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '@/lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until the first /me check finishes

  useEffect(() => {
    let cancelled = false;
    api.me()
      .then(({ user }) => { if (!cancelled) setUser(user); })
      .catch(() => { /* not signed in */ })
      .finally(() => { if (!cancelled) setLoading(false); });

    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => {
      cancelled = true;
      window.removeEventListener('auth:expired', onExpired);
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const { user } = await api.login(email, password);
    setUser(user);
  }, []);

  const logout = useCallback(async () => {
    try { await api.logout(); } finally { setUser(null); }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}