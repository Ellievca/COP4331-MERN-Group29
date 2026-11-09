import { createContext, useContext } from 'react';

// Shares the signed-in user with every screen, without passing props through the navigator.
// App.js provides { user, signOut }; screens read it with useAuth().
export const AuthContext = createContext({ user: null, signOut: () => {} });

export function useAuth() {
  return useContext(AuthContext);
}
