import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api.js';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

let presenceTimer;
let presenceUserId;
let lastPresenceUserId;
let presenceSubscribers = 0;
let presenceGeneration = 0;
let lastPresenceSentAt = 0;

function stopPresencePolling() {
  clearInterval(presenceTimer);
  presenceTimer = undefined;
  document.removeEventListener('visibilitychange', handlePresenceVisibility);
  presenceUserId = undefined;
  presenceSubscribers = 0;
}

function sendPresence() {
  if (document.hidden || Date.now() - lastPresenceSentAt < 1000) return;
  lastPresenceSentAt = Date.now();
  api.post('/messages/presence').catch((error) => console.error('Presence heartbeat failed', error));
}

function handlePresenceVisibility() {
  if (document.hidden) {
    clearInterval(presenceTimer);
    presenceTimer = undefined;
    return;
  }
  if (presenceSubscribers > 0 && !presenceTimer) {
    sendPresence();
    presenceTimer = setInterval(sendPresence, 30000);
  }
}

function startPresencePolling(userId) {
  if (presenceUserId && presenceUserId !== userId) stopPresencePolling();
  if (!presenceUserId) {
    presenceUserId = userId;
    if (lastPresenceUserId !== userId) {
      lastPresenceSentAt = 0;
      lastPresenceUserId = userId;
    }
    presenceGeneration += 1;
    document.addEventListener('visibilitychange', handlePresenceVisibility);
  }
  presenceSubscribers += 1;
  if (!document.hidden && !presenceTimer) {
    presenceTimer = setInterval(sendPresence, 30000);
    sendPresence();
  }
  const generation = presenceGeneration;
  return () => {
    if (generation !== presenceGeneration) return;
    presenceSubscribers -= 1;
    if (presenceSubscribers === 0) stopPresencePolling();
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/auth/me').then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!user || user.mustChangePassword) return undefined;
    return startPresencePolling(user.id);
  }, [user?.id, user?.mustChangePassword]);

  const login = async (email, password) => setUser(await api.post('/auth/login', { email, password }));
  const refreshUser = async () => setUser(await api.get('/auth/me'));
  const logout = async () => {
    await api.post('/auth/logout');
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, logout, refreshUser }}>{children}</Ctx.Provider>;
}
