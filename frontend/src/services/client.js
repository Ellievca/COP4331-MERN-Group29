const environment = import.meta.env || {};
export const IS_DEMO = environment.VITE_DATA_MODE !== 'api';
const API_BASE_URL = (environment.VITE_API_BASE_URL || '').trim().replace(/\/+$/, '');

export class ServiceError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'ServiceError';
    this.status = status;
  }
}

export async function request(path, { method = 'GET', body, token, signal } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: 'include',
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: signal || controller.signal,
    });
    let data;
    if (response.status !== 204) {
      try {
        data = await response.json();
      } catch {
        throw new ServiceError(
          'The API returned an unexpected response. Please try again.',
          response.status,
        );
      }
    }
    if (!response.ok)
      throw new ServiceError(
        response.status === 401
          ? 'Login failed. Please check your credentials and try again.'
          : data?.error || data?.message || 'The request could not be completed.',
        response.status,
      );
    // Some class APIs return HTTP 200 together with an error field.
    if (data?.error) throw new ServiceError(data.error);
    return data;
  } catch (error) {
    if (error.name === 'AbortError')
      throw new ServiceError('The server took too long to respond. Please try again.');
    if (error instanceof ServiceError) throw error;
    throw new ServiceError('We could not reach the server. Check your connection and try again.');
  } finally {
    clearTimeout(timeout);
  }
}

export const normalizeUser = (user) => ({ ...user, id: user.id || user._id });
export const normalizeDeck = (deck) => ({
  ...deck,
  id: deck.id || deck._id,
  courseId: deck.courseId?._id || deck.courseId,
  cardCount: deck.cardCount ?? deck.cards?.length ?? 0,
});
