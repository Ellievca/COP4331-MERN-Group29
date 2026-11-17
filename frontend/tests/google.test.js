import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepareGoogleSignIn } from '../src/services/google.js';

test('Google startup fetches one bootstrap response while the SDK is still loading', async () => {
  let finishSdk, finishRequest;
  const calls = [];
  const sdk = new Promise((resolve) => {
    finishSdk = resolve;
  });
  const response = new Promise((resolve) => {
    finishRequest = resolve;
  });
  const ready = prepareGoogleSignIn(
    () => {
      calls.push('sdk');
      return sdk;
    },
    (path) => {
      calls.push(path);
      return response;
    },
  );
  assert.deepEqual(calls, ['/api/auth/google/challenge', 'sdk']);
  let settled = false;
  ready.then(() => {
    settled = true;
  });
  finishRequest({ nonce: 'single-use', googleClientId: 'public-client' });
  await Promise.resolve();
  assert.equal(settled, false, 'the button must wait until the SDK is usable');
  finishSdk();
  assert.deepEqual(await ready, { nonce: 'single-use', googleClientId: 'public-client' });
});

test('Google startup propagates a failed challenge without requiring the SDK to finish', async () => {
  await assert.rejects(
    prepareGoogleSignIn(
      () => new Promise(() => {}),
      async () => {
        throw new Error('Google sign-in unavailable');
      },
    ),
    /Google sign-in unavailable/,
  );
});
