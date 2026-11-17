import { request, IS_DEMO } from './client.js';
import { demoWorkspace } from './demo.js';
import { nextReview, defaultSettings, dayKey, interleaveCards } from '../../../shared/study.js';

const key = (session) => `studysync.reviews.v1.${session.user.id}`;
function loadDemo(session) {
  return JSON.parse(localStorage.getItem(key(session)) || '{"settings":{},"progress":{}}');
}
function saveDemo(session, data) {
  localStorage.setItem(key(session), JSON.stringify(data));
}
export const reviewService = {
  async load(session, { deckId, courseId } = {}) {
    if (!IS_DEMO)
      return request(
        '/api/reviews?' +
          new URLSearchParams({ ...(deckId ? { deckId } : {}), ...(courseId ? { courseId } : {}) }),
        { csrfToken: session.csrfToken },
      );
    const data = loadDemo(session),
      workspace = await demoWorkspace.load(session.user.id);
    const settings = { ...defaultSettings, ...data.settings };
    const decks = workspace.decks.filter(
      (deck) => (!deckId || deck.id === deckId) && (!courseId || deck.courseId === courseId),
    );
    const cards = decks.flatMap((deck) =>
      deck.cards.map((card) => ({
        ...card,
        deckId: deck.id,
        deckTitle: deck.title,
        version: data.progress[card.id]?.version || 0,
        due: data.progress[card.id]?.schedule?.due,
        lapses: data.progress[card.id]?.schedule?.lapses || 0,
        suspended: data.progress[card.id]?.suspended || false,
      })),
    );
    const introducedToday = Object.values(data.progress).filter(
      (p) =>
        p.history?.[0] &&
        dayKey(p.history[0].at, settings.timezone) === dayKey(new Date(), settings.timezone),
    ).length;
    const due = cards
      .filter((c) => !c.suspended && c.due && new Date(c.due) <= new Date())
      .sort((a, b) => new Date(a.due) - new Date(b.due));
    const fresh = cards.filter((c) => !c.suspended && !c.due);
    const queue = [
      ...due,
      ...fresh.slice(0, Math.max(0, settings.newCardsPerDay - introducedToday)),
    ];
    return {
      settings,
      dueCount: due.length,
      newCount: fresh.length,
      introducedToday,
      queue: (settings.interleave ? interleaveCards(queue) : queue).slice(0, 200),
      repair: cards.filter((c) => c.lapses >= 5 || c.suspended),
      plans: decks
        .filter((d) => d.examDate)
        .map((d) => {
          const days = Math.max(
              1,
              Math.ceil((new Date(d.examDate + 'T23:59:59Z') - new Date()) / 86400000),
            ),
            unseen = fresh.filter((c) => c.deckId === d.id).length;
          return {
            deckId: d.id,
            title: d.title,
            examDate: d.examDate,
            days,
            unseen,
            suggestedNewPerDay: Math.ceil(unseen / days),
            past: d.examDate < new Date().toISOString().slice(0, 10),
          };
        }),
    };
  },
  async settings(session, fields) {
    if (!IS_DEMO)
      return request('/api/reviews/settings', {
        method: 'PATCH',
        body: fields,
        csrfToken: session.csrfToken,
      });
    const data = loadDemo(session);
    data.settings = fields;
    saveDemo(session, data);
    return fields;
  },
  async grade(session, cardId, fields) {
    if (!IS_DEMO)
      return request(`/api/reviews/${encodeURIComponent(cardId)}`, {
        method: 'POST',
        body: fields,
        csrfToken: session.csrfToken,
      });
    const workspace = await demoWorkspace.load(session.user.id);
    if (!workspace.decks.some((deck) => deck.cards.some((card) => card.id === cardId)))
      throw new Error('This card could not be found.');
    const data = loadDemo(session),
      current = data.progress[cardId] || { version: 0, history: [] };
    const previous = current.history.find((e) => e.id === fields.reviewId);
    if (previous) return previous;
    if (current.version !== fields.version || current.suspended)
      throw new Error('This card changed. Reload your queue.');
    const result = nextReview(current.schedule, fields.rating, data.settings.retention || 0.9);
    const event = {
      id: fields.reviewId,
      rating: fields.rating,
      at: new Date().toISOString(),
      due: result.card.due,
      version: current.version + 1,
    };
    data.progress[cardId] = {
      ...current,
      schedule: result.card,
      version: current.version + 1,
      history: [...current.history, event],
    };
    saveDemo(session, data);
    return event;
  },
  async suspend(session, cardId, suspended) {
    if (!IS_DEMO)
      return request(`/api/reviews/${encodeURIComponent(cardId)}`, {
        method: 'PATCH',
        body: { suspended },
        csrfToken: session.csrfToken,
      });
    const data = loadDemo(session);
    data.progress[cardId] = { version: 0, history: [], ...data.progress[cardId], suspended };
    data.progress[cardId].version++;
    saveDemo(session, data);
  },
  async reset(session, cardId) {
    if (!IS_DEMO)
      return request(`/api/reviews/${encodeURIComponent(cardId)}`, {
        method: 'PATCH',
        body: { reset: true },
        csrfToken: session.csrfToken,
      });
    const data = loadDemo(session),
      current = data.progress[cardId];
    if (current) {
      delete current.schedule;
      current.version++;
      saveDemo(session, data);
    }
  },
};

const apiBase = (import.meta.env?.VITE_API_BASE_URL || '').replace(/\/+$/, '');
export const imageUrl = (id) =>
  id?.startsWith('data:') ? id : `${apiBase}/api/card-images/${encodeURIComponent(id)}`;
export async function uploadImage(session, file) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024)
    throw new Error('Choose a PNG, JPEG, or WebP image under 2 MB.');
  if (IS_DEMO)
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  const response = await fetch(`${apiBase}/api/card-images`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': file.type, 'X-CSRF-Token': session.csrfToken },
    body: file,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || 'Image upload failed.');
  return result.id;
}
