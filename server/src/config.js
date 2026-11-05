import { config as loadEnv } from 'dotenv';
import { isIP } from 'node:net';
import { fileURLToPath } from 'node:url';

loadEnv({ path: fileURLToPath(new URL('../.env', import.meta.url)), quiet: true });

export function readConfig(environment = process.env) {
  const production = environment.NODE_ENV === 'production';
  const appOrigin = new URL(environment.APP_ORIGIN || 'http://127.0.0.1:5173');
  if (!['http:', 'https:'].includes(appOrigin.protocol) || appOrigin.username || appOrigin.password)
    throw new Error('APP_ORIGIN must be an HTTP or HTTPS origin.');
  if (
    production &&
    (appOrigin.protocol !== 'https:' ||
      isIP(appOrigin.hostname) ||
      !appOrigin.hostname.includes('.') ||
      appOrigin.hostname.endsWith('.localhost'))
  )
    throw new Error('Production requires APP_ORIGIN to be an HTTPS domain name.');
  const port = Number(environment.PORT || 5000);
  const sessionHours = Number(environment.SESSION_HOURS || 8);
  if (!Number.isInteger(port) || port < 1 || port > 65535)
    throw new Error('PORT must be a valid port.');
  if (!Number.isFinite(sessionHours) || sessionHours < 1 || sessionHours > 168)
    throw new Error('SESSION_HOURS must be between 1 and 168.');
  const mongoUri = environment.MONGODB_URI;
  if (!mongoUri) throw new Error('Set MONGODB_URI, or use the local development launcher.');
  const databaseName = environment.MONGODB_DB_NAME || 'StudySync_local';
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(databaseName))
    throw new Error('MONGODB_DB_NAME contains unsupported characters.');
  return {
    production,
    mongoUri,
    databaseName,
    port,
    host: environment.HOST || '127.0.0.1',
    appOrigin: appOrigin.origin,
    allowedOrigins: production
      ? [appOrigin.origin]
      : [...new Set([appOrigin.origin, 'http://127.0.0.1:5173', 'http://localhost:5173'])],
    trustProxy: environment.TRUST_PROXY === '1' ? 1 : false,
    sessionMilliseconds: sessionHours * 3600000,
    cookieName: 'studysync.sid',
    rateLimits: environment.NODE_ENV !== 'test',
  };
}
