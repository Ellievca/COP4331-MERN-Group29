// Checks the register form on the phone before anything is sent.
// These rules mirror server/src/validation.js so the server never rejects a form
// that looked fine here (its own error messages are too technical to show users).

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME = /^[A-Za-z0-9_.-]{3,32}$/;

// The server measures passwords in UTF-8 bytes (bcrypt only reads the first 72).
// Emoji and accented letters take more than one byte each.
function utf8Bytes(text) {
  let bytes = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0);
    bytes += code < 0x80 ? 1 : code < 0x800 ? 2 : code < 0x10000 ? 3 : 4;
  }
  return bytes;
}

// Returns an object like { email: 'Enter a valid email address.' }.
// An empty object means the form is good to send.
export function validateRegister({ firstName, lastName, email, username, password, confirm }) {
  const errors = {};

  if (!firstName.trim()) errors.firstName = 'Enter your first name.';
  else if (firstName.trim().length > 60) errors.firstName = 'Use 60 characters or fewer.';

  if (!lastName.trim()) errors.lastName = 'Enter your last name.';
  else if (lastName.trim().length > 60) errors.lastName = 'Use 60 characters or fewer.';

  if (!email.trim()) errors.email = 'Enter your email.';
  else if (!EMAIL.test(email.trim()) || email.trim().length > 254)
    errors.email = 'Enter a valid email address.';

  if (!username.trim()) errors.username = 'Choose a username.';
  else if (!USERNAME.test(username.trim()))
    errors.username = 'Use 3–32 letters, numbers, or _ . - (no spaces).';

  if (!password) errors.password = 'Choose a password.';
  else if (password.length < 8) errors.password = 'Use at least 8 characters.';
  else if (password.length > 128 || utf8Bytes(password) > 72)
    errors.password = 'That password is too long.';

  if (!confirm) errors.confirm = 'Type your password again.';
  else if (confirm !== password) errors.confirm = "Passwords don't match.";

  return errors;
}
