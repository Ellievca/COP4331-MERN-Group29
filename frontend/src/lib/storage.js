export function readStored(storage, key, fallback) {
  const value = storage.getItem(key);
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function writeStored(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    throw new Error(
      'This browser could not save your changes. Allow local storage or free up some space and try again.',
    );
  }
}

export const SESSION_KEY = 'studysync.session.v1';
