// A random ID in the standard UUID v4 format, e.g. "3b241101-e2bb-4255-8caf-4136c566a962".
// Each study session gets one before it's saved. If saving fails and you tap "Try again",
// the same ID is sent, and the server recognizes it instead of saving the session twice.
// (Math.random is fine here: this only needs to be unique among your own sessions.)
export function newSessionId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8; // "y" holds the UUID variant bits
    return value.toString(16);
  });
}
