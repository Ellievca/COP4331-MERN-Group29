import { Router } from 'express';
import { OAuth2Client } from 'google-auth-library';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { validate, schemas } from './validation.js';
import { HttpError } from './errors.js';
import { issueChallenge, consumeChallenge, digest } from './challenges.js';
import { mailAvailable, deliverMail } from './mail.js';
import { authentication, csrf, publicUser, createSession, cookieOptions } from './auth.js';

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const codeSchema = z.string().regex(/^\d{6}$/);
const generic = {
  message: 'If this address is eligible, a code will be sent. Check your inbox and spam folder.',
};
const invalid = () =>
  new HttpError(
    400,
    'The code is incorrect or expired. Request a new code if needed.',
    'invalid_code',
  );

export function accountRoutes(
  db,
  config,
  { sendMail = (message) => deliverMail(config, message), googleVerifier } = {},
) {
  const router = Router(),
    users = db.collection('Users');
  const client = new OAuth2Client(config.googleClientId);
  const verifyGoogle =
    googleVerifier ||
    (async (credential) =>
      (
        await client.verifyIdToken({ idToken: credential, audience: config.googleClientId })
      ).getPayload());
  router.get('/options', (req, res) =>
    res.json({
      googleClientId: config.googleAccountsReady === false ? null : config.googleClientId || null,
      googleSetupPending: Boolean(config.googleClientId) && config.googleAccountsReady === false,
      emailAvailable: mailAvailable(config),
      verificationRequired: config.verificationRequired,
    }),
  );
  router.post('/email/request', async (req, res) => {
    const { email, purpose } = validate(
      z.object({ email: emailSchema, purpose: z.enum(['verify', 'reset']) }).strict(),
      req.body,
    );
    if (!mailAvailable(config))
      throw new HttpError(503, 'Email delivery has not been configured yet.', 'mail_unavailable');
    const user = await users.findOne({ email, isActive: { $ne: false } });
    if (
      user &&
      ((purpose === 'verify' && !user.isVerified) ||
        (purpose === 'reset' && user.isVerified && user.passwordHash))
    ) {
      try {
        await issueChallenge(db, config, user, purpose, sendMail);
      } catch {
        console.error('StudySync account email delivery failed.');
      }
    }
    res.json(generic);
  });
  router.post('/email/verify', async (req, res) => {
    const { email, code } = validate(
      z.object({ email: emailSchema, code: codeSchema }).strict(),
      req.body,
    );
    const user = await users.findOne({ email, isActive: { $ne: false } });
    if (!user) throw invalid();
    await consumeChallenge(db, config, user, 'verify', code);
    await users.updateOne({ _id: user._id }, { $set: { isVerified: true, updatedAt: new Date() } });
    res.json({ message: 'Email verified. You can sign in.' });
  });
  router.post('/password/verify', async (req, res) => {
    const { email, code } = validate(
      z.object({ email: emailSchema, code: codeSchema }).strict(),
      req.body,
    );
    const user = await users.findOne({ email, isVerified: true, isActive: { $ne: false } });
    if (!user || !user.passwordHash) throw invalid();
    await consumeChallenge(db, config, user, 'reset', code);
    const token = randomBytes(32).toString('base64url');
    await db.collection('ResetGrants').insertOne({
      _id: digest(token),
      userId: user._id,
      authVersion: user.authVersion || 0,
      expiresAt: new Date(Date.now() + 5 * 60000),
    });
    res.json({ resetToken: token });
  });
  router.post('/password/reset', async (req, res) => {
    const { resetToken, password } = validate(
      z
        .object({
          resetToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
          password: schemas.register.shape.password,
        })
        .strict(),
      req.body,
    );
    const grant = await db
      .collection('ResetGrants')
      .findOne({ _id: digest(resetToken), expiresAt: { $gt: new Date() } });
    if (!grant) throw invalid();
    const passwordHash = await bcrypt.hash(password, 12);
    if (
      !(
        await db
          .collection('ResetGrants')
          .deleteOne({ _id: digest(resetToken), expiresAt: { $gt: new Date() } })
      ).deletedCount
    )
      throw invalid();
    const versionMatch =
      grant.authVersion === 0
        ? { $or: [{ authVersion: 0 }, { authVersion: { $exists: false } }] }
        : { authVersion: grant.authVersion };
    const updated = await users.updateOne(
      { _id: grant.userId, ...versionMatch, isActive: { $ne: false }, isVerified: true },
      { $set: { passwordHash, updatedAt: new Date() }, $inc: { authVersion: 1 } },
    );
    if (!updated.modifiedCount) throw invalid();
    await Promise.all(
      ['AuthSessions', 'EmailChallenges', 'ResetGrants'].map((name) =>
        db.collection(name).deleteMany({ userId: grant.userId }),
      ),
    );
    const { maxAge, ...options } = cookieOptions(config);
    res.clearCookie(config.cookieName, options);
    const notifiedUser = await users.findOne({ _id: grant.userId });
    try {
      await sendMail({
        to: notifiedUser.email,
        subject: 'Your StudySync password changed',
        text: 'Your StudySync password was reset. If you did not request this, recover your account and contact your StudySync administrator.',
      });
    } catch {
      /* Password was changed; notification failure must not undo it. */
    }
    res.json({ message: 'Password updated. Sign in with your new password.' });
  });
  router.get('/google/challenge', async (req, res) => {
    if (!config.googleClientId || config.googleAccountsReady === false)
      throw new HttpError(503, 'Google sign-in is not configured yet.', 'google_unavailable');
    const nonce = randomBytes(32).toString('base64url');
    const existingBrowser = req.cookies['studysync.google'];
    const browser = /^[A-Za-z0-9_-]{43}$/.test(existingBrowser || '')
      ? existingBrowser
      : randomBytes(32).toString('base64url');
    await db
      .collection('GoogleChallenges')
      .insertOne({
        _id: digest(nonce),
        browser: digest(browser),
        expiresAt: new Date(Date.now() + 5 * 60000),
      });
    res.cookie('studysync.google', browser, {
      httpOnly: true,
      secure: config.production,
      sameSite: 'strict',
      path: '/api/auth',
      maxAge: 30 * 60000,
    });
    res.json({ nonce });
  });
  async function googleIdentity(req) {
    if (!config.googleClientId || config.googleAccountsReady === false)
      throw new HttpError(503, 'Google sign-in is not configured yet.', 'google_unavailable');
    if (!config.allowedOrigins.includes(req.get('Origin')))
      throw new HttpError(403, 'Start Google sign-in from StudySync.', 'origin_not_allowed');
    const { credential } = validate(
      z.object({ credential: z.string().min(1).max(16000) }).strict(),
      req.body,
    );
    const browser = req.cookies['studysync.google'];
    let payload;
    try {
      payload = await verifyGoogle(credential);
    } catch {
      throw new HttpError(
        401,
        'Google sign-in could not be verified. Please try again.',
        'invalid_google_token',
      );
    }
    if (
      !/^[A-Za-z0-9_-]{43}$/.test(browser || '') ||
      !/^[A-Za-z0-9_-]{43}$/.test(payload?.nonce || '') ||
      !payload.sub ||
      !payload.email ||
      !payload.email_verified
    )
      throw new HttpError(
        401,
        'Google sign-in could not be verified. Please try again.',
        'invalid_google_token',
      );
    if (
      !(
        await db
          .collection('GoogleChallenges')
          .deleteOne({
            _id: digest(payload.nonce),
            browser: digest(browser),
            expiresAt: { $gt: new Date() },
          })
      ).deletedCount
    )
      throw new HttpError(401, 'Google sign-in expired. Please try again.', 'invalid_google_token');
    return payload;
  }
  router.post('/google', async (req, res) => {
    const profile = await googleIdentity(req);
    let user = await users.findOne({ googleSubject: profile.sub });
    if (!user) {
      if (await users.findOne({ email: profile.email.toLowerCase() }))
        throw new HttpError(
          409,
          'An account already uses this email. Sign in with your password, then link Google in Account settings.',
          'link_required',
        );
      const trustedEmail =
        profile.email.toLowerCase().endsWith('@gmail.com') || Boolean(profile.hd);
      user = {
        googleSubject: profile.sub,
        firstName: String(profile.given_name || profile.name || 'Student').slice(0, 60),
        lastName: String(profile.family_name || '').slice(0, 60),
        email: profile.email.toLowerCase(),
        login: `google_${randomBytes(8).toString('hex')}`,
        isVerified: trustedEmail,
        isActive: true,
        role: 'user',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      user._id = (await users.insertOne(user)).insertedId;
    }
    if (user.isActive === false)
      throw new HttpError(401, 'This account is unavailable.', 'unauthorized');
    await createSession(db, config, req, res, user);
  });
  router.post('/google/link', authentication(db, config), csrf, async (req, res) => {
    const profile = await googleIdentity(req);
    if (profile.email.toLowerCase() !== req.auth.user.email)
      throw new HttpError(
        409,
        'Use the Google account with your StudySync email address.',
        'email_mismatch',
      );
    await users.updateOne(
      { _id: req.auth.user._id },
      { $set: { googleSubject: profile.sub, updatedAt: new Date() } },
    );
    res.json({ message: 'Google sign-in linked.' });
  });
  router.patch('/profile', authentication(db, config), csrf, async (req, res) => {
    const fields = validate(
      schemas.register.pick({ login: true, firstName: true, lastName: true }).partial().strict(),
      req.body,
    );
    await users.updateOne(
      { _id: req.auth.user._id },
      { $set: { ...fields, updatedAt: new Date() } },
    );
    res.json({ user: publicUser(await users.findOne({ _id: req.auth.user._id })) });
  });
  return router;
}
