import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reconcileSession } from '../src/lib/auth-session.js';

const session = {
  mode: 'api',
  csrfToken: 'first',
  user: { id: 'one', role: 'user', isVerified: false },
};
test('an unchanged focus response preserves the active session reference', () => {
  assert.equal(reconcileSession(session, structuredClone(session)), session);
});
test('session rotation and profile changes still update authentication', () => {
  for (const next of [
    { ...session, csrfToken: 'rotated' },
    { ...session, user: { ...session.user, isVerified: true } },
    { ...session, user: { ...session.user, role: 'admin' } },
    { ...session, user: { ...session.user, id: 'other' } },
    null,
  ])
    assert.equal(reconcileSession(session, next), next);
});
