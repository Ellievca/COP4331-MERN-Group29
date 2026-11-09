// Every call to the StudySync API goes through this file.
// If the team switches from cookies to JWT later, this is the only file to change.
import { API_URL } from './config';

// How the server's session works (see docs/API_HANDOFF.md in the repo):
// - Login sets a session cookie. React Native's fetch stores it and sends it
//   back automatically, just like a browser.
// - Login also returns a csrfToken. Every POST/PATCH/DELETE must send it back
//   in the X-CSRF-Token header, or the server answers 403.
let csrfToken = null;

// If the session runs out while the app is open, the server answers 401.
// App.js registers a function here that sends the user back to the login screen.
let onUnauthorized = null;
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

const LOGIN_FAILED = 'Login failed. Please check your username and password and try again.';

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status; // HTTP status, or 0 if the server couldn't be reached
    this.code = code; // the server's error code, e.g. 'invalid_credentials'
  }
}

export async function request(path, { method = 'GET', body } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken;

  // Give up after 15 seconds instead of spinning forever on bad Wi-Fi.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  let response;
  try {
    response = await fetch(API_URL + path, {
      method,
      headers,
      credentials: 'include',
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch {
    throw new ApiError(
      "Can't reach StudySync. Check your internet connection and try again.",
      0,
      'network',
    );
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 204) return null; // success with no body (e.g. logout)

  const data = await response.json().catch(() => null);
  if (response.status === 401 && !path.startsWith('/auth/')) {
    csrfToken = null;
    onUnauthorized?.();
  }
  if (!response.ok) {
    // The server sends errors as { error: "message", code: "..." }
    throw new ApiError(
      data?.error || 'Something went wrong. Please try again.',
      response.status,
      data?.code,
    );
  }
  return data;
}

// ---------- Auth ----------

// `username` can be a username or an email; the server accepts either.
export async function login(username, password) {
  try {
    const data = await request('/auth/login', {
      method: 'POST',
      body: { login: username.trim(), password },
    });
    csrfToken = data.csrfToken;
    return data.user; // { id, firstName, lastName, email, login, role, ... }
  } catch (error) {
    // Wrong username or password: always the same generic message (rubric item).
    if (error.status === 401) throw new ApiError(LOGIN_FAILED, 401, error.code);
    throw error;
  }
}

// Creates the account, then signs in with it, so a new user lands straight in the app.
// (The server's register endpoint doesn't start a session by itself.)
// If the team adds email verification, this is where "check your email" will go.
export async function register({ firstName, lastName, email, username, password }) {
  try {
    await request('/auth/register', {
      method: 'POST',
      body: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        login: username.trim(),
        password,
      },
    });
  } catch (error) {
    if (error.status === 409) {
      throw new ApiError(
        'That username or email is already in use. Try a different one, or sign in instead.',
        409,
        error.code,
      );
    }
    throw error;
  }
  return login(username, password);
}

// Called when the app opens. Returns the signed-in user, or null if signed out.
export async function getCurrentUser() {
  try {
    const data = await request('/auth/me');
    csrfToken = data.csrfToken;
    return data.user;
  } catch (error) {
    if (error.status === 401) return null;
    throw error;
  }
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' });
  } finally {
    csrfToken = null;
  }
}

// ---------- Your study data ----------
// Each returns an array straight from the server (newest first where it matters).

// [{ id, name, code, color }]
export function getCourses() {
  return request('/courses');
}

// [{ id, title, description, courseId, cardCount, createdAt, updatedAt }]
export function getDecks() {
  return request('/decks');
}

// [{ id, deckId, deckTitle, startedAt, endedAt, cardsReviewed, cardsCorrect }]
export function getStudySessions() {
  return request('/study-sessions');
}

// { name, code?, color? } → the new course. color is 'purple', 'blue' or 'peach'.
export async function createCourse({ name, code = '', color = 'purple' }) {
  try {
    return await request('/courses', {
      method: 'POST',
      body: { name: name.trim(), code: code.trim(), color },
    });
  } catch (error) {
    // The server's 409 message also mentions usernames and emails; keep it about courses.
    if (error.status === 409)
      throw new ApiError('You already have a course with that name.', 409, error.code);
    throw error;
  }
}

// { title, description?, courseId? } → the new deck (with cardCount: 0)
export function createDeck({ title, description = '', courseId = null }) {
  return request('/decks', {
    method: 'POST',
    body: { title: title.trim(), description: description.trim(), courseId },
  });
}

// Deletes the deck and all of its cards. Can't be undone.
export function deleteDeck(deckId) {
  return request(`/decks/${deckId}`, { method: 'DELETE' });
}
