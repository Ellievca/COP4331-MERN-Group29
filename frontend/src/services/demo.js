import { readStored, writeStored, SESSION_KEY } from '../lib/storage.js';
import { createStarterWorkspace } from './seed.js';
import { ServiceError } from './client.js';

const ACCOUNTS_KEY = 'studysync.demo.accounts.v1';
const workspaceKey = (userId) => `studysync.demo.workspace.v1.${userId}`;
const publicUser = ({ passwordHash, salt, ...user }) => user;
const canonical = (text) => text.trim().toLowerCase();
let initialization;

async function passwordHash(password, salt) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: Uint8Array.from(salt), iterations: 120000, hash: 'SHA-256' },
    key,
    256,
  );
  return [...new Uint8Array(bits)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function accountRecord(fields) {
  const salt = [...crypto.getRandomValues(new Uint8Array(16))];
  return {
    id: crypto.randomUUID(),
    firstName: fields.firstName.trim(),
    lastName: fields.lastName.trim(),
    email: canonical(fields.email),
    login: canonical(fields.login),
    salt,
    passwordHash: await passwordHash(fields.password, salt),
  };
}

async function initialize() {
  if (!initialization)
    initialization = (async () => {
      const accounts = readStored(localStorage, ACCOUNTS_KEY, []);
      if (!accounts.some((user) => user.login === 'student')) {
        const demo = await accountRecord({
          firstName: 'Alex',
          lastName: 'Morgan',
          email: 'student@example.com',
          login: 'student',
          password: 'StudySync123!',
        });
        // Read again after hashing so an overlapping operation cannot overwrite accounts.
        const current = readStored(localStorage, ACCOUNTS_KEY, []);
        if (!current.some((user) => user.login === 'student'))
          writeStored(localStorage, ACCOUNTS_KEY, [...current, demo]);
      }
    })().finally(() => {
      initialization = undefined;
    });
  return initialization;
}

export const demoAuth = {
  async register(fields) {
    await initialize();
    const login = canonical(fields.login);
    const email = canonical(fields.email);
    if (
      login.length < 3 ||
      fields.password.length < 8 ||
      !fields.firstName.trim() ||
      !fields.lastName.trim() ||
      !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)
    )
      throw new ServiceError(
        'Please check all fields. Use a username of at least 3 characters and a password of at least 8 characters.',
      );
    const record = await accountRecord(fields);
    const accounts = readStored(localStorage, ACCOUNTS_KEY, []);
    if (accounts.some((user) => user.login === login || user.email === email))
      throw new ServiceError('That username or email is already in use. Try another or sign in.');
    writeStored(localStorage, ACCOUNTS_KEY, [...accounts, record]);
    return publicUser(record);
  },
  async login({ login, password }) {
    await initialize();
    const account = readStored(localStorage, ACCOUNTS_KEY, []).find(
      (user) => user.login === canonical(login) || user.email === canonical(login),
    );
    if (!account || (await passwordHash(password, account.salt)) !== account.passwordHash)
      throw new ServiceError('Login failed. Please check your credentials and try again.', 401);
    return { user: publicUser(account), mode: 'demo' };
  },
  async restore() {
    const saved = readStored(sessionStorage, SESSION_KEY, null);
    if (saved?.mode !== 'demo') return null;
    const account = readStored(localStorage, ACCOUNTS_KEY, []).find(
      (user) => user.id === saved.user?.id,
    );
    return account ? { user: publicUser(account), mode: 'demo' } : null;
  },
};

function load(userId) {
  const saved = readStored(localStorage, workspaceKey(userId), null);
  if (saved) return saved;
  const workspace = createStarterWorkspace();
  writeStored(localStorage, workspaceKey(userId), workspace);
  return workspace;
}

function update(userId, action) {
  const workspace = load(userId);
  const result = action(workspace);
  writeStored(localStorage, workspaceKey(userId), workspace);
  return result;
}

export const demoWorkspace = {
  async createCourse(userId, fields) {
    return update(userId, (workspace) => {
      if (
        workspace.courses.some((course) => course.name.toLowerCase() === fields.name.toLowerCase())
      )
        throw new ServiceError('A course with that name already exists.');
      const course = { id: crypto.randomUUID(), ...fields };
      workspace.courses.push(course);
      return course;
    });
  },
  async load(userId) {
    return load(userId);
  },
  async getCards(userId, deckId) {
    return load(userId).decks.find((deck) => deck.id === deckId)?.cards || [];
  },
  async createDeck(userId, fields) {
    return update(userId, (workspace) => {
      const now = new Date().toISOString();
      const deck = {
        id: crypto.randomUUID(),
        ...fields,
        isPublic: false,
        cards: [],
        cardCount: 0,
        createdAt: now,
        updatedAt: now,
      };
      workspace.decks.unshift(deck);
      return deck;
    });
  },
  async deleteDeck(userId, id) {
    update(userId, (workspace) => {
      workspace.decks = workspace.decks.filter((deck) => deck.id !== id);
    });
  },
  async addCard(userId, deckId, fields) {
    return update(userId, (workspace) => {
      const deck = workspace.decks.find((deck) => deck.id === deckId);
      if (!deck) throw new ServiceError('This deck could not be found.');
      const card = { id: crypto.randomUUID(), ...fields };
      deck.cards.push(card);
      deck.cardCount = deck.cards.length;
      deck.updatedAt = new Date().toISOString();
      return card;
    });
  },
  async deleteCard(userId, deckId, cardId) {
    update(userId, (workspace) => {
      const deck = workspace.decks.find((deck) => deck.id === deckId);
      if (!deck) throw new ServiceError('This deck could not be found.');
      deck.cards = deck.cards.filter((card) => card.id !== cardId);
      deck.cardCount = deck.cards.length;
      deck.updatedAt = new Date().toISOString();
    });
  },
  async recordSession(userId, session) {
    return update(userId, (workspace) => {
      const record = { id: crypto.randomUUID(), userId, ...session };
      workspace.sessions.unshift(record);
      return record;
    });
  },
};
