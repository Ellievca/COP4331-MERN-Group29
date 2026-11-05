import { parseArgs } from 'node:util';
import { readConfig } from '../src/config.js';
import { connectDatabase } from '../src/database.js';

// Administrative roles are assigned through a trusted server command,
// never by public registration or a browser-supplied role field.
const { values } = parseArgs({ options: { login: { type: 'string' } } });
if (!values.login) {
  console.error('Usage: pnpm create-admin --login existing-username');
  process.exitCode = 1;
} else {
  let client;
  try {
    const connected = await connectDatabase(
      readConfig({
        ...process.env,
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27019',
      }),
    );
    client = connected.client;
    const result = await connected.db
      .collection('Users')
      .updateOne(
        { login: values.login.trim().toLowerCase(), isActive: { $ne: false } },
        { $set: { role: 'admin', updatedAt: new Date() } },
      );
    if (!result.matchedCount) {
      console.error('Register this username first, then run the command again.');
      process.exitCode = 1;
    } else console.log('Administrator role assigned. Sign in again to refresh the interface.');
  } catch {
    console.error('Could not assign the role. Check the server database configuration.');
    process.exitCode = 1;
  } finally {
    await client?.close();
  }
}
