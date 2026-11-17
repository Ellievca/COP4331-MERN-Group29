import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { mkdtemp, writeFile, unlink, rmdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MongoMemoryServer } from 'mongodb-memory-server-core';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createApp } from '../src/app.js';
import { readConfig } from '../src/config.js';
import { connectDatabase, ensureDatabase } from '../src/database.js';
import { cookieOptions, LOGIN_FAILURE } from '../src/auth.js';

let mongo, client, db, app, config;
const origin = 'http://127.0.0.1:5173';
const account = {
  firstName: 'Lab',
  lastName: 'Student',
  email: 'student@example.com',
  login: 'student',
  password: 'PracticeLab123!',
};
before(async () => {
  mongo = await MongoMemoryServer.create({
    binary: { version: '8.0.17' },
    instance: { ip: '127.0.0.1' },
  });
  config = readConfig({
    NODE_ENV: 'test',
    MONGODB_URI: mongo.getUri(),
    MONGODB_DB_NAME: `StudySync_test_${process.pid}`,
    APP_ORIGIN: origin,
  });
  ({ client, db } = await connectDatabase(config));
  app = await createApp({ db, config });
});
beforeEach(async () => {
  // Only this test-owned, temporary MongoDB instance is cleared.
  for (const name of [
    'Users',
    'Courses',
    'Decks',
    'Cards',
    'StudySessions',
    'AuthSessions',
    'EmailChallenges',
    'ResetGrants',
    'GoogleChallenges',
    'CardProgress',
    'CardImages',
  ])
    await db.collection(name).deleteMany({});
});
after(async () => {
  await client?.close();
  await mongo?.stop();
});

async function signUp(overrides = {}) {
  const agent = request.agent(app);
  const fields = { ...account, ...overrides };
  const registration = await agent
    .post('/api/auth/register')
    .set('Origin', origin)
    .send(fields)
    .expect(201);
  const login = await agent
    .post('/api/auth/login')
    .set('Origin', origin)
    .send({ login: fields.login, password: fields.password })
    .expect(200);
  return {
    agent,
    user: registration.body.user,
    csrf: login.body.csrfToken,
    cookie: login.headers['set-cookie'][0].split(';')[0],
  };
}
function write(who, method, path, body) {
  const operation = who.agent[method](path).set('Origin', origin).set('X-CSRF-Token', who.csrf);
  return body === undefined ? operation : operation.send(body);
}
async function newDeck(who, extra = {}) {
  const result = await write(who, 'post', '/api/decks', {
    title: 'Lab deck',
    description: 'Integration test',
    courseId: null,
    ...extra,
  }).expect(201);
  return result.body;
}

test('registration, new-user login, and cookie sessions persist real MongoDB records without exposing password hashes', async () => {
  const who = await signUp();
  const stored = await db.collection('Users').findOne({ login: 'student' });
  assert.equal(stored.password, undefined);
  assert.ok(await bcrypt.compare(account.password, stored.passwordHash));
  assert.notEqual(stored.passwordHash, account.password);
  assert.ok(stored.createdAt instanceof Date);
  assert.equal(stored.role, 'user');
  assert.equal(stored.isVerified, false);
  assert.equal(who.user.passwordHash, undefined);
  const me = await who.agent.get('/api/auth/me').expect(200);
  assert.equal(me.body.user.id, who.user.id);
  assert.equal(me.body.csrfToken, who.csrf);
  const session = await db.collection('AuthSessions').findOne();
  assert.notEqual(session._id, who.cookie.split('=')[1]);
  const login = await who.agent
    .post('/api/auth/login')
    .set('Origin', origin)
    .send({ login: account.email, password: account.password })
    .expect(200);
  assert.match(login.headers['set-cookie'][0], /HttpOnly/);
  assert.match(login.headers['set-cookie'][0], /SameSite=Lax/);
  assert.equal(
    await db.collection('AuthSessions').countDocuments(),
    1,
    'login rotates the existing session',
  );
});

test('wrong-password and missing-user logins both produce the same generic failure', async () => {
  await signUp();
  const wrong = await request(app)
    .post('/api/auth/login')
    .send({ login: 'student', password: 'WrongPass123!' })
    .expect(401);
  const missing = await request(app)
    .post('/api/auth/login')
    .send({ login: 'missing', password: account.password })
    .expect(401);
  assert.deepEqual(wrong.body, missing.body);
  assert.equal(wrong.body.error, LOGIN_FAILURE);
});

test('registration prevents duplicate identities, role escalation, weak passwords, and query-object injection', async () => {
  await signUp();
  await request(app)
    .post('/api/auth/register')
    .send({ ...account, login: 'STUDENT', email: 'other@example.com' })
    .expect(409);
  await request(app)
    .post('/api/auth/register')
    .send({ ...account, login: 'other', email: 'STUDENT@EXAMPLE.COM' })
    .expect(409);
  await request(app)
    .post('/api/auth/register')
    .send({ ...account, login: 'admin', email: 'admin@example.com', role: 'admin' })
    .expect(400);
  await request(app)
    .post('/api/auth/register')
    .send({ ...account, password: 'short' })
    .expect(400);
  await request(app)
    .post('/api/auth/login')
    .send({ login: { $ne: null }, password: account.password })
    .expect(400);
});

test('authenticated writes require CSRF protection and reject foreign origins', async () => {
  const who = await signUp();
  await request(app).get('/api/decks').expect(401);
  await who.agent.post('/api/decks').send({ title: 'No CSRF' }).expect(403);
  await who.agent
    .post('/api/decks')
    .set('X-CSRF-Token', 'bad')
    .send({ title: 'Bad CSRF' })
    .expect(403);
  await who.agent
    .post('/api/decks')
    .set('Origin', 'https://untrusted.example')
    .set('X-CSRF-Token', who.csrf)
    .send({ title: 'Foreign origin' })
    .expect(403);
  await newDeck(who);
});

test('courses, decks, and cards support validated CRUD, accurate counts, and preserved patch fields', async () => {
  const who = await signUp();
  const course = (
    await write(who, 'post', '/api/courses', {
      name: 'Software Engineering',
      code: 'COP4331',
      color: 'purple',
    }).expect(201)
  ).body;
  const updatedCourse = (
    await write(who, 'patch', `/api/courses/${course.id}`, {
      name: 'Software Engineering 2',
    }).expect(200)
  ).body;
  assert.equal(updatedCourse.code, 'COP4331');
  const deck = await newDeck(who, { courseId: course.id });
  const changed = (
    await write(who, 'patch', `/api/decks/${deck.id}`, { title: 'Renamed deck' }).expect(200)
  ).body;
  assert.equal(changed.courseId, course.id);
  assert.equal(changed.description, 'Integration test');
  await write(who, 'delete', `/api/courses/${course.id}`).expect(409);
  const card = (
    await write(who, 'post', `/api/decks/${deck.id}/cards`, {
      front: 'Question',
      back: 'Answer',
    }).expect(201)
  ).body;
  const patched = (
    await write(who, 'patch', `/api/decks/${deck.id}/cards/${card.id}`, {
      front: 'Updated question',
    }).expect(200)
  ).body;
  assert.equal(patched.back, 'Answer');
  assert.equal((await who.agent.get(`/api/decks/${deck.id}`).expect(200)).body.cardCount, 1);
  assert.equal(
    (await who.agent.get(`/api/decks/${deck.id}/cards`).expect(200)).body[0].front,
    'Updated question',
  );
  await write(who, 'delete', `/api/decks/${deck.id}/cards/${card.id}`).expect(204);
  assert.equal((await who.agent.get(`/api/decks/${deck.id}`).expect(200)).body.cardCount, 0);
  await write(who, 'delete', `/api/decks/${deck.id}`).expect(204);
  await who.agent.get(`/api/decks/${deck.id}`).expect(404);
  await write(who, 'delete', `/api/courses/${course.id}`).expect(204);
});

test('one account cannot read or modify another account’s courses, decks, cards, or sessions', async () => {
  const owner = await signUp();
  const outsider = await signUp({ login: 'outsider', email: 'outsider@example.com' });
  const course = (
    await write(owner, 'post', '/api/courses', { name: 'Private course' }).expect(201)
  ).body;
  const deck = await newDeck(owner, { courseId: course.id });
  const card = (
    await write(owner, 'post', `/api/decks/${deck.id}/cards`, {
      front: 'Private question',
      back: 'Private answer',
    }).expect(201)
  ).body;
  assert.deepEqual((await outsider.agent.get('/api/decks').expect(200)).body, []);
  assert.deepEqual((await outsider.agent.get('/api/courses').expect(200)).body, []);
  await outsider.agent.get(`/api/decks/${deck.id}`).expect(404);
  await outsider.agent.get(`/api/decks/${deck.id}/cards`).expect(404);
  await write(outsider, 'patch', `/api/decks/${deck.id}`, { title: 'Hijacked' }).expect(404);
  await write(outsider, 'delete', `/api/decks/${deck.id}`).expect(404);
  await write(outsider, 'delete', `/api/decks/${deck.id}/cards/${card.id}`).expect(404);
  await write(outsider, 'patch', `/api/courses/${course.id}`, { name: 'Hijacked' }).expect(404);
  await newDeck(outsider, { courseId: null });
  await write(outsider, 'post', '/api/decks', {
    title: 'Foreign course',
    courseId: course.id,
  }).expect(404);
  await write(owner, 'patch', `/api/decks/${deck.id}`, { userId: outsider.user.id }).expect(400);
});

test('study sessions persist, reject inconsistent totals, and remain idempotent across retries', async () => {
  const who = await signUp();
  const deck = await newDeck(who);
  await write(who, 'post', `/api/decks/${deck.id}/cards`, {
    front: 'Question',
    back: 'Answer',
  }).expect(201);
  const record = {
    deckId: deck.id,
    courseId: null,
    deckTitle: 'Spoofed title',
    clientSessionId: randomUUID(),
    startedAt: new Date(Date.now() - 1000).toISOString(),
    endedAt: new Date().toISOString(),
    cardsReviewed: 1,
    cardsCorrect: 1,
  };
  const first = (await write(who, 'post', '/api/study-sessions', record).expect(201)).body;
  const second = (await write(who, 'post', '/api/study-sessions', record).expect(201)).body;
  assert.equal(first.id, second.id);
  assert.equal(first.deckTitle, deck.title);
  assert.equal((await who.agent.get('/api/study-sessions').expect(200)).body.length, 1);
  await write(who, 'post', '/api/study-sessions', { ...record, cardsCorrect: 2 }).expect(400);
  await write(who, 'post', '/api/study-sessions', { ...record, cardsReviewed: 2 }).expect(400);
  await write(who, 'post', '/api/study-sessions', {
    ...record,
    endedAt: '2000-01-01T00:00:00.000Z',
  }).expect(400);
  await write(who, 'delete', `/api/decks/${deck.id}`).expect(204);
  assert.equal(
    (await who.agent.get('/api/study-sessions').expect(200)).body[0].deckTitle,
    deck.title,
    'history survives removal of the deck',
  );
});

test('logout and expired sessions revoke access before the TTL cleanup runs', async () => {
  const who = await signUp();
  await write(who, 'post', '/api/auth/logout').expect(204);
  await request(app).get('/api/auth/me').set('Cookie', who.cookie).expect(401);
  const fresh = await who.agent
    .post('/api/auth/login')
    .send({ login: account.login, password: account.password })
    .expect(200);
  assert.ok(fresh.body.csrfToken);
  await db.collection('AuthSessions').updateMany({}, { $set: { expiresAt: new Date(0) } });
  await who.agent.get('/api/auth/me').expect(401);
});

test('admin routes deny regular users and disabling an account invalidates its sessions', async () => {
  const admin = await signUp();
  const student = await signUp({ login: 'other', email: 'other@example.com' });
  await student.agent.get('/api/admin/users').expect(403);
  await student.agent.get('/api/admin/stats').expect(403);
  await db.collection('Users').updateOne({ login: account.login }, { $set: { role: 'admin' } });
  const users = (await admin.agent.get('/api/admin/users').expect(200)).body;
  assert.equal(users.length, 2);
  assert.ok(users.every((user) => !user.passwordHash && !user.password));
  assert.equal((await admin.agent.get('/api/admin/stats').expect(200)).body.users, 2);
  await write(admin, 'patch', `/api/admin/users/${student.user.id}/activation`, {
    isActive: false,
  }).expect(200);
  await student.agent.get('/api/auth/me').expect(401);
  await student.agent
    .post('/api/auth/login')
    .send({ login: 'other', password: account.password })
    .expect(401);
  await write(admin, 'patch', `/api/admin/users/${admin.user.id}/activation`, {
    isActive: false,
  }).expect(409);
  await write(admin, 'patch', `/api/admin/users/${student.user.id}/activation`, {
    isActive: true,
  }).expect(200);
  await student.agent
    .post('/api/auth/login')
    .send({ login: 'other', password: account.password })
    .expect(200);
});

test('database setup is repeatable without resetting accounts and creates the required unique and TTL indexes', async () => {
  await signUp();
  await ensureDatabase(db);
  assert.equal(await db.collection('Users').countDocuments(), 1);
  const indexes = await db.collection('AuthSessions').listIndexes().toArray();
  assert.equal(indexes.find((index) => index.key.expiresAt).expireAfterSeconds, 0);
  const users = await db.collection('Users').listIndexes().toArray();
  assert.equal(users.find((index) => index.key.login).unique, true);
});

test('malformed IDs and JSON produce safe errors and health checks confirm MongoDB connectivity', async () => {
  const who = await signUp();
  await who.agent.get('/api/decks/not-an-id').expect(400);
  const malformed = await request(app)
    .post('/api/auth/login')
    .set('Content-Type', 'application/json')
    .send('{broken')
    .expect(400);
  assert.equal(malformed.body.code, 'invalid_json');
  assert.equal(malformed.body.stack, undefined);
  assert.deepEqual((await request(app).get('/api/health').expect(200)).body, {
    status: 'ok',
    database: 'connected',
  });
});

test('production configuration requires an HTTPS domain and secure session cookies', () => {
  const env = { NODE_ENV: 'production', MONGODB_URI: 'mongodb://127.0.0.1:27019' };
  assert.throws(() => readConfig({ ...env, APP_ORIGIN: 'http://example.com' }), /HTTPS domain/);
  assert.throws(() => readConfig({ ...env, APP_ORIGIN: 'https://198.199.87.74' }), /HTTPS domain/);
  const production = readConfig({
    ...env,
    APP_ORIGIN: 'https://studysync.example.com',
    TRUST_PROXY: '1',
  });
  assert.equal(cookieOptions(production).secure, true);
  assert.equal(cookieOptions(production).httpOnly, true);
  assert.equal(production.trustProxy, 1);
});

test('authentication rate limiting rejects repeated registration attempts', async () => {
  const limited = await createApp({ db, config: { ...config, rateLimits: true } });
  for (let i = 0; i < 20; i++)
    await request(limited).post('/api/auth/register').send({}).expect(400);
  await request(limited).post('/api/auth/register').send({}).expect(429);
});

test('the built React SPA is served for direct links and refreshes', async (t) => {
  const frontendPath = await mkdtemp(join(tmpdir(), '.studysync-static-test-'));
  const indexPath = join(frontendPath, 'index.html');
  await writeFile(
    indexPath,
    '<!doctype html><html><body><div id="root">StudySync test</div></body></html>',
  );
  t.after(async () => {
    await unlink(indexPath);
    await rmdir(frontendPath);
  });
  let captured;
  const serving = await createApp({
    db,
    config,
    frontendPath,
    onError: (error) => {
      captured = error;
    },
  });
  const response = await request(serving).get('/app/decks');
  assert.equal(response.status, 200, captured?.message);
  assert.match(response.text, /StudySync test/);
  assert.match(response.headers['content-type'], /text\/html/);
});

async function accountApp(required = true) {
  const inbox = [];
  let googlePayload;
  const featureConfig = {
    ...config,
    mailMode: 'file',
    verificationRequired: required,
    googleClientId: 'test-client.apps.googleusercontent.com',
  };
  const featureApp = await createApp({
    db,
    config: featureConfig,
    sendMail: async (message) => {
      inbox.push(message);
    },
    googleVerifier: async (credential) => {
      if (credential !== 'test-signed-credential') throw new Error('Invalid signature');
      return googlePayload;
    },
  });
  return {
    app: featureApp,
    inbox,
    setGoogle: (value) => {
      googlePayload = value;
    },
  };
}
const lastCode = (inbox) => inbox.at(-1).text.match(/\b\d{6}\b/)[0];

test('verification requires a purpose-bound single-use code and registration never returns it', async () => {
  const feature = await accountApp();
  const agent = request.agent(feature.app);
  const registration = await agent.post('/api/auth/register').send(account).expect(201);
  assert.equal(registration.body.verificationRequired, true);
  assert.equal(registration.body.code, undefined);
  assert.equal(feature.inbox.length, 1);
  const code = lastCode(feature.inbox);
  const stored = await db.collection('EmailChallenges').findOne();
  assert.equal(stored.code, undefined);
  assert.notEqual(stored.digest, code);
  await agent
    .post('/api/auth/login')
    .send({ login: account.login, password: account.password })
    .expect(409);
  await agent.post('/api/auth/password/verify').send({ email: account.email, code }).expect(400);
  await agent.post('/api/auth/email/verify').send({ email: account.email, code }).expect(200);
  await agent.post('/api/auth/email/verify').send({ email: account.email, code }).expect(400);
  assert.equal(
    (
      await agent
        .post('/api/auth/login')
        .send({ login: account.login, password: account.password })
        .expect(200)
    ).body.user.isVerified,
    true,
  );
});

test('email codes enforce attempt limits, resend cooldown, replacement, and expiry', async () => {
  const feature = await accountApp();
  await request(feature.app).post('/api/auth/register').send(account).expect(201);
  const code = lastCode(feature.inbox),
    wrong = code === '000000' ? '111111' : '000000';
  const existing = await request(feature.app)
    .post('/api/auth/email/request')
    .send({ email: account.email, purpose: 'verify' })
    .expect(200);
  const unknown = await request(feature.app)
    .post('/api/auth/email/request')
    .send({ email: 'unknown@example.com', purpose: 'verify' })
    .expect(200);
  assert.deepEqual(existing.body, unknown.body);
  assert.equal(feature.inbox.length, 1);
  for (let i = 0; i < 5; i++)
    await request(feature.app)
      .post('/api/auth/email/verify')
      .send({ email: account.email, code: wrong })
      .expect(400);
  await request(feature.app)
    .post('/api/auth/email/verify')
    .send({ email: account.email, code })
    .expect(400);
  await db.collection('EmailChallenges').updateMany({}, { $set: { resendAt: new Date(0) } });
  await request(feature.app)
    .post('/api/auth/email/request')
    .send({ email: account.email, purpose: 'verify' })
    .expect(200);
  assert.equal(feature.inbox.length, 2);
  await db.collection('EmailChallenges').updateMany({}, { $set: { expiresAt: new Date(0) } });
  await request(feature.app)
    .post('/api/auth/email/verify')
    .send({ email: account.email, code: lastCode(feature.inbox) })
    .expect(400);
});

test('password recovery verifies email, revokes every old session, and rejects grant replay', async () => {
  const who = await signUp();
  const feature = await accountApp(false);
  await request(feature.app)
    .post('/api/auth/email/request')
    .send({ email: account.email, purpose: 'reset' })
    .expect(200);
  assert.equal(feature.inbox.length, 0, 'unverified addresses cannot recover an account');
  await db.collection('Users').updateOne({ login: account.login }, { $set: { isVerified: true } });
  await request(feature.app)
    .post('/api/auth/email/request')
    .send({ email: account.email, purpose: 'reset' })
    .expect(200);
  const code = lastCode(feature.inbox);
  const grant = (
    await request(feature.app)
      .post('/api/auth/password/verify')
      .send({ email: account.email, code })
      .expect(200)
  ).body.resetToken;
  await request(feature.app)
    .post('/api/auth/password/verify')
    .send({ email: account.email, code })
    .expect(400);
  await request(feature.app)
    .post('/api/auth/password/reset')
    .send({ resetToken: grant, password: 'short' })
    .expect(400);
  await request(feature.app)
    .post('/api/auth/password/reset')
    .send({ resetToken: grant, password: 'ReplacementPassword123!' })
    .expect(200);
  await who.agent.get('/api/auth/me').expect(401);
  await request(feature.app)
    .post('/api/auth/password/reset')
    .send({ resetToken: grant, password: 'DifferentPassword123!' })
    .expect(400);
  await request(feature.app)
    .post('/api/auth/login')
    .send({ login: account.login, password: account.password })
    .expect(401);
  await request(feature.app)
    .post('/api/auth/login')
    .send({ login: account.login, password: 'ReplacementPassword123!' })
    .expect(200);
  assert.equal(feature.inbox.at(-1).subject, 'Your StudySync password changed');
});

test('Google accounts use verified identities, nonce checks, safe linking, and no fake password', async () => {
  const feature = await accountApp(false),
    agent = request.agent(feature.app);
  const { nonce } = (await agent.get('/api/auth/google/challenge').expect(200)).body;
  feature.setGoogle({
    sub: 'google-new-user',
    email: 'new.google@gmail.com',
    email_verified: true,
    given_name: 'New',
    family_name: 'Student',
    nonce,
  });
  await agent
    .post('/api/auth/google')
    .set('Origin', origin)
    .send({ credential: 'bad-signature' })
    .expect(401);
  const login = await agent
    .post('/api/auth/google')
    .set('Origin', origin)
    .send({ credential: 'test-signed-credential' })
    .expect(200);
  assert.equal(login.body.user.isVerified, true);
  const user = await db.collection('Users').findOne({ googleSubject: 'google-new-user' });
  assert.equal(user.passwordHash, undefined);
  await agent
    .post('/api/auth/google')
    .set('Origin', origin)
    .send({ credential: 'test-signed-credential' })
    .expect(401);
  const challenge = (await agent.get('/api/auth/google/challenge').expect(200)).body;
  feature.setGoogle({
    sub: 'other',
    email: 'other@gmail.com',
    email_verified: true,
    nonce: 'incorrect-nonce',
  });
  await agent
    .post('/api/auth/google')
    .set('Origin', origin)
    .send({ credential: 'test-signed-credential' })
    .expect(401);
  feature.setGoogle({
    sub: 'other',
    email: 'other@gmail.com',
    email_verified: true,
    nonce: challenge.nonce,
  });
  await agent
    .post('/api/auth/google')
    .set('Origin', 'https://attacker.example')
    .send({ credential: 'test-signed-credential' })
    .expect(403);
  const existing = await signUp();
  const linkingAgent = request.agent(feature.app);
  const next = (await linkingAgent.get('/api/auth/google/challenge').expect(200)).body;
  feature.setGoogle({
    sub: 'existing-account-google',
    email: account.email,
    email_verified: true,
    nonce: next.nonce,
  });
  await linkingAgent
    .post('/api/auth/google')
    .set('Origin', origin)
    .send({ credential: 'test-signed-credential' })
    .expect(409);
  const linkChallenge = await existing.agent.get('/api/auth/google/challenge').expect(503);
  assert.equal(linkChallenge.body.code, 'google_unavailable');
  const authenticated = await linkingAgent
    .post('/api/auth/login')
    .send({ login: account.login, password: account.password })
    .expect(200);
  const linkNonce = (await linkingAgent.get('/api/auth/google/challenge').expect(200)).body.nonce;
  feature.setGoogle({
    sub: 'existing-account-google',
    email: account.email,
    email_verified: true,
    nonce: linkNonce,
  });
  await linkingAgent
    .post('/api/auth/google/link')
    .set('Origin', origin)
    .set('X-CSRF-Token', authenticated.body.csrfToken)
    .send({ credential: 'test-signed-credential' })
    .expect(200);
  assert.equal(
    (await db.collection('Users').findOne({ login: account.login })).googleSubject,
    'existing-account-google',
  );
  assert.equal(await db.collection('Users').countDocuments(), 2);
});

test('FSRS persists per-card reviews once across retries and concurrent requests', async () => {
  const who = await signUp(),
    deck = await newDeck(who);
  const card = (
    await write(who, 'post', `/api/decks/${deck.id}/cards`, { front: 'Q', back: 'A' }).expect(201)
  ).body;
  const queue = (await who.agent.get('/api/reviews').expect(200)).body;
  assert.equal(queue.queue[0].id, card.id);
  const fields = { reviewId: randomUUID(), rating: 3, version: 0 };
  const results = await Promise.all([
    write(who, 'post', `/api/reviews/${card.id}`, fields),
    write(who, 'post', `/api/reviews/${card.id}`, fields),
  ]);
  assert.deepEqual(
    results.map((r) => r.status),
    [200, 200],
  );
  assert.equal(results[0].body.due, results[1].body.due);
  const progress = await db.collection('CardProgress').findOne();
  assert.equal(progress.version, 1);
  assert.equal(progress.history.length, 1);
  assert.equal(progress.schedule.reps, 1);
  await write(who, 'post', `/api/reviews/${card.id}`, { ...fields, rating: 1 }).expect(409);
  await write(who, 'post', `/api/reviews/${card.id}`, { ...fields, reviewId: randomUUID() }).expect(
    409,
  );
  const later = (await who.agent.get('/api/reviews').expect(200)).body;
  assert.equal(later.newCount, 0);
  assert.equal(later.queue.length, 0);
  await db
    .collection('CardProgress')
    .updateMany({}, { $set: { 'schedule.due': new Date(0), 'schedule.lapses': 5 } });
  assert.equal((await who.agent.get('/api/reviews').expect(200)).body.repair.length, 1);
  await write(who, 'patch', `/api/reviews/${card.id}`, { suspended: true }).expect(200);
  assert.equal((await who.agent.get('/api/reviews').expect(200)).body.queue.length, 0);
  await write(who, 'patch', `/api/reviews/${card.id}`, { reset: true, suspended: false }).expect(
    200,
  );
  const reset = (await who.agent.get('/api/reviews').expect(200)).body.queue[0];
  assert.equal(reset.due, null);
  assert.equal(reset.version, 3);
});

test('review settings, course filters, exam plans and daily new-card limits are applied', async () => {
  const who = await signUp(),
    outsider = await signUp({ login: 'second', email: 'second@example.com' });
  const course = (await write(who, 'post', '/api/courses', { name: 'Biology' }).expect(201)).body;
  const deck = await newDeck(who, { courseId: course.id, examDate: '2099-12-15' });
  const card = (
    await write(who, 'post', `/api/decks/${deck.id}/cards`, { front: 'Q', back: 'A' }).expect(201)
  ).body;
  const prefs = {
    retention: 0.9,
    newCardsPerDay: 0,
    timezone: 'America/New_York',
    interleave: true,
  };
  await write(who, 'patch', '/api/reviews/settings', prefs).expect(200);
  const queue = (await who.agent.get('/api/reviews').expect(200)).body;
  assert.equal(queue.queue.length, 0);
  assert.equal(queue.newCount, 1);
  assert.equal(queue.plans.length, 1);
  await write(who, 'patch', '/api/reviews/settings', { ...prefs, retention: 0.999 }).expect(400);
  await write(who, 'patch', '/api/reviews/settings', { ...prefs, timezone: 'bad-timezone' }).expect(
    400,
  );
  await write(outsider, 'post', `/api/reviews/${card.id}`, {
    reviewId: randomUUID(),
    rating: 3,
    version: 0,
  }).expect(404);
  await write(outsider, 'patch', `/api/reviews/${card.id}`, { suspended: true }).expect(404);
  assert.equal((await outsider.agent.get('/api/reviews').expect(200)).body.queue.length, 0);
  assert.equal(
    (await who.agent.get(`/api/reviews?courseId=${outsider.user.id}`).expect(200)).body.queue
      .length,
    0,
  );
});

test('diagram images and new card formats are validated and private', async () => {
  const who = await signUp(),
    other = await signUp({ login: 'image-other', email: 'image-other@example.com' }),
    deck = await newDeck(who);
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jvWQAAAAASUVORK5CYII=',
    'base64',
  );
  const image = (
    await who.agent
      .post('/api/card-images')
      .set('Origin', origin)
      .set('X-CSRF-Token', who.csrf)
      .set('Content-Type', 'image/png')
      .send(png)
      .expect(201)
  ).body;
  assert.equal(
    (await who.agent.get(`/api/card-images/${image.id}`).expect(200)).headers['content-type'],
    'image/png',
  );
  await other.agent.get(`/api/card-images/${image.id}`).expect(404);
  await who.agent
    .post('/api/card-images')
    .set('X-CSRF-Token', who.csrf)
    .set('Content-Type', 'image/png')
    .send(Buffer.from('invalid-image-content'))
    .expect(400);
  await write(who, 'post', `/api/decks/${deck.id}/cards`, {
    front: 'Diagram',
    back: 'Label',
    kind: 'diagram',
    imageId: image.id,
    masks: [{ x: 10, y: 10, width: 20, height: 20 }],
  }).expect(201);
  await write(who, 'post', `/api/decks/${deck.id}/cards`, {
    front: 'Diagram',
    back: 'Label',
    kind: 'diagram',
    imageId: image.id,
    masks: [{ x: 90, y: 10, width: 20, height: 20 }],
  }).expect(400);
  await write(who, 'post', `/api/decks/${deck.id}/cards`, {
    front: 'No blank',
    back: 'Answer',
    kind: 'cloze',
  }).expect(400);
  await write(who, 'post', `/api/decks/${deck.id}/cards`, {
    front: 'React uses {{c1::components}}.',
    back: 'UI units',
    kind: 'cloze',
  }).expect(201);
  await write(who, 'post', `/api/decks/${deck.id}/cards`, {
    front: 'When would you normalize data?',
    back: 'When duplication causes inconsistency.',
    kind: 'application',
    explanation: 'Consider updating duplicate records.',
  }).expect(201);
});
