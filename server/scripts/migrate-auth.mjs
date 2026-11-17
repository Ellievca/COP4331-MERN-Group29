import { MongoClient } from 'mongodb';
import { readConfig } from '../src/config.js';
import { ensureDatabase } from '../src/database.js';

// Run once with a database administrator connection supplied privately through
// MONGODB_MIGRATION_URI. The long-running app keeps its existing read/write role.
const config = readConfig();
let client;
try {
  client = new MongoClient(process.env.MONGODB_MIGRATION_URI || config.mongoUri, {
    serverSelectionTimeoutMS: 10000,
  });
  await client.connect();
  const { passwordlessAccounts } = await ensureDatabase(client.db(config.databaseName));
  if (!passwordlessAccounts) throw new Error('schema_permission_required');
  console.log(
    'Authentication schema is ready. Existing account data and validation rules are preserved. Restart StudySync.',
  );
} catch {
  console.error(
    'Migration could not complete. Set MONGODB_MIGRATION_URI to an administrator connection for the configured database, then retry. No administrator credential is logged.',
  );
  process.exitCode = 1;
} finally {
  await client?.close();
}
