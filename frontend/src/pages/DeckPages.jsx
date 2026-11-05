import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CircleCheck,
  Flag,
  Layers,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useWorkspace } from '../state/WorkspaceContext.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { workspaceService } from '../services/index.js';
import { courseFor } from '../lib/format.js';
import { EmptyState, ErrorMessage, Modal, Spinner } from '../components/UI.jsx';
import { AddCardModal } from '../components/Decks.jsx';

function useCards(deckId) {
  const { session } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const generation = useRef(0);
  const reload = useCallback(async () => {
    const current = ++generation.current;
    try {
      const next = await workspaceService.getCards(session, deckId);
      if (current === generation.current) {
        setCards(next);
        setError('');
      }
    } catch (failure) {
      if (current === generation.current) setError(failure.message);
    } finally {
      if (current === generation.current) setLoading(false);
    }
  }, [deckId, session]);
  useEffect(() => {
    setLoading(true);
    reload();
    return () => {
      generation.current++;
    };
  }, [reload]);
  return { cards, loading, error, reload };
}

export function DeckDetailPage() {
  const { id } = useParams();
  const { decks, courses, deleteCard } = useWorkspace();
  const deck = decks.find((item) => item.id === id);
  const { cards, loading, error, reload } = useCards(id);
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [busy, setBusy] = useState(false);
  if (!deck)
    return (
      <EmptyState title="This deck isn’t here." action="Back to my decks" to="/app/decks">
        It may have been deleted. There’s always something else to learn.
      </EmptyState>
    );
  const course = courseFor(courses, deck);
  const visible = cards.filter((card) =>
    `${card.front} ${card.back}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  async function removeCard() {
    setBusy(true);
    setDeleteError('');
    try {
      await deleteCard(id, deleting.id);
      await reload();
      setDeleting(null);
    } catch (failure) {
      setDeleteError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <Link className="back-link" to="/app/decks">
        <ArrowLeft size={15} />
        Back to my decks
      </Link>
      <div className="page-heading deck-page-heading">
        <div>
          <span className={`course-label ${course?.color || 'purple'}`}>
            {course?.code || 'PERSONAL DECK'}
          </span>
          <h1>{deck.title}</h1>
          <p>{deck.description || 'Your own little collection of knowledge.'}</p>
          <span className="deck-meta">
            <Layers size={14} />
            {cards.length} flashcards<span>•</span>Private deck
          </span>
        </div>
        <div className="button-group">
          <button className="button secondary" onClick={() => setAdding(true)}>
            <Plus size={16} />
            Add flashcard
          </button>
          {cards.length > 0 && (
            <Link className="button primary" to={`/app/study/${id}`}>
              <BookOpen size={17} />
              Study this deck
            </Link>
          )}
        </div>
      </div>
      <ErrorMessage>{error}</ErrorMessage>
      {loading ? (
        <Spinner label="Gathering your flashcards…" />
      ) : !cards.length ? (
        <EmptyState
          title="The first card is the hardest part."
          action={
            <button className="button primary" onClick={() => setAdding(true)}>
              <Plus size={16} />
              Add your first flashcard
            </button>
          }
        >
          Start with one question you want to remember. You can build from there.
        </EmptyState>
      ) : (
        <>
          <div className="library-toolbar">
            <div className="search-field">
              <Search size={18} />
              <input
                aria-label="Search flashcards"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search questions and answers…"
              />
            </div>
            <span className="result-count" role="status">
              {visible.length} {visible.length === 1 ? 'flashcard' : 'flashcards'}
            </span>
          </div>
          {visible.length ? (
            <div className="flashcard-table">
              <div className="flashcard-table-heading">
                <span>QUESTION / TERM</span>
                <span>ANSWER / DEFINITION</span>
                <span />
              </div>
              {visible.map((card, index) => (
                <article className="flashcard-row" key={card.id}>
                  <div>
                    <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
                    <p>{card.front}</p>
                  </div>
                  <p>{card.back}</p>
                  <button
                    className="icon-button"
                    aria-label={`Delete flashcard ${index + 1}`}
                    onClick={() => {
                      setDeleting(card);
                      setDeleteError('');
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={Search}
              title="No flashcards found."
              action={
                <button className="button secondary" onClick={() => setQuery('')}>
                  Clear search
                </button>
              }
            >
              Try another word from a question or answer.
            </EmptyState>
          )}
        </>
      )}
      {adding && <AddCardModal deck={deck} onClose={() => setAdding(false)} onAdded={reload} />}
      {deleting && (
        <Modal
          title="Delete this flashcard?"
          subtitle="This removes both the question and answer. This cannot be undone."
          onClose={() => setDeleting(null)}
        >
          <ErrorMessage>{deleteError}</ErrorMessage>
          <blockquote className="delete-preview">{deleting.front}</blockquote>
          <div className="modal-actions">
            <button
              className="button secondary"
              onClick={() => setDeleting(null)}
              disabled={busy}
              autoFocus
            >
              Keep card
            </button>
            <button className="button danger" onClick={removeCard} disabled={busy}>
              {busy ? 'Deleting…' : 'Delete flashcard'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

export function StudyPage() {
  const { id } = useParams();
  const { decks, courses, recordSession } = useWorkspace();
  const deck = decks.find((item) => item.id === id);
  const { cards, loading, error: loadError, reload } = useCards(id);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [correct, setCorrect] = useState(0);
  const [startedAt, setStartedAt] = useState(() => new Date().toISOString());
  const [clientSessionId, setClientSessionId] = useState(() => crypto.randomUUID());
  const [done, setDone] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!deck)
    return (
      <EmptyState title="This deck isn’t here." action="Choose a deck" to="/app/decks">
        Try another deck to start a study session.
      </EmptyState>
    );
  if (loading) return <Spinner label="Making a little room for focus…" />;
  if (loadError)
    return (
      <>
        <ErrorMessage>{loadError}</ErrorMessage>
        <button className="button secondary" onClick={reload}>
          Try again
        </button>
      </>
    );
  if (!cards.length)
    return (
      <EmptyState
        title="A little empty at the moment."
        action="Add flashcards"
        to={`/app/decks/${id}`}
      >
        Add a few cards to this deck, then come back to study.
      </EmptyState>
    );
  const course = courseFor(courses, deck);
  const card = cards[index];
  async function grade(knew) {
    if (busy) return;
    const nextCorrect = correct + (knew ? 1 : 0);
    if (index < cards.length - 1) {
      setCorrect(nextCorrect);
      setIndex(index + 1);
      setFlipped(false);
      return;
    }
    setBusy(true);
    setError('');
    const session = {
      clientSessionId,
      deckId: id,
      courseId: deck.courseId || null,
      deckTitle: deck.title,
      startedAt,
      endedAt: new Date().toISOString(),
      cardsReviewed: cards.length,
      cardsCorrect: nextCorrect,
    };
    try {
      await recordSession(session);
      setDone(session);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  function restart() {
    setIndex(0);
    setFlipped(false);
    setCorrect(0);
    setStartedAt(new Date().toISOString());
    setClientSessionId(crypto.randomUUID());
    setDone(null);
    setError('');
  }
  return (
    <div className="study-page">
      <Link className="back-link" to={`/app/decks/${id}`}>
        <ArrowLeft size={15} />
        Back to deck
      </Link>
      {done ? (
        <section className="session-complete">
          <span className="complete-art">
            <Sparkles size={43} strokeWidth={1.5} />
            <span>✧</span>
          </span>
          <span className="eyebrow">A LITTLE MORE CONFIDENT</span>
          <h1>Look at you grow.</h1>
          <p>
            You made time for a little learning.
            <br />
            That’s something worth feeling good about.
          </p>
          <div className="completion-stats">
            <div>
              <strong>{done.cardsReviewed}</strong>
              <span>cards reviewed</span>
            </div>
            <div>
              <strong>{done.cardsCorrect}</strong>
              <span>recalled confidently</span>
            </div>
            <div>
              <strong>{Math.round((done.cardsCorrect / done.cardsReviewed) * 100)}%</strong>
              <span>recall rate</span>
            </div>
          </div>
          <span className="saved-note">
            <CircleCheck size={16} />
            Session saved to your study history
          </span>
          <div className="completion-buttons">
            <button className="button secondary" onClick={restart}>
              <RotateCcw size={16} />
              Study again
            </button>
            <Link className="button primary" to="/app">
              Back to overview
              <ArrowRight size={16} />
            </Link>
          </div>
        </section>
      ) : (
        <>
          <div className="study-heading">
            <span className={`course-label ${course?.color || 'purple'}`}>
              {course?.code || 'PERSONAL DECK'}
            </span>
            <h1>{deck.title}</h1>
            <p>One question. A little curiosity. You’ve got this.</p>
          </div>
          <div className="study-progress-label">
            <span>YOUR FOCUS SESSION</span>
            <strong>
              {index + 1}
              <span> / {cards.length} cards</span>
            </strong>
          </div>
          <div
            className="study-progress"
            role="progressbar"
            aria-label="Session progress"
            aria-valuemin={0}
            aria-valuemax={cards.length}
            aria-valuenow={index}
          >
            <span style={{ width: `${(index / cards.length) * 100}%` }} />
          </div>
          <ErrorMessage>{error}</ErrorMessage>
          <button
            className={`study-card ${flipped ? 'revealed' : ''}`}
            onClick={() => setFlipped(!flipped)}
            aria-label={flipped ? 'Show question' : 'Reveal answer'}
            disabled={busy}
          >
            <span className="study-card-label">
              {flipped ? (
                <>
                  <Sparkles size={15} />
                  THE LIGHTBULB MOMENT
                </>
              ) : (
                <>
                  <BookOpen size={15} />A LITTLE QUESTION FOR YOU
                </>
              )}
            </span>
            <span className="study-card-content" aria-live="polite">
              {flipped ? card.back : card.front}
            </span>
            <span className="study-card-hint">
              <RotateCcw size={14} />
              {flipped ? 'Click to see the question' : 'Think it through, then click to reveal'}
            </span>
          </button>
          <div className="study-controls">
            {flipped ? (
              <>
                <p>How did that one feel?</p>
                <div>
                  <button className="button secondary" onClick={() => grade(false)} disabled={busy}>
                    <Flag size={16} />
                    Needs practice
                  </button>
                  <button className="button primary" onClick={() => grade(true)} disabled={busy}>
                    <Check size={17} />
                    {busy ? 'Saving session…' : 'Got it'}
                    {!busy && <ArrowRight size={16} />}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p>No rush. Give yourself a moment to remember.</p>
                <button className="button primary" onClick={() => setFlipped(true)}>
                  Show answer
                  <Sparkles size={16} />
                </button>
              </>
            )}
          </div>
          <div className="study-bottom-note">
            <span />
            <span />A little focus goes a long way.
            <span />
            <span />
          </div>
        </>
      )}
    </div>
  );
}
