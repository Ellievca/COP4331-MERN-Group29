import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../state/AuthContext.jsx';
import { useWorkspace } from '../state/WorkspaceContext.jsx';
import { reviewService } from '../services/reviews.js';
import { workspaceService } from '../services/index.js';
import { CardPrompt } from '../components/CardLearning.jsx';
import { AddCardModal } from '../components/Decks.jsx';
import { EmptyState, ErrorMessage, Spinner } from '../components/UI.jsx';

const ratings = [
  [1, 'Again', 'I could not recall it'],
  [2, 'Hard', 'I recalled it with difficulty'],
  [3, 'Good', 'I recalled it normally'],
  [4, 'Easy', 'I recalled it effortlessly'],
];
export default function ReviewsPage({ deckId }) {
  const { session } = useAuth(),
    { decks, courses, reload: refreshWorkspace } = useWorkspace();
  const [courseId, setCourseId] = useState(''),
    [data, setData] = useState(null),
    [settings, setSettings] = useState(null);
  const [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true);
  const [active, setActive] = useState(null),
    [index, setIndex] = useState(0),
    [answers, setAnswers] = useState([]),
    [finished, setFinished] = useState(false),
    [saved, setSaved] = useState(false);
  const [revealed, setRevealed] = useState(false),
    [typed, setTyped] = useState(''),
    [editing, setEditing] = useState(null);
  const inFlight = useRef(false);
  const reload = useCallback(async () => {
    setError('');
    try {
      const result = await reviewService.load(session, { deckId, courseId });
      setData(result);
      setSettings(result.settings);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setLoading(false);
    }
  }, [session, deckId, courseId]);
  useEffect(() => {
    let current = true;
    setLoading(true);
    reviewService
      .load(session, { deckId, courseId })
      .then((result) => {
        if (current) {
          setData(result);
          setSettings(result.settings);
          setError('');
        }
      })
      .catch((e) => {
        if (current) setError(e.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [session, deckId, courseId]);
  async function start(practice = false) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      let queue = data.queue;
      if (practice) {
        const chosen = decks.filter(
          (d) => (!deckId || d.id === deckId) && (!courseId || d.courseId === courseId),
        );
        queue = (
          await Promise.all(
            chosen.map(async (deck) =>
              (await workspaceService.getCards(session, deck.id)).map((card) => ({
                ...card,
                deckId: deck.id,
                deckTitle: deck.title,
              })),
            ),
          )
        )
          .flat()
          .slice(0, 200);
      }
      if (!queue.length)
        throw new Error(
          practice
            ? 'Add flashcards to start practicing.'
            : 'No cards are due right now. Try free practice or come back later.',
        );
      const sessionIds = Object.fromEntries(
        [...new Set(queue.map((c) => c.deckId))].map((id) => [id, crypto.randomUUID()]),
      );
      setActive({
        queue: queue.map((card) => ({ ...card, reviewId: crypto.randomUUID() })),
        practice,
        sessionIds,
        startedAt: new Date().toISOString(),
      });
      setIndex(0);
      setAnswers([]);
      setFinished(false);
      setSaved(false);
      setRevealed(false);
      setTyped('');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  async function saveSummary(records) {
    const groups = new Map();
    for (const answer of records) {
      if (!groups.has(answer.deckId)) groups.set(answer.deckId, []);
      groups.get(answer.deckId).push(answer);
    }
    for (const [id, items] of groups) {
      const deck = decks.find((d) => d.id === id);
      await workspaceService.recordSession(session, {
        clientSessionId: active.sessionIds[id],
        deckId: id,
        courseId: deck?.courseId || null,
        startedAt: active.startedAt,
        endedAt: new Date().toISOString(),
        cardsReviewed: items.length,
        cardsCorrect: items.filter((a) => a.rating > 1).length,
      });
    }
    await refreshWorkspace();
    setSaved(true);
  }
  async function grade(rating) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    try {
      const card = active.queue[index];
      if (!active.practice)
        await reviewService.grade(session, card.id, {
          reviewId: card.reviewId,
          rating,
          version: card.version,
        });
      const next = [...answers, { cardId: card.id, deckId: card.deckId, rating }];
      setAnswers(next);
      setIndex(index + 1);
      setRevealed(false);
      setTyped('');
      if (index + 1 >= active.queue.length) {
        setFinished(true);
        await saveSummary(next);
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  async function finish() {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setFinished(true);
    try {
      await saveSummary(answers);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  }
  async function saveSettings(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await reviewService.settings(session, settings);
      await reload();
      setNotice('Study preferences saved.');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  async function suspend(card) {
    setBusy(true);
    setError('');
    try {
      await reviewService.suspend(session, card.id, !card.suspended);
      await reload();
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  if (loading) return <Spinner label="Preparing your review queue…" />;
  if (!data)
    return (
      <>
        <ErrorMessage>{error}</ErrorMessage>
        <button className="button primary" onClick={reload}>
          Try again
        </button>
      </>
    );
  if (active && finished)
    return (
      <section className="learning-panel">
        <h1>{active.practice ? 'Practice complete' : 'Review complete'}</h1>
        <p>
          {answers.length} cards reviewed · {answers.filter((a) => a.rating > 1).length} recalled.
        </p>
        <ErrorMessage>{error}</ErrorMessage>
        <p>
          {saved
            ? 'Study history saved.'
            : 'Your scheduled reviews are saved individually. Save your session summary below.'}
        </p>
        {!saved && (
          <button className="button primary" disabled={busy} onClick={finish}>
            {busy ? 'Saving…' : 'Save summary'}
          </button>
        )}
        <button
          className="button secondary"
          disabled={busy}
          onClick={() => {
            setActive(null);
            reload();
          }}
        >
          Back to review queue
        </button>
      </section>
    );
  if (active) {
    const card = active.queue[index];
    return (
      <section className="recall-session">
        <div className="page-heading">
          <div>
            <span className="eyebrow">
              {active.practice ? 'FREE PRACTICE · SCHEDULE UNCHANGED' : 'SPACED REVIEW'}
            </span>
            <h1>{card.deckTitle}</h1>
            <p>
              Card {index + 1} of {active.queue.length}
            </p>
          </div>
          <button className="button secondary" disabled={busy} onClick={finish}>
            Finish session
          </button>
        </div>
        <ErrorMessage>{error}</ErrorMessage>
        {error && (
          <button
            className="text-link"
            disabled={busy}
            onClick={() => {
              setActive(null);
              reload();
            }}
          >
            Reload queue
          </button>
        )}
        <article className="learning-panel">
          <CardPrompt card={card} revealed={revealed} />
          {!revealed ? (
            <>
              <div className="field">
                <label htmlFor="recall-answer">
                  {card.kind === 'application'
                    ? 'Your solution and reasoning (optional)'
                    : 'Recall the answer before revealing it (optional)'}
                </label>
                <textarea
                  id="recall-answer"
                  rows={3}
                  value={typed}
                  onChange={(e) => setTyped(e.target.value)}
                />
              </div>
              <button className="button primary" onClick={() => setRevealed(true)}>
                Reveal answer
              </button>
            </>
          ) : (
            <>
              {typed && (
                <aside className="recall-explanation">
                  <strong>Your answer</strong>
                  <p>{typed}</p>
                </aside>
              )}
              <p>
                Compare your answer, then rate your recall. Choose Again if you forgot it; Hard
                means you remembered.
              </p>
              <div className="rating-buttons">
                {ratings.map(([value, label, hint]) => (
                  <button
                    className={`button ${value === 3 ? 'primary' : 'secondary'}`}
                    key={value}
                    title={hint}
                    disabled={busy}
                    onClick={() => grade(value)}
                  >
                    {label}
                    <small>{hint}</small>
                  </button>
                ))}
              </div>
            </>
          )}
        </article>
        <p className="field-help">
          {active.practice
            ? 'Free practice does not change due dates.'
            : 'Each rating saves the next review date immediately.'}
        </p>
      </section>
    );
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">REMEMBER FOR LONGER</span>
          <h1>{deckId ? decks.find((d) => d.id === deckId)?.title || 'Review' : 'Daily review'}</h1>
          <p>
            {data.dueCount} due · {data.newCount} unseen · {data.introducedToday} new cards started
            today
          </p>
        </div>
        {deckId && (
          <Link className="button secondary" to={`/app/decks/${deckId}`}>
            Back to deck
          </Link>
        )}
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {notice && <p role="status">{notice}</p>}
      {!deckId && (
        <div className="field">
          <label htmlFor="review-course">Review course</label>
          <select id="review-course" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code || c.name}
              </option>
            ))}
          </select>
        </div>
      )}
      <section className="learning-panel">
        <h2>
          {data.queue.length ? `${data.queue.length} cards ready` : 'You’re caught up for now'}
        </h2>
        <p>
          FSRS schedules reviews from your recall ratings. New cards are limited each day to keep
          the workload manageable.
        </p>
        <div className="button-group">
          <button
            className="button primary"
            disabled={busy || !data.queue.length}
            onClick={() => start(false)}
          >
            Start scheduled review
          </button>
          <button className="button secondary" disabled={busy} onClick={() => start(true)}>
            Free practice
          </button>
          <button className="button secondary" disabled={busy} onClick={reload}>
            Refresh queue
          </button>
        </div>
      </section>
      <details className="learning-panel">
        <summary>Study preferences</summary>
        <form onSubmit={saveSettings}>
          <div className="field">
            <label htmlFor="retention">
              Desired retention ({Math.round(settings.retention * 100)}%)
            </label>
            <input
              id="retention"
              type="range"
              min="80"
              max="97"
              value={Math.round(settings.retention * 100)}
              onChange={(e) =>
                setSettings({ ...settings, retention: Number(e.target.value) / 100 })
              }
            />
            <small>
              A scheduling estimate, not a guaranteed score. Higher targets mean more reviews.
            </small>
          </div>
          <div className="field">
            <label htmlFor="daily-new">Maximum new cards per day</label>
            <input
              id="daily-new"
              type="number"
              min="0"
              max="100"
              required
              value={settings.newCardsPerDay}
              onChange={(e) => setSettings({ ...settings, newCardsPerDay: Number(e.target.value) })}
            />
          </div>
          <div className="field">
            <label htmlFor="study-timezone">Day boundary / time zone</label>
            <input
              id="study-timezone"
              required
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
            />
            <button
              className="text-link"
              type="button"
              onClick={() =>
                setSettings({
                  ...settings,
                  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                })
              }
            >
              Use this device’s time zone
            </button>
          </div>
          <label>
            <input
              type="checkbox"
              checked={settings.interleave}
              onChange={(e) => setSettings({ ...settings, interleave: e.target.checked })}
            />{' '}
            Mix cards from different decks
          </label>
          <p>
            <button className="button primary" disabled={busy}>
              Save preferences
            </button>
          </p>
        </form>
      </details>
      {data.plans.length > 0 && (
        <section className="learning-panel">
          <h2>Exam preparation</h2>
          {data.plans.map((plan) => (
            <p key={plan.deckId}>
              <strong>{plan.title}</strong> · {plan.examDate}:{' '}
              {plan.past
                ? 'This exam date has passed. Update it in Edit deck.'
                : `${plan.unseen} unseen cards over ${plan.days} days: aim to introduce ${plan.suggestedNewPerDay} per day, in addition to due reviews. This is a workload guide, not a readiness score.`}
            </p>
          ))}
        </section>
      )}
      <section className="learning-panel">
        <h2>Cards to repair</h2>
        <p>
          After five lapses, reconsider the question: test one idea, split long answers into several
          cards, add a concrete example, or use a cloze. You can pause a card while you rewrite it.
        </p>
        {!data.repair.length ? (
          <p>No struggling cards flagged yet.</p>
        ) : (
          data.repair.map((card) => (
            <article className="repair-card" key={card.id}>
              <strong>{card.front}</strong>
              <p>
                {card.deckTitle} · {card.lapses} lapses {card.suspended ? '· paused' : ''}
              </p>
              <div className="button-group">
                <button className="button secondary" onClick={() => setEditing(card)}>
                  Edit card
                </button>
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    setError('');
                    try {
                      await reviewService.reset(session, card.id);
                      await reload();
                    } catch (e) {
                      setError(e.message);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Restart learning
                </button>
                <button className="button secondary" disabled={busy} onClick={() => suspend(card)}>
                  {card.suspended ? 'Resume reviews' : 'Pause reviews'}
                </button>
              </div>
            </article>
          ))
        )}
      </section>
      {editing && (
        <AddCardModal
          deck={decks.find((d) => d.id === editing.deckId)}
          card={editing}
          onClose={() => setEditing(null)}
          onAdded={reload}
        />
      )}
    </>
  );
}
