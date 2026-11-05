import { Router } from 'express';
import { publicUser } from './auth.js';
import { HttpError } from './errors.js';
import { id, limit, schemas, validate } from './validation.js';

export function adminRoutes(db) {
  const router = Router();
  router.get('/stats', async (req, res) => {
    const [users, activeUsers, decks, cards, sessions] = await Promise.all([
      db.collection('Users').countDocuments(),
      db.collection('Users').countDocuments({ isActive: { $ne: false } }),
      db.collection('Decks').countDocuments({ deletedAt: { $exists: false } }),
      db.collection('Cards').countDocuments(),
      db.collection('StudySessions').countDocuments(),
    ]);
    res.json({ users, activeUsers, decks, cards, sessions });
  });
  router.get('/users', async (req, res) => {
    const users = await db
      .collection('Users')
      .find()
      .sort({ createdAt: -1 })
      .limit(limit(req.query.limit, 100, 500))
      .toArray();
    res.json(users.map(publicUser));
  });
  router.patch('/users/:id/activation', async (req, res) => {
    const { isActive } = validate(schemas.activation, req.body);
    const userId = id(req.params.id);
    const target = await db.collection('Users').findOne({ _id: userId });
    if (!target) throw new HttpError(404, 'This user could not be found.', 'not_found');
    if (!isActive && (target.role === 'admin' || userId.equals(req.auth.user._id)))
      throw new HttpError(
        409,
        'Administrator accounts cannot be disabled here.',
        'protected_admin',
      );
    await db
      .collection('Users')
      .updateOne({ _id: userId }, { $set: { isActive, updatedAt: new Date() } });
    if (!isActive) await db.collection('AuthSessions').deleteMany({ userId });
    res.json(publicUser({ ...target, isActive }));
  });
  return router;
}
