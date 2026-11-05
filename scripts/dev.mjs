import { fork, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const demo = process.argv.includes('--demo');
let stopping = false;
const api = demo
  ? null
  : fork(fileURLToPath(new URL('../server/scripts/dev-local.mjs', import.meta.url)), [], {
      cwd: root,
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
    });
const web = spawn(
  process.execPath,
  [
    fileURLToPath(new URL('../frontend/node_modules/vite/bin/vite.js', import.meta.url)),
    '--host',
    '127.0.0.1',
    '--port',
    '5173',
    '--strictPort',
    ...(demo ? ['--mode', 'demo'] : []),
  ],
  { cwd: fileURLToPath(new URL('../frontend/', import.meta.url)), stdio: 'inherit' },
);
function stop() {
  if (stopping) return;
  stopping = true;
  web.kill();
  if (api?.connected) api.send('shutdown');
  const timer = setTimeout(() => api?.kill(), 10000);
  timer.unref();
}
process.once('SIGINT', stop);
process.once('SIGTERM', stop);
web.on('exit', (code) => {
  if (!stopping) {
    process.exitCode = code || 0;
    stop();
  }
});
api?.on('exit', (code) => {
  if (!stopping) {
    process.exitCode = code || 0;
    stop();
  }
});
console.log(
  demo ? 'Starting the browser-only demo.' : 'Starting the MongoDB-backed API and React frontend.',
);
