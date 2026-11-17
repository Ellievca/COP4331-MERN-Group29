// Keep the current reference when a focus check confirms the same session.
// Otherwise every tab-focus event looks like a new login to data providers.
export function reconcileSession(previous, next) {
  if (!previous || !next) return next;
  const fields = ['mode', 'accessToken', 'csrfToken'];
  if (fields.some((key) => previous[key] !== next[key])) return next;
  const before = previous.user || {},
    after = next.user || {};
  const keys = Object.keys(before);
  return keys.length === Object.keys(after).length &&
    keys.every((key) => before[key] === after[key])
    ? previous
    : next;
}
