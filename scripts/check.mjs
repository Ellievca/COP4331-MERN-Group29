import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

async function run(directory, args) {
  const code = await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, {
      cwd: fileURLToPath(new URL(`../${directory}/`, import.meta.url)),
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', resolve);
  });
  if (code) process.exit(code || 1);
}
if (process.argv[2] === 'build') await run('frontend', ['node_modules/vite/bin/vite.js', 'build']);
else {
  await run('frontend', ['--test', 'tests/*.test.js']);
  await run('server', ['--test', '--test-concurrency=1', 'test/*.test.js']);
}
