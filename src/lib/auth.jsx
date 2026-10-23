import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || user.mustChangePassword) return undefined;
    const heartbeat = () => {
      if (!document.hidden) {
        api.post('/messages/presence').catch((error) => console.error('Presence heartbeat failed', error));
      }
    };
    heartbeat();
    const interval = setInterval(heartbeat, 30000);
    document.addEventListener('visibilitychange', heartbeat);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', heartbeat);
    };
  }, [user?.id, user?.mustChangePassword]);

  const login = async (email, password) => setUser(await api.post('/auth/login', { email, password }));
  const refreshUser = async () => setUser(await api.get('/auth/me'));
  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout, refreshUser }}>{children}</Ctx.Provider>;
}
