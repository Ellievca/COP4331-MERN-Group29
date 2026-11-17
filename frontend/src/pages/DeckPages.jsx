import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Layers, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useWorkspace } from '../state/WorkspaceContext.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { workspaceService } from '../services/index.js';
import { courseFor } from '../lib/format.js';
import { EmptyState, ErrorMessage, Modal, Spinner } from '../components/UI.jsx';
import { AddCardModal, CreateDeckModal } from '../components/Decks.jsx';
import ReviewsPage from './ReviewsPage.jsx';

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
  const [editingDeck, setEditingDeck] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
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
          <button className="button secondary" onClick={() => setEditingDeck(true)}>
            <Pencil size={16} />
            Edit deck
          </button>
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
                  <div className="flashcard-actions">
                    <button
                      className="icon-button"
                      aria-label={`Edit flashcard ${index + 1}`}
                      onClick={() => setEditingCard(card)}
                    >
                      <Pencil size={16} />
                    </button>
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
                  </div>
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
      {editingDeck && <CreateDeckModal deck={deck} onClose={() => setEditingDeck(false)} />}
      {editingCard && (
        <AddCardModal
          deck={deck}
          card={editingCard}
          onClose={() => setEditingCard(null)}
          onAdded={reload}
        />
      )}
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
  return <ReviewsPage deckId={id} />;
}
