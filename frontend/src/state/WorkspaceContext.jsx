import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { workspaceService } from '../services/index.js';

const WorkspaceContext = createContext(null);
export function WorkspaceProvider({ children }) {
  const { session } = useAuth();
  const [data, setData] = useState({ decks: [], courses: [], sessions: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    setError('');
    try {
      const next = await workspaceService.load(session);
      if (generation.current === current) setData(next);
    } catch (failure) {
      if (generation.current === current) setError(failure.message);
    } finally {
      if (generation.current === current) setLoading(false);
    }
  }, [session]);
  useEffect(() => {
    reload();
    return () => {
      generation.current++;
    };
  }, [reload]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(''), 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  async function mutate(method, args, message) {
    const result = await workspaceService[method](session, ...args);
    await reload();
    if (message) setToast(message);
    return result;
  }
  return (
    <WorkspaceContext.Provider
      value={{
        ...data,
        loading,
        error,
        reload,
        toast,
        setToast,
        getCards: (id) => workspaceService.getCards(session, id),
        createDeck: (fields) =>
          mutate('createDeck', [fields], 'Your new deck is ready. Add a few cards to get started.'),
        deleteDeck: (id) => mutate('deleteDeck', [id], 'Deck deleted.'),
        addCard: (id, fields) =>
          mutate('addCard', [id, fields], 'Flashcard added. One more thing you know.'),
        deleteCard: (id, cardId) => mutate('deleteCard', [id, cardId], 'Flashcard deleted.'),
        recordSession: (fields) =>
          mutate('recordSession', [fields], 'Session saved. Nice progress!'),
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}
export const useWorkspace = () => useContext(WorkspaceContext);
