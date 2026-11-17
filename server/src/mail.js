import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { HttpError } from './errors.js';

export function mailAvailable(config) {
  return (
    Boolean(config.resendKey && config.mailFrom) ||
    (!config.production && config.mailMode === 'file')
  );
}
export async function deliverMail(config, message) {
  if (config.resendKey && config.mailFrom) {
    let response;
    try {
      response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        signal: AbortSignal.timeout(10000),
        headers: {
          Authorization: `Bearer ${config.resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ from: config.mailFrom, ...message }),
      });
    } catch {
      throw new HttpError(
        503,
        'Email delivery is temporarily unavailable. Please try again.',
        'mail_unavailable',
      );
    }
    if (!response.ok)
      throw new HttpError(
        503,
        'Email delivery is temporarily unavailable. Please try again.',
        'mail_unavailable',
      );
    return;
  }
  if (!config.production && config.mailMode === 'file') {
    const directory = fileURLToPath(new URL('../.local-mail/', import.meta.url));
    await mkdir(directory, { recursive: true });
    await writeFile(
      `${directory}/${Date.now()}-${randomUUID()}.json`,
      JSON.stringify(message, null, 2),
      { mode: 0o600 },
    );
    return;
  }
  throw new HttpError(503, 'Email delivery has not been configured yet.', 'mail_unavailable');
}
