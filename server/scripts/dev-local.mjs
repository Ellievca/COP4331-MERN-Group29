import { MongoMemoryServer } from 'mongodb-memory-server-core';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { startServer } from '../src/index.js';

// A real MongoDB process, stored in an ignored local directory. This launcher
// never connects to or resets the group's shared droplet/Atlas database.
let mongo;
let running;
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  if (running) await running.close();
  if (mongo) await mongo.stop({ doCleanup: false });
  process.disconnect?.();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
process.on('message', (message) => {
  if (message === 'shutdown') stop();
});
try {
  const dbPath = fileURLToPath(new URL('../.local-mongo', import.meta.url));
  await mkdir(dbPath, { recursive: true });
  console.log(
    'Starting the local MongoDB database. The first run may download the MongoDB binary.',
  );
  mongo = await MongoMemoryServer.create({
    binary: { version: '8.0.17' },
    instance: { ip: '127.0.0.1', port: 27019, dbPath, storageEngine: 'wiredTiger' },
  });
  process.env.MONGODB_URI = mongo.getUri();
  process.env.MONGODB_DB_NAME = 'StudySync_local';
  process.env.NODE_ENV = 'development';
  running = await startServer();
} catch (error) {
  console.error('Local startup failed.', error.code || error.name);
  await stop();
  process.exitCode = 1;
}
