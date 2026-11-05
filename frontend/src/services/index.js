import {
  IS_DEMO,
  request,
  normalizeUser,
  normalizeDeck,
  normalizeLoginResponse,
} from './client.js';
import { demoAuth, demoWorkspace } from './demo.js';
import { readStored, SESSION_KEY } from '../lib/storage.js';

// Provisional REST contract. Change routes, payloads, and normalization here
// when the API team supplies its contract; components do not call fetch.
export const authService = {
  async register(fields) {
    return IS_DEMO
      ? demoAuth.register(fields)
      : request('/api/auth/register', { method: 'POST', body: fields });
  },
  async login(fields) {
    if (IS_DEMO) return demoAuth.login(fields);
    const result = await request('/api/auth/login', {
      method: 'POST',
      body: fields,
      applicationErrorStatus: 401,
    });
    return normalizeLoginResponse(result);
  },
  async restore() {
    if (IS_DEMO) return demoAuth.restore();
    const saved = readStored(sessionStorage, SESSION_KEY, null);
    if (saved?.mode !== 'api') return null;
    const result = await request('/api/auth/me', { token: saved.accessToken });
    if (!result?.user?.id && !result?.user?._id) return null;
    return { ...saved, user: normalizeUser(result.user) };
  },
  async logout(session) {
    if (!IS_DEMO)
      await request('/api/auth/logout', { method: 'POST', token: session?.accessToken });
  },
};

export const workspaceService = {
  async load(session) {
    if (IS_DEMO) return demoWorkspace.load(session.user.id);
    const options = { token: session.accessToken };
    const [decks, courses, sessions] = await Promise.all([
      request('/api/decks', options),
      request('/api/courses', options),
      request('/api/study-sessions', options),
    ]);
    return {
      decks: decks.map(normalizeDeck),
      courses: courses.map((course) => ({
        ...course,
        id: course.id || course._id,
        color: ['purple', 'blue', 'peach'].includes(course.color)
          ? course.color
          : course.code === 'COP3503'
            ? 'blue'
            : course.code === 'CDA3103'
              ? 'peach'
              : 'purple',
      })),
      sessions: sessions.map((item) => ({ ...item, id: item.id || item._id })),
    };
  },
  async getCards(session, id) {
    return IS_DEMO
      ? demoWorkspace.getCards(session.user.id, id)
      : (
          await request(`/api/decks/${encodeURIComponent(id)}/cards`, {
            token: session.accessToken,
          })
        ).map((card) => ({ ...card, id: card.id || card._id }));
  },
  async createDeck(session, fields) {
    return IS_DEMO
      ? demoWorkspace.createDeck(session.user.id, fields)
      : normalizeDeck(
          await request('/api/decks', { method: 'POST', body: fields, token: session.accessToken }),
        );
  },
  async deleteDeck(session, id) {
    return IS_DEMO
      ? demoWorkspace.deleteDeck(session.user.id, id)
      : request(`/api/decks/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          token: session.accessToken,
        });
  },
  async addCard(session, id, fields) {
    return IS_DEMO
      ? demoWorkspace.addCard(session.user.id, id, fields)
      : request(`/api/decks/${encodeURIComponent(id)}/cards`, {
          method: 'POST',
          body: fields,
          token: session.accessToken,
        });
  },
  async deleteCard(session, id, cardId) {
    return IS_DEMO
      ? demoWorkspace.deleteCard(session.user.id, id, cardId)
      : request(`/api/decks/${encodeURIComponent(id)}/cards/${encodeURIComponent(cardId)}`, {
          method: 'DELETE',
          token: session.accessToken,
        });
  },
  async recordSession(session, fields) {
    return IS_DEMO
      ? demoWorkspace.recordSession(session.user.id, fields)
      : request('/api/study-sessions', {
          method: 'POST',
          body: fields,
          token: session.accessToken,
        });
  },
};
