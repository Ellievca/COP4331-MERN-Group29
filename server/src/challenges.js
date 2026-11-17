import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { HttpError } from './errors.js';
import { deliverMail } from './mail.js';

export const digest = (value) => createHash('sha256').update(value).digest('hex');
const codeDigest = (config, nonce, code) =>
  createHmac('sha256', config.challengeSecret).update(`${nonce}:${code}`).digest('hex');
export async function issueChallenge(
  db,
  config,
  user,
  purpose,
  send = (message) => deliverMail(config, message),
) {
  const now = new Date();
  const code = String(randomInt(1000000)).padStart(6, '0');
  const nonce = randomBytes(24).toString('hex');
  const record = {
    _id: `${user._id}:${purpose}`,
    userId: user._id,
    purpose,
    nonce,
    digest: codeDigest(config, nonce, code),
    attempts: 5,
    authVersion: user.authVersion || 0,
    expiresAt: new Date(+now + 10 * 60000),
    resendAt: new Date(+now + 60000),
  };
  try {
    await db
      .collection('EmailChallenges')
      .replaceOne({ _id: record._id, resendAt: { $lte: now } }, record, { upsert: true });
  } catch (error) {
    if (error.code === 11000) return;
    throw error;
  }
  try {
    await send({
      to: user.email,
      subject:
        purpose === 'verify' ? 'Verify your StudySync email' : 'Reset your StudySync password',
      text: `Your StudySync ${purpose === 'verify' ? 'email verification' : 'password reset'} code is ${code}. It expires in 10 minutes. If you did not request this, you can ignore this email.`,
    });
  } catch (error) {
    await db.collection('EmailChallenges').deleteOne({ _id: record._id, nonce });
    throw error;
  }
}
export async function consumeChallenge(db, config, user, purpose, code) {
  const collection = db.collection('EmailChallenges');
  const record = await collection.findOneAndUpdate(
    {
      _id: `${user._id}:${purpose}`,
      expiresAt: { $gt: new Date() },
      attempts: { $gt: 0 },
      authVersion: user.authVersion || 0,
    },
    { $inc: { attempts: -1 } },
    { returnDocument: 'before' },
  );
  const failure = () =>
    new HttpError(
      400,
      'The code is incorrect or expired. Request a new code if needed.',
      'invalid_code',
    );
  if (!record) throw failure();
  const supplied = codeDigest(config, record.nonce, code);
  if (!timingSafeEqual(Buffer.from(record.digest), Buffer.from(supplied))) throw failure();
  if (!(await collection.deleteOne({ _id: record._id, nonce: record.nonce })).deletedCount)
    throw failure();
}
