import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/index.js';
import { writeStored, SESSION_KEY } from '../lib/storage.js';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restoreError, setRestoreError] = useState('');
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
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);
  async function login(fields) {
    const next = await authService.login(fields);
    writeStored(sessionStorage, SESSION_KEY, next);
    setRestoreError('');
    setSession(next);
  }
  async function logout() {
    try {
      await authService.logout(session);
    } finally {
      sessionStorage.removeItem(SESSION_KEY);
      setSession(null);
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
