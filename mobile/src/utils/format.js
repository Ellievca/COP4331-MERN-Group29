// Small helpers for turning API data into what screens show.
// Ported from the web app's frontend/src/lib/format.js so both apps count things the same way.

export const DAILY_GOAL = 20; // cards per day, same as the website

export function initials(user) {
  return `${user?.firstName?.[0] || 'S'}${user?.lastName?.[0] || ''}`.toUpperCase();
}

// "Nov 9"
export function dateLabel(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(date),
  );
}

export function isSameDay(a, b) {
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export function isToday(date, now = new Date()) {
  return isSameDay(date, now);
}

export function withinLastWeek(date, now = new Date()) {
  return new Date(date) >= new Date(now.getTime() - 7 * 86400000);
}

export function plural(count, word) {
  return `${count} ${count === 1 ? word : `${word}s`}`;
}

// Newest first, like the website's "Recently updated".
export function sortDecksRecent(decks) {
  return [...decks].sort(
    (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt),
  );
}

export function sortSessionsRecent(sessions) {
  return [...sessions].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
}

// Whole minutes a session lasted, at least 1.
export function sessionMinutes(session) {
  return Math.max(1, Math.round((new Date(session.endedAt) - new Date(session.startedAt)) / 60000));
}

// Monday-to-Sunday of the current week, marking today and the days you studied.
export function weekStrip(sessions, now = new Date()) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    return {
      label,
      day: date.getDate(),
      isToday: isSameDay(date, now),
      practiced: sessions.some((s) => isSameDay(s.startedAt, date)),
    };
  });
}

// Everything the home screen shows, worked out in one place.
export function homeSummary({ decks, sessions, now = new Date() }) {
  const recentDecks = sortDecksRecent(decks);
  const todayReviewed = sessions
    .filter((s) => isToday(s.startedAt, now))
    .reduce((sum, s) => sum + s.cardsReviewed, 0);
  return {
    deckCount: decks.length,
    totalCards: decks.reduce((sum, d) => sum + (d.cardCount || 0), 0),
    weekReviewed: sessions
      .filter((s) => withinLastWeek(s.startedAt, now))
      .reduce((sum, s) => sum + s.cardsReviewed, 0),
    todayReviewed,
    goalProgress: Math.min(todayReviewed / DAILY_GOAL, 1),
    cardsToGoal: Math.max(DAILY_GOAL - todayReviewed, 0),
    // The deck the "Let's study" button opens: newest one that has cards.
    recommended: recentDecks.find((d) => d.cardCount > 0) || null,
    recentDecks: recentDecks.slice(0, 4),
    recentSessions: sortSessionsRecent(sessions).slice(0, 3),
    week: weekStrip(sessions, now),
  };
}

// ---------- Decks screen ----------

// The three sort choices, same as the website's dropdown.
export const SORT_OPTIONS = [
  { key: 'recent', label: 'Recently updated' },
  { key: 'title', label: 'Title: A to Z' },
  { key: 'cards', label: 'Most cards' },
];

// Search + course filter + sort, ported from the web app's filterDecks().
// courseId 'all' means every course (including decks with no course).
export function filterDecks(decks, { query = '', courseId = 'all', sort = 'recent' } = {}) {
  const term = query.trim().toLowerCase();
  return decks
    .filter(
      (deck) =>
        (courseId === 'all' || deck.courseId === courseId) &&
        `${deck.title} ${deck.description || ''}`.toLowerCase().includes(term),
    )
    .sort((a, b) =>
      sort === 'title'
        ? a.title.localeCompare(b.title)
        : sort === 'cards'
          ? b.cardCount - a.cardCount
          : new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt),
    );
}

// How many decks each course has, for the filter chips: { courseId: count }
export function deckCountsByCourse(decks) {
  const counts = {};
  for (const deck of decks) if (deck.courseId) counts[deck.courseId] = (counts[deck.courseId] || 0) + 1;
  return counts;
}

// ---------- History screen ----------

export function historySummary(sessions) {
  const reviewed = sessions.reduce((sum, s) => sum + s.cardsReviewed, 0);
  const correct = sessions.reduce((sum, s) => sum + s.cardsCorrect, 0);
  return {
    sessionCount: sessions.length,
    reviewed,
    // "—" until there's something to measure, like the website
    recallRate: reviewed ? `${Math.round((correct / reviewed) * 100)}%` : '—',
    sessions: sortSessionsRecent(sessions),
  };
}

// ---------- Deck screen ----------

// Cards whose question or answer contains the search text (any capitalization).
export function filterCards(cards, query = '') {
  const term = query.trim().toLowerCase();
  return cards.filter((card) => `${card.front} ${card.back}`.toLowerCase().includes(term));
}

// 1 → "01", like the website's card numbers
export function cardNumber(index) {
  return String(index + 1).padStart(2, '0');
}

// ---------- Study mode ----------

// 7 of 9 → 78 (a whole-number percent)
export function recallPercent(correct, reviewed) {
  return reviewed ? Math.round((correct / reviewed) * 100) : 0;
}
