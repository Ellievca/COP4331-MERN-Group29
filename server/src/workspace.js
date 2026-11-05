import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { HttpError } from './errors.js';
import { schemas, validate, id, limit } from './validation.js';
import { serialize } from './database.js';

const active = { deletedAt: { $exists: false } };
const notFound = () => new HttpError(404, 'This resource could not be found.', 'not_found');
const changes = (schema, body) => {
  const parsed = validate(schema.partial(), body);
  if (!Object.keys(body).length)
    throw new HttpError(400, 'Supply at least one field to update.', 'validation_failed');
  return Object.fromEntries(Object.keys(body).map((key) => [key, parsed[key]]));
};

export function workspaceRoutes(db) {
  const router = Router();
  const courses = db.collection('Courses');
  const decks = db.collection('Decks');
  const cards = db.collection('Cards');
  const sessions = db.collection('StudySessions');
  async function ownedDeck(req, value = req.params.id || req.params.deckId) {
    const deck = await decks.findOne({ _id: id(value), userId: req.auth.user._id, ...active });
    if (!deck) throw notFound();
    return deck;
  }
  async function ownedCourse(userId, value) {
    if (!value) return null;
    const course = await courses.findOne({ _id: id(value), userId });
    if (!course) throw notFound();
    return course._id;
  }
  async function deckResponse(deck) {
    return {
      ...serialize(deck),
      cardCount: await cards.countDocuments({ deckId: deck._id, userId: deck.userId }),
    };
  }

  router.get('/courses', async (req, res) =>
    res.json(
      (
        await courses
          .find({ userId: req.auth.user._id })
          .sort({ name: 1 })
          .limit(limit(req.query.limit))
          .toArray()
      ).map(serialize),
    ),
  );
  router.post('/courses', async (req, res) => {
    const fields = validate(schemas.course, req.body);
    const now = new Date();
    const course = { ...fields, userId: req.auth.user._id, createdAt: now, updatedAt: now };
    course._id = (await courses.insertOne(course)).insertedId;
    res.status(201).json(serialize(course));
  });
  router.patch('/courses/:id', async (req, res) => {
    const fields = changes(schemas.course, req.body);
    const course = await courses.findOneAndUpdate(
      { _id: id(req.params.id), userId: req.auth.user._id },
      { $set: { ...fields, updatedAt: new Date() } },
      { returnDocument: 'after', includeResultMetadata: false },
    );
    if (!course) throw notFound();
    res.json(serialize(course));
  });
  router.delete('/courses/:id', async (req, res) => {
    const courseId = await ownedCourse(req.auth.user._id, req.params.id);
    if (await decks.findOne({ courseId, userId: req.auth.user._id, ...active }))
      throw new HttpError(
        409,
        'Move or delete the decks in this course first.',
        'course_not_empty',
      );
    await courses.deleteOne({ _id: courseId, userId: req.auth.user._id });
    res.status(204).end();
  });

  router.get('/decks', async (req, res) => {
    const selector = { userId: req.auth.user._id, ...active };
    if (req.query.courseId) selector.courseId = id(String(req.query.courseId));
    if (req.query.search !== undefined) {
      if (typeof req.query.search !== 'string' || req.query.search.length > 200)
        throw new HttpError(400, 'Search must be a short text value.', 'validation_failed');
      const expression = new RegExp(req.query.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      selector.$or = [{ title: expression }, { description: expression }];
    }
    const result = await decks
      .find(selector)
      .sort({ updatedAt: -1, _id: -1 })
      .limit(limit(req.query.limit))
      .toArray();
    res.json(await Promise.all(result.map(deckResponse)));
  });
  router.post('/decks', async (req, res) => {
    const fields = validate(schemas.deck, req.body);
    const courseId = await ownedCourse(req.auth.user._id, fields.courseId);
    const now = new Date();
    const deck = {
      ...fields,
      courseId,
      userId: req.auth.user._id,
      isPublic: false,
      createdAt: now,
      updatedAt: now,
    };
    deck._id = (await decks.insertOne(deck)).insertedId;
    res.status(201).json({ ...serialize(deck), cardCount: 0 });
  });
  router.get('/decks/:id', async (req, res) => res.json(await deckResponse(await ownedDeck(req))));
  router.patch('/decks/:id', async (req, res) => {
    const deck = await ownedDeck(req);
    const fields = changes(schemas.deck, req.body);
    if (Object.hasOwn(fields, 'courseId'))
      fields.courseId = await ownedCourse(req.auth.user._id, fields.courseId);
    const updated = await decks.findOneAndUpdate(
      { _id: deck._id, userId: req.auth.user._id, ...active },
      { $set: { ...fields, updatedAt: new Date() } },
      { returnDocument: 'after', includeResultMetadata: false },
    );
    if (!updated) throw notFound();
    res.json(await deckResponse(updated));
  });
  router.delete('/decks/:id', async (req, res) => {
    const deck = await ownedDeck(req);
    // A tombstone hides the deck before child cleanup. An interrupted cleanup
    // cannot expose orphan cards through any of the owner-checked API routes.
    await decks.updateOne(
      { _id: deck._id, userId: req.auth.user._id },
      { $set: { deletedAt: new Date(), updatedAt: new Date() } },
    );
    await cards.deleteMany({ deckId: deck._id, userId: req.auth.user._id });
    res.status(204).end();
  });

  router.get('/decks/:deckId/cards', async (req, res) => {
    const deck = await ownedDeck(req);
    res.json(
      (
        await cards
          .find({ deckId: deck._id, userId: req.auth.user._id })
          .sort({ createdAt: 1, _id: 1 })
          .limit(limit(req.query.limit, 1000))
          .toArray()
      ).map(serialize),
    );
  });
  router.post('/decks/:deckId/cards', async (req, res) => {
    const deck = await ownedDeck(req);
    const fields = validate(schemas.card, req.body);
    if ((await cards.countDocuments({ deckId: deck._id, userId: req.auth.user._id })) >= 1000)
      throw new HttpError(409, 'Use another deck after 1,000 flashcards.', 'deck_limit');
    const now = new Date();
    const card = {
      ...fields,
      deckId: deck._id,
      userId: req.auth.user._id,
      createdAt: now,
      updatedAt: now,
      timesReviewed: 0,
      timesCorrect: 0,
    };
    card._id = (await cards.insertOne(card)).insertedId;
    await decks.updateOne(
      { _id: deck._id, userId: req.auth.user._id, ...active },
      { $set: { updatedAt: now } },
    );
    res.status(201).json(serialize(card));
  });
  router.patch('/decks/:deckId/cards/:cardId', async (req, res) => {
    const deck = await ownedDeck(req);
    const fields = changes(schemas.card, req.body);
    const card = await cards.findOneAndUpdate(
      { _id: id(req.params.cardId), deckId: deck._id, userId: req.auth.user._id },
      { $set: { ...fields, updatedAt: new Date() } },
      { returnDocument: 'after', includeResultMetadata: false },
    );
    if (!card) throw notFound();
    await decks.updateOne(
      { _id: deck._id, userId: req.auth.user._id, ...active },
      { $set: { updatedAt: new Date() } },
    );
    res.json(serialize(card));
  });
  router.delete('/decks/:deckId/cards/:cardId', async (req, res) => {
    const deck = await ownedDeck(req);
    const result = await cards.deleteOne({
      _id: id(req.params.cardId),
      deckId: deck._id,
      userId: req.auth.user._id,
    });
    if (!result.deletedCount) throw notFound();
    await decks.updateOne(
      { _id: deck._id, userId: req.auth.user._id, ...active },
      { $set: { updatedAt: new Date() } },
    );
    res.status(204).end();
  });

  router.get('/study-sessions', async (req, res) =>
    res.json(
      (
        await sessions
          .find({ userId: req.auth.user._id })
          .sort({ startedAt: -1, _id: -1 })
          .limit(limit(req.query.limit))
          .toArray()
      ).map(serialize),
    ),
  );
  router.post('/study-sessions', async (req, res) => {
    const fields = validate(schemas.session, req.body);
    const deck = await ownedDeck(req, fields.deckId);
    if (
      fields.cardsReviewed >
      (await cards.countDocuments({ deckId: deck._id, userId: req.auth.user._id }))
    )
      throw new HttpError(
        400,
        'Reviewed cards cannot exceed the cards in this deck.',
        'validation_failed',
      );
    if (fields.courseId && fields.courseId !== deck.courseId?.toString())
      throw new HttpError(400, 'The course does not match this deck.', 'validation_failed');
    const record = {
      userId: req.auth.user._id,
      deckId: deck._id,
      courseId: deck.courseId || null,
      deckTitle: deck.title,
      startedAt: new Date(fields.startedAt),
      endedAt: new Date(fields.endedAt),
      cardsReviewed: fields.cardsReviewed,
      cardsCorrect: fields.cardsCorrect,
      clientSessionId: fields.clientSessionId || randomUUID(),
    };
    const saved = await sessions.findOneAndUpdate(
      { userId: req.auth.user._id, clientSessionId: record.clientSessionId },
      { $setOnInsert: record },
      { upsert: true, returnDocument: 'after', includeResultMetadata: false },
    );
    res.status(201).json(serialize(saved));
  });
  return router;
}
