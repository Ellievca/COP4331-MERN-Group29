import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { HttpError } from './errors.js';
import { schemas, validate } from './validation.js';

export const LOGIN_FAILURE = 'Login failed. Please check your credentials and try again.';
const tokenHash = (token) => createHash('sha256').update(token).digest('hex');
export const publicUser = (user) => ({
  id: user._id.toString(),
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  login: user.login,
  role: user.role || 'user',
  isVerified: user.isVerified === true,
  isActive: user.isActive !== false,
});
export const cookieOptions = (config) => ({
  httpOnly: true,
  secure: config.production,
  sameSite: 'lax',
  path: '/api',
  maxAge: config.sessionMilliseconds,
});

export function authentication(db, config) {
  return async (req, res, next) => {
    const token = req.cookies[config.cookieName];
    if (!token || typeof token !== 'string' || token.length > 256)
      throw new HttpError(401, 'Please sign in to continue.', 'unauthorized');
    const session = await db
      .collection('AuthSessions')
      .findOne({ _id: tokenHash(token), expiresAt: { $gt: new Date() } });
    if (!session) throw new HttpError(401, 'Please sign in to continue.', 'unauthorized');
    const user = await db
      .collection('Users')
      .findOne({ _id: session.userId, isActive: { $ne: false } });
    if (!user) throw new HttpError(401, 'Please sign in to continue.', 'unauthorized');
    req.auth = { user, session };
    next();
  };
}

export function csrf(req, res, next) {
  const supplied = req.get('X-CSRF-Token');
  const expected = req.auth.session.csrfToken;
  if (
    !supplied ||
    !/^[A-Za-z\d_-]{43}$/.test(supplied) ||
    supplied.length !== expected.length ||
    !timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  )
    throw new HttpError(
      403,
      'Your session could not be verified. Refresh the page and try again.',
      'csrf_failed',
    );
  next();
}
export function requireAdmin(req, res, next) {
  if (req.auth.user.role !== 'admin')
    throw new HttpError(403, 'Administrator access is required.', 'forbidden');
  next();
}

export async function authRoutes(db, config) {
  const router = Router();
  const dummyHash = await bcrypt.hash(randomBytes(32).toString('hex'), 12);
  router.post('/register', async (req, res) => {
    const fields = validate(schemas.register, req.body);
    const now = new Date();
    const user = {
      ...fields,
      passwordHash: await bcrypt.hash(fields.password, 12),
      isVerified: false,
      role: 'user',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };
    delete user.password;
    const result = await db.collection('Users').insertOne(user);
    user._id = result.insertedId;
    res.status(201).json({ user: publicUser(user) });
  });
  router.post('/login', async (req, res) => {
    const fields = validate(schemas.login, req.body);
    const user = await db
      .collection('Users')
      .findOne({ $or: [{ login: fields.login }, { email: fields.login }] });
    const passwordValid = await bcrypt.compare(fields.password, user?.passwordHash || dummyHash);
    if (
      !user ||
      !passwordValid ||
      user.isActive === false ||
      Buffer.byteLength(fields.password, 'utf8') > 72
    )
      throw new HttpError(401, LOGIN_FAILURE, 'invalid_credentials');
    // Rotate a previous session rather than retaining the old cookie after login.
    if (req.cookies[config.cookieName])
      await db
        .collection('AuthSessions')
        .deleteOne({ _id: tokenHash(req.cookies[config.cookieName]) });
    const token = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(32).toString('base64url');
    const session = {
      _id: tokenHash(token),
      userId: user._id,
      csrfToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + config.sessionMilliseconds),
    };
    await db.collection('AuthSessions').insertOne(session);
    res.cookie(config.cookieName, token, cookieOptions(config));
    res.json({ user: publicUser(user), csrfToken });
  });
  router.get('/me', authentication(db, config), (req, res) =>
    res.json({ user: publicUser(req.auth.user), csrfToken: req.auth.session.csrfToken }),
  );
  router.post('/logout', authentication(db, config), csrf, async (req, res) => {
    await db.collection('AuthSessions').deleteOne({ _id: req.auth.session._id });
    const { maxAge, ...options } = cookieOptions(config);
    res.clearCookie(config.cookieName, options);
    res.status(204).end();
  });
  return router;
}
