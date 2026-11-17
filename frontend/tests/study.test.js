import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nextReview, clozeText, dayKey, interleaveCards } from '../../shared/study.js';

test('FSRS rates remembered mature cards further apart and higher retention sooner', () => {
  const now = new Date('2026-11-16T12:00:00Z');
  const schedule = {
    due: now,
    stability: 30,
    difficulty: 5,
    elapsed_days: 30,
    scheduled_days: 30,
    learning_steps: 0,
    reps: 10,
    lapses: 0,
    state: 2,
    last_review: new Date('2026-10-17T12:00:00Z'),
  };
  const hard = nextReview(schedule, 2, 0.9, now).card;
  const good = nextReview(schedule, 3, 0.9, now).card;
  const easy = nextReview(schedule, 4, 0.9, now).card;
  assert.ok(hard.due < good.due && good.due < easy.due);
  assert.ok(nextReview(schedule, 3, 0.97, now).card.due < good.due);
  assert.equal(nextReview(schedule, 1, 0.9, now).card.lapses, 1);
  assert.equal(schedule.reps, 10, 'scheduling does not mutate the input');
  assert.equal(
    nextReview(JSON.parse(JSON.stringify(schedule)), 3, 0.9, now).card.due.toISOString(),
    good.due.toISOString(),
  );
});
test('cloze content reveals only when requested without interpreting HTML', () => {
  const source = 'A {{c1::component}} returns {{c2::JSX}}. <script>test</script>';
  assert.equal(clozeText(source), 'A [ … ] returns [ … ]. <script>test</script>');
  assert.equal(clozeText(source, true), 'A component returns JSX. <script>test</script>');
});
test('mixed review cycles decks without mutating cards or dropping unequal groups', () => {
  const cards = [
    { id: 1, deckId: 'a' },
    { id: 2, deckId: 'a' },
    { id: 3, deckId: 'b' },
    { id: 4, deckId: 'b' },
    { id: 5, deckId: 'b' },
  ];
  assert.deepEqual(
    interleaveCards(cards).map((c) => c.id),
    [1, 3, 2, 4, 5],
  );
  assert.deepEqual(
    cards.map((c) => c.id),
    [1, 2, 3, 4, 5],
  );
});
test('daily new-card accounting respects the selected timezone', () => {
  const when = '2026-11-16T02:00:00Z';
  assert.equal(dayKey(when, 'UTC'), '2026-11-16');
  assert.equal(dayKey(when, 'America/New_York'), '2026-11-15');
});
