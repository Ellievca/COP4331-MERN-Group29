import { request } from './client.js';

// Start both independent network operations immediately. The challenge response
// includes the public client ID, avoiding a separate settings round trip.
export async function prepareGoogleSignIn(loadGoogle, send = request) {
  const [challenge] = await Promise.all([send('/api/auth/google/challenge'), loadGoogle()]);
  return challenge;
}
