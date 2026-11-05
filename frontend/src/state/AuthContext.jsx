import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { authService } from '../services/index.js';
import { writeStored, SESSION_KEY } from '../lib/storage.js';
import { IS_DEMO } from '../services/client.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState('');
  const authVersion = useRef(0);
  const changingAuth = useRef(true);
  useEffect(() => {
    let active = true;
    authService
      .restore()
      .then((saved) => {
        if (active) setSession(saved);
      })
      .catch(() => {
        if (active) setRestoreError('Your session could not be restored. Please sign in again.');
      })
      .finally(() => {
        if (active) {
          changingAuth.current = false;
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    if (IS_DEMO) return;
    let active = true;
    const channel =
      typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel('studysync.auth');
    async function refresh() {
      if (changingAuth.current) return;
      const version = authVersion.current;
      try {
        const current = await authService.restore();
        if (!active || version !== authVersion.current || changingAuth.current) return;
        if (current) writeStored(sessionStorage, SESSION_KEY, current);
        else sessionStorage.removeItem(SESSION_KEY);
        setSession(current);
      } catch {
        /* A temporary network failure must not invent a different account. */
      }
    }
    window.addEventListener('focus', refresh);
    channel?.addEventListener('message', refresh);
    return () => {
      active = false;
      window.removeEventListener('focus', refresh);
      channel?.close();
    };
  }, []);
  function notifyOtherTabs() {
    if (!IS_DEMO && typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('studysync.auth');
      channel.postMessage('session-changed');
      channel.close();
    }
  }
  async function login(fields) {
    changingAuth.current = true;
    authVersion.current++;
    try {
      const next = await authService.login(fields);
      writeStored(sessionStorage, SESSION_KEY, next);
      setRestoreError('');
      setSession(next);
      notifyOtherTabs();
    } finally {
      changingAuth.current = false;
    }
  }
  async function logout() {
    changingAuth.current = true;
    authVersion.current++;
    try {
      try {
        await authService.logout(session);
      } catch (failure) {
        if (failure.status !== 401) throw failure;
      }
      sessionStorage.removeItem(SESSION_KEY);
      setSession(null);
      notifyOtherTabs();
    } finally {
      changingAuth.current = false;
    }
  }
  return (
    <AuthContext.Provider
      value={{ session, user: session?.user, loading, restoreError, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
