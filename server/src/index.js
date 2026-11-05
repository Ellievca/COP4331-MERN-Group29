import { fileURLToPath } from 'node:url';
import { readConfig } from './config.js';
import { connectDatabase } from './database.js';
import { createApp } from './app.js';

export async function startServer() {
  const config = readConfig();
  const { client, db } = await connectDatabase(config);
  let server;
  try {
    const app = await createApp({
      db,
      config,
      frontendPath: fileURLToPath(new URL('../../frontend/dist', import.meta.url)),
    });
    server = await new Promise((resolve, reject) => {
      const listening = app.listen(config.port, config.host, () => resolve(listening));
      listening.once('error', reject);
    });
    console.log(`StudySync API: http://${config.host}:${config.port} (${config.databaseName})`);
    return {
      server,
      client,
      db,
      config,
      async close() {
        await new Promise((resolve) => server.close(resolve));
        await client.close();
      },
    };
  } catch (error) {
    await client.close();
    throw error;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const running = await startServer();
    let closing = false;
    const close = async () => {
      if (closing) return;
      closing = true;
      await running.close();
    };
    process.once('SIGINT', close);
    process.once('SIGTERM', close);
  } catch {
    console.error(
      'StudySync could not start. Check the MongoDB connection and server configuration.',
    );
    process.exitCode = 1;
  }
}
