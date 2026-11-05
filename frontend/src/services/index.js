import {
  IS_DEMO,
  request,
  normalizeUser,
  normalizeDeck,
  normalizeLoginResponse,
} from './client.js';
import { demoAuth, demoWorkspace } from './demo.js';
import { readStored, SESSION_KEY } from '../lib/storage.js';

// The bundled Express server implements this contract. Keep teammate-specific
// mappings here when reconciling their backend; components do not call fetch.
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
    let result;
    try {
      result = await request('/api/auth/me', {
        token: saved?.mode === 'api' ? saved.accessToken : undefined,
      });
    } catch (failure) {
      if (failure.status === 401) return null;
      throw failure;
    }
    if (!result?.user?.id && !result?.user?._id) return null;
    return { user: normalizeUser(result.user), csrfToken: result.csrfToken, mode: 'api' };
  },
  async logout(session) {
    if (!IS_DEMO)
      await request('/api/auth/logout', {
        method: 'POST',
        token: session?.accessToken,
        csrfToken: session?.csrfToken,
      });
  },
};

export const workspaceService = {
  async createCourse(session, fields) {
    return IS_DEMO
      ? demoWorkspace.createCourse(session.user.id, fields)
      : request('/api/courses', {
          method: 'POST',
          body: fields,
          token: session.accessToken,
          csrfToken: session.csrfToken,
        });
  },
  async load(session) {
    if (IS_DEMO) return demoWorkspace.load(session.user.id);
    const options = { token: session.accessToken, csrfToken: session.csrfToken };
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
            csrfToken: session.csrfToken,
          })
        ).map((card) => ({ ...card, id: card.id || card._id }));
  },
  async createDeck(session, fields) {
    return IS_DEMO
      ? demoWorkspace.createDeck(session.user.id, fields)
      : normalizeDeck(
          await request('/api/decks', {
            method: 'POST',
            body: fields,
            token: session.accessToken,
            csrfToken: session.csrfToken,
          }),
        );
  },
  async deleteDeck(session, id) {
    return IS_DEMO
      ? demoWorkspace.deleteDeck(session.user.id, id)
      : request(`/api/decks/${encodeURIComponent(id)}`, {
          method: 'DELETE',
          token: session.accessToken,
          csrfToken: session.csrfToken,
        });
  },
  async addCard(session, id, fields) {
    return IS_DEMO
      ? demoWorkspace.addCard(session.user.id, id, fields)
      : request(`/api/decks/${encodeURIComponent(id)}/cards`, {
          method: 'POST',
          body: fields,
          token: session.accessToken,
          csrfToken: session.csrfToken,
        });
  },
  async deleteCard(session, id, cardId) {
    return IS_DEMO
      ? demoWorkspace.deleteCard(session.user.id, id, cardId)
      : request(`/api/decks/${encodeURIComponent(id)}/cards/${encodeURIComponent(cardId)}`, {
          method: 'DELETE',
          token: session.accessToken,
          csrfToken: session.csrfToken,
        });
  },
  async recordSession(session, fields) {
    return IS_DEMO
      ? demoWorkspace.recordSession(session.user.id, fields)
      : request('/api/study-sessions', {
          method: 'POST',
          body: fields,
          token: session.accessToken,
          csrfToken: session.csrfToken,
        });
  },
};

export const adminService = {
  async load(session) {
    const options = { csrfToken: session.csrfToken, token: session.accessToken };
    const [stats, users] = await Promise.all([
      request('/api/admin/stats', options),
      request('/api/admin/users', options),
    ]);
    return { stats, users };
  },
  async setActive(session, id, isActive) {
    return request('/api/admin/users/' + encodeURIComponent(id) + '/activation', {
      method: 'PATCH',
      body: { isActive },
      csrfToken: session.csrfToken,
      token: session.accessToken,
    });
  },
};
