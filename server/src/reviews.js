import { Router } from 'express';
import { z } from 'zod';
import { HttpError } from './errors.js';
import { id, validate } from './validation.js';
import { serialize } from './database.js';
import { nextReview, defaultSettings, dayKey, interleaveCards } from '../../shared/study.js';

const missing = () => new HttpError(404, 'This card could not be found.', 'not_found');
const timezone = z
  .string()
  .max(100)
  .refine((value) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone: value });
      return true;
    } catch {
      return false;
    }
  }, 'Choose a valid time zone.');
export function reviewRoutes(db) {
  const router = Router(),
    progress = db.collection('CardProgress');
  router.get('/reviews', async (req, res) => {
    const settings = { ...defaultSettings, ...req.auth.user.studySettings };
    const deckSelector = { userId: req.auth.user._id, deletedAt: { $exists: false } };
    if (req.query.deckId) deckSelector._id = id(req.query.deckId);
    if (req.query.courseId) deckSelector.courseId = id(req.query.courseId);
    const decks = await db.collection('Decks').find(deckSelector).toArray();
    const cards = await db
      .collection('Cards')
      .find({ userId: req.auth.user._id, deckId: { $in: decks.map((deck) => deck._id) } })
      .sort({ createdAt: 1, _id: 1 })
      .toArray();
    const allProgress = await progress
      .find({ userId: req.auth.user._id }, { projection: { history: { $slice: 1 } } })
      .toArray();
    const byId = new Map(allProgress.map((item) => [String(item._id), item]));
    const introducedToday = allProgress.filter(
      (item) =>
        item.history?.length &&
        dayKey(item.history[0].at, settings.timezone) === dayKey(new Date(), settings.timezone),
    ).length;
    const now = new Date();
    const items = cards.map((card) => {
      const state = byId.get(String(card._id));
      return {
        ...serialize(card),
        deckId: String(card.deckId),
        deckTitle: decks.find((deck) => deck._id.equals(card.deckId))?.title,
        version: state?.version || 0,
        due: state?.schedule?.due || null,
        lapses: state?.schedule?.lapses || 0,
        suspended: Boolean(state?.suspended),
      };
    });
    const due = items
      .filter((item) => !item.suspended && item.due && new Date(item.due) <= now)
      .sort((a, b) => new Date(a.due) - new Date(b.due));
    const fresh = items.filter((item) => !item.suspended && !item.due);
    const queue = [
      ...due,
      ...fresh.slice(0, Math.max(0, settings.newCardsPerDay - introducedToday)),
    ];
    const plans = decks
      .filter((deck) => deck.examDate)
      .map((deck) => {
        const remaining = fresh.filter((card) => card.deckId === String(deck._id)).length;
        const days = Math.max(
          1,
          Math.ceil((new Date(`${deck.examDate}T23:59:59Z`) - now) / 86400000),
        );
        return {
          deckId: String(deck._id),
          title: deck.title,
          examDate: deck.examDate,
          days,
          unseen: remaining,
          suggestedNewPerDay: Math.ceil(remaining / days),
          past: deck.examDate < now.toISOString().slice(0, 10),
        };
      });
    res.json({
      settings,
      dueCount: due.length,
      newCount: fresh.length,
      introducedToday,
      queue: (settings.interleave ? interleaveCards(queue) : queue).slice(0, 200),
      repair: items.filter((item) => item.lapses >= 5 || item.suspended),
      plans,
    });
  });
  router.patch('/reviews/settings', async (req, res) => {
    const fields = validate(
      z
        .object({
          retention: z.number().min(0.8).max(0.97),
          newCardsPerDay: z.number().int().min(0).max(100),
          timezone,
          interleave: z.boolean(),
        })
        .strict(),
      req.body,
    );
    await db
      .collection('Users')
      .updateOne({ _id: req.auth.user._id }, { $set: { studySettings: fields } });
    res.json(fields);
  });
  router.post('/reviews/:cardId', async (req, res) => {
    const fields = validate(
      z
        .object({
          reviewId: z.uuid(),
          rating: z.number().int().min(1).max(4),
          version: z.number().int().min(0),
        })
        .strict(),
      req.body,
    );
    const card = await db
      .collection('Cards')
      .findOne({ _id: id(req.params.cardId), userId: req.auth.user._id });
    if (
      !card ||
      !(await db
        .collection('Decks')
        .findOne({ _id: card.deckId, userId: req.auth.user._id, deletedAt: { $exists: false } }))
    )
      throw missing();
    try {
      await progress.updateOne(
        { _id: card._id },
        { $setOnInsert: { userId: req.auth.user._id, version: 0, history: [] } },
        { upsert: true },
      );
    } catch (error) {
      if (error.code !== 11000) throw error;
    }
    const current = await progress.findOne({ _id: card._id, userId: req.auth.user._id });
    const previous = current.history.find((item) => item.id === fields.reviewId);
    if (previous) {
      if (previous.rating !== fields.rating)
        throw new HttpError(
          409,
          'A saved review cannot be changed. Reload your queue.',
          'review_conflict',
        );
      return res.json({ due: previous.due, version: previous.version, replayed: true });
    }
    if (current.suspended || current.version !== fields.version)
      throw new HttpError(
        409,
        'This card changed on another page. Reload your queue.',
        'review_conflict',
      );
    const now = new Date(),
      result = nextReview(
        current.schedule,
        fields.rating,
        req.auth.user.studySettings?.retention || 0.9,
        now,
      );
    const event = {
      id: fields.reviewId,
      rating: fields.rating,
      at: now,
      due: result.card.due,
      version: fields.version + 1,
    };
    // Schedule and review event are one atomic document update: retries cannot
    // advance twice, even after a process interruption or concurrent tab review.
    const updated = await progress.updateOne(
      {
        _id: card._id,
        userId: req.auth.user._id,
        version: fields.version,
        suspended: { $ne: true },
      },
      { $set: { schedule: result.card }, $inc: { version: 1 }, $push: { history: event } },
    );
    if (!updated.modifiedCount) {
      const replay = await progress.findOne({ _id: card._id, 'history.id': fields.reviewId });
      if (replay) {
        const saved = replay.history.find((item) => item.id === fields.reviewId);
        if (saved.rating !== fields.rating)
          throw new HttpError(409, 'A saved review cannot be changed.', 'review_conflict');
        return res.json({ due: saved.due, version: saved.version, replayed: true });
      }
      throw new HttpError(
        409,
        'This card changed on another page. Reload your queue.',
        'review_conflict',
      );
    }
    res.json({ due: event.due, version: event.version });
  });
  router.patch('/reviews/:cardId', async (req, res) => {
    const fields = validate(
      z
        .object({ suspended: z.boolean().optional(), reset: z.literal(true).optional() })
        .strict()
        .refine((v) => v.suspended !== undefined || v.reset),
      req.body,
    );
    const card = await db
      .collection('Cards')
      .findOne({ _id: id(req.params.cardId), userId: req.auth.user._id });
    if (!card) throw missing();
    await progress.updateOne(
      { _id: card._id, userId: req.auth.user._id },
      {
        ...(fields.suspended !== undefined ? { $set: { suspended: fields.suspended } } : {}),
        ...(fields.reset ? { $unset: { schedule: '' } } : {}),
        $inc: { version: 1 },
        $setOnInsert: { history: [] },
      },
      { upsert: true },
    );
    res.json(fields);
  });
  return router;
}
