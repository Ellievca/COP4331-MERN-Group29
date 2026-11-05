import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { demoAuth, demoWorkspace } from '../src/services/demo.js';
import {
  request,
  ServiceError,
  normalizeLoginResponse,
  LOGIN_FAILURE_MESSAGE,
} from '../src/services/client.js';
import { filterDecks } from '../src/lib/format.js';
import { SESSION_KEY } from '../src/lib/storage.js';

function memoryStorage() {
  const entries = new Map();
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, String(value)),
    removeItem: (key) => entries.delete(key),
    clear: () => entries.clear(),
    values: () => [...entries.values()],
  };
}
globalThis.localStorage = memoryStorage();
globalThis.sessionStorage = memoryStorage();
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

const fields = {
  firstName: 'Niko',
  lastName: 'Student',
  email: 'niko@example.com',
  login: 'niko',
  password: 'Practice123!',
};

test('a newly registered user can sign in without storing or returning a plaintext password', async () => {
  await demoAuth.register(fields);
  const session = await demoAuth.login({ login: 'NIKO', password: fields.password });
  assert.equal(session.user.firstName, 'Niko');
  assert.equal(session.user.login, 'niko');
  assert.equal(session.user.passwordHash, undefined);
  assert.equal(session.user.salt, undefined);
  assert.ok(!localStorage.values().some((value) => value.includes(fields.password)));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  assert.equal((await demoAuth.restore()).user.id, session.user.id);
});

test('the public demo account can be recreated after browser storage is cleared', async () => {
  await demoAuth.login({ login: 'student', password: 'StudySync123!' });
  localStorage.clear();
  const session = await demoAuth.login({ login: 'student', password: 'StudySync123!' });
  assert.equal(session.user.firstName, 'Alex');
  assert.equal(session.mode, 'demo');
});

test('unknown usernames and incorrect passwords produce the same generic login failure', async () => {
  await demoAuth.register(fields);
  let missing;
  let wrong;
  try {
    await demoAuth.login({ login: 'not-a-user', password: fields.password });
  } catch (error) {
    missing = error;
  }
  try {
    await demoAuth.login({ login: fields.login, password: 'wrong-password' });
  } catch (error) {
    wrong = error;
  }
  assert.equal(missing.status, 401);
  assert.equal(wrong.status, 401);
  assert.equal(missing.message, wrong.message);
});

test('duplicate registration and weak passwords are rejected', async () => {
  await demoAuth.register(fields);
  await assert.rejects(
    demoAuth.register({ ...fields, email: 'another@example.com' }),
    /already in use/,
  );
  await assert.rejects(demoAuth.register({ ...fields, login: 'different' }), /already in use/);
  await assert.rejects(
    demoAuth.register({ ...fields, login: 'weak', email: 'weak@example.com', password: 'short' }),
    /at least 8/,
  );
});

test('workspace changes persist and remain isolated between accounts', async () => {
  const user = await demoAuth.register(fields);
  const other = await demoAuth.register({
    ...fields,
    login: 'second',
    email: 'second@example.com',
  });
  const originalCount = (await demoWorkspace.load(other.id)).decks.length;
  const deck = await demoWorkspace.createDeck(user.id, {
    title: 'My lab deck',
    description: 'Practice',
    courseId: null,
  });
  const card = await demoWorkspace.addCard(user.id, deck.id, {
    front: 'What is React?',
    back: 'A UI library.',
  });
  assert.equal(
    (await demoWorkspace.load(user.id)).decks.find((item) => item.id === deck.id).cardCount,
    1,
  );
  assert.equal((await demoWorkspace.getCards(user.id, deck.id))[0].back, 'A UI library.');
  assert.equal((await demoWorkspace.load(other.id)).decks.length, originalCount);
  const session = await demoWorkspace.recordSession(user.id, {
    deckId: deck.id,
    startedAt: new Date().toISOString(),
    endedAt: new Date().toISOString(),
    cardsReviewed: 1,
    cardsCorrect: 1,
  });
  assert.equal((await demoWorkspace.load(user.id)).sessions[0].id, session.id);
  assert.equal((await demoWorkspace.load(other.id)).sessions.length, 0);
  await demoWorkspace.deleteCard(user.id, deck.id, card.id);
  assert.equal((await demoWorkspace.getCards(user.id, deck.id)).length, 0);
  await demoWorkspace.deleteDeck(user.id, deck.id);
  assert.ok(!(await demoWorkspace.load(user.id)).decks.some((item) => item.id === deck.id));
});

test('search, course filtering, and sorting compose without changing the source order', () => {
  const decks = [
    { id: 1, title: 'Zebra', description: 'MERN', courseId: 'cop', cardCount: 2 },
    { id: 2, title: 'Alpha', description: 'MERN', courseId: 'cop', cardCount: 5 },
    { id: 3, title: 'Other', description: 'MERN', courseId: 'cda', cardCount: 9 },
  ];
  assert.deepEqual(
    filterDecks(decks, { query: ' mern ', courseId: 'cop', sort: 'cards' }).map((item) => item.id),
    [2, 1],
  );
  assert.deepEqual(
    decks.map((item) => item.id),
    [1, 2, 3],
  );
  assert.equal(filterDecks(decks, { query: 'no match' }).length, 0);
});

test('the API client propagates authentication failures and reports non-JSON or network failures', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: 'private account detail' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    await assert.rejects(
      request('/api/auth/login'),
      (error) =>
        error instanceof ServiceError &&
        error.status === 401 &&
        !error.message.includes('private account detail'),
    );
    globalThis.fetch = async () => new Response('<html>proxy error</html>', { status: 502 });
    await assert.rejects(request('/api/decks'), /unexpected response/);
    globalThis.fetch = async () => {
      throw new TypeError('Failed to fetch');
    };
    await assert.rejects(request('/api/decks'), /could not reach the server/);
    globalThis.fetch = async () => new Response(null, { status: 204 });
    assert.equal(await request('/api/decks/1', { method: 'DELETE' }), undefined);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('course-style API login failures always use the generic error-page status', async () => {
  const originalFetch = globalThis.fetch;
  const isGenericFailure = (error) =>
    error instanceof ServiceError &&
    error.status === 401 &&
    error.message === LOGIN_FAILURE_MESSAGE;
  try {
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: 'User does not exist' }), { status: 200 });
    await assert.rejects(
      request('/api/auth/login', { method: 'POST', body: {}, applicationErrorStatus: 401 }),
      isGenericFailure,
    );
    globalThis.fetch = async () =>
      new Response(JSON.stringify({ error: 'Password is incorrect' }), { status: 403 });
    await assert.rejects(
      request('/api/auth/login', { method: 'POST', body: {}, applicationErrorStatus: 401 }),
      isGenericFailure,
    );
    globalThis.fetch = async () => new Response(null, { status: 403 });
    await assert.rejects(
      request('/api/auth/login', { method: 'POST', body: {}, applicationErrorStatus: 401 }),
      isGenericFailure,
    );
    for (const reply of [
      { id: -1, error: '' },
      { id: 0 },
      { success: false },
      { user: { id: -1 } },
    ])
      assert.throws(() => normalizeLoginResponse(reply), isGenericFailure);
    const valid = normalizeLoginResponse({
      user: { _id: '507f1f77bcf86cd799439011', firstName: 'Test' },
    });
    assert.equal(valid.user.id, '507f1f77bcf86cd799439011');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
