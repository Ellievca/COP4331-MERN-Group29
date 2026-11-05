export function firstName(user) {
  return user?.firstName || 'student';
}
export function initials(user) {
  return `${user?.firstName?.[0] || 'S'}${user?.lastName?.[0] || ''}`.toUpperCase();
}
export function dateLabel(date) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(date),
  );
}
export function isToday(date) {
  return new Date(date).toDateString() === new Date().toDateString();
}
export function withinLastWeek(date) {
  return new Date(date) >= new Date(Date.now() - 7 * 86400000);
}
export function courseFor(courses, deck) {
  return courses.find((course) => course.id === deck.courseId);
}

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
