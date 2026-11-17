import { createEmptyCard, fsrs, generatorParameters } from 'ts-fsrs';

export const defaultSettings = {
  retention: 0.9,
  newCardsPerDay: 20,
  timezone: 'UTC',
  interleave: true,
};
export function nextReview(schedule, rating, retention = 0.9, now = new Date()) {
  const scheduler = fsrs(generatorParameters({ request_retention: retention, enable_fuzz: false }));
  return scheduler.next(schedule || createEmptyCard(now), now, rating);
}
export function clozeText(text, reveal = false) {
  return text.replace(/\{\{c\d+::([^{}]+?)\}\}/g, (_, answer) => (reveal ? answer : '[ … ]'));
}
export function dayKey(date, timezone = 'UTC') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}
export function interleaveCards(cards) {
  const groups = new Map();
  for (const card of cards) {
    const key = String(card.deckId);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(card);
  }
  const result = [];
  while (groups.size)
    for (const [key, group] of groups) {
      result.push(group.shift());
      if (!group.length) groups.delete(key);
    }
  return result;
}
