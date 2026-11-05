import { MongoClient } from 'mongodb';

// Collection names and required fields follow Ellie's database-setup.js.
// Existing validators are preserved; there are no drops, resets, or migrations on startup.
export async function ensureDatabase(db) {
  const definitions = {
    Users: {
      required: [
        'firstName',
        'lastName',
        'email',
        'login',
        'passwordHash',
        'isVerified',
        'createdAt',
      ],
      properties: {
        firstName: { bsonType: 'string' },
        lastName: { bsonType: 'string' },
        email: { bsonType: 'string' },
        login: { bsonType: 'string' },
        passwordHash: { bsonType: 'string' },
        isVerified: { bsonType: 'bool' },
        role: { enum: ['user', 'admin'] },
        isActive: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
      },
    },
    Courses: {
      required: ['userId', 'name', 'createdAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        name: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
      },
    },
    Decks: {
      required: ['userId', 'title', 'isPublic', 'createdAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        courseId: { bsonType: ['objectId', 'null'] },
        title: { bsonType: 'string' },
        isPublic: { bsonType: 'bool' },
        createdAt: { bsonType: 'date' },
      },
    },
    Cards: {
      required: ['deckId', 'userId', 'front', 'back', 'createdAt'],
      properties: {
        deckId: { bsonType: 'objectId' },
        userId: { bsonType: 'objectId' },
        front: { bsonType: 'string' },
        back: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
      },
    },
    StudySessions: {
      required: ['userId', 'startedAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        deckId: { bsonType: ['objectId', 'null'] },
        courseId: { bsonType: ['objectId', 'null'] },
        startedAt: { bsonType: 'date' },
        endedAt: { bsonType: 'date' },
      },
    },
    AuthSessions: {
      required: ['userId', 'csrfToken', 'expiresAt'],
      properties: {
        userId: { bsonType: 'objectId' },
        csrfToken: { bsonType: 'string' },
        expiresAt: { bsonType: 'date' },
      },
    },
  };
  const existing = new Set(
    (await db.listCollections({}, { nameOnly: true }).toArray()).map((item) => item.name),
  );
  for (const [name, definition] of Object.entries(definitions)) {
    if (!existing.has(name)) {
      try {
        await db.createCollection(name, {
          validator: { $jsonSchema: { bsonType: 'object', ...definition } },
        });
      } catch (error) {
        if (error.code !== 48) throw error;
      }
    }
  }
  await Promise.all([
    db.collection('Users').createIndex({ email: 1 }, { unique: true }),
    db.collection('Users').createIndex({ login: 1 }, { unique: true }),
    db.collection('Courses').createIndex({ userId: 1, name: 1 }, { unique: true }),
    db.collection('Decks').createIndex({ userId: 1, updatedAt: -1 }),
    db.collection('Cards').createIndex({ userId: 1, deckId: 1, createdAt: 1 }),
    db.collection('StudySessions').createIndex({ userId: 1, startedAt: -1 }),
    db
      .collection('StudySessions')
      .createIndex(
        { userId: 1, clientSessionId: 1 },
        { unique: true, partialFilterExpression: { clientSessionId: { $type: 'string' } } },
      ),
    db.collection('AuthSessions').createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    db.collection('AuthSessions').createIndex({ userId: 1 }),
  ]);
}

export async function connectDatabase(config) {
  const client = new MongoClient(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  try {
    await client.connect();
    const db = client.db(config.databaseName);
    await ensureDatabase(db);
    return { client, db };
  } catch (error) {
    await client.close();
    throw error;
  }
}

export function serialize(document) {
  const { _id, userId, deletedAt, passwordHash, ...fields } = document;
  return { ...fields, id: _id.toString(), ...(userId ? { userId: userId.toString() } : {}) };
}
