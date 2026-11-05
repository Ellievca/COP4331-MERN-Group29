import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Braces, CircuitBoard, GitFork, Layers, Plus, Trash2 } from 'lucide-react';
import { Modal, ErrorMessage } from './UI.jsx';
import { useWorkspace } from '../state/WorkspaceContext.jsx';
import { courseFor } from '../lib/format.js';

const courseIcon = (code) =>
  code === 'COP4331'
    ? Braces
    : code === 'COP3503'
      ? GitFork
      : code === 'CDA3103'
        ? CircuitBoard
        : Layers;

export function CreateCourseModal({ onClose }) {
  const { createCourse } = useWorkspace();
  const [fields, setFields] = useState({ name: '', code: '', color: 'purple' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!fields.name.trim() || !fields.code.trim()) {
      setError('Enter a course name and code.');
      return;
    }
    setBusy(true);
    try {
      await createCourse({
        name: fields.name.trim(),
        code: fields.code.trim().toUpperCase(),
        color: fields.color,
      });
      onClose();
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title="A home for a new course."
      subtitle="Organize related decks under one course."
      onClose={onClose}
    >
      <ErrorMessage>{error}</ErrorMessage>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="course-name">Course name</label>
          <input
            id="course-name"
            value={fields.name}
            onChange={(event) => setFields({ ...fields, name: event.target.value })}
            required
            maxLength={100}
            placeholder="e.g. Software Engineering"
          />
        </div>
        <div className="field">
          <label htmlFor="course-code">Course code</label>
          <input
            id="course-code"
            value={fields.code}
            onChange={(event) => setFields({ ...fields, code: event.target.value })}
            required
            maxLength={30}
            placeholder="e.g. COP4331"
          />
        </div>
        <div className="field">
          <label htmlFor="course-color">Color</label>
          <select
            id="course-color"
            value={fields.color}
            onChange={(event) => setFields({ ...fields, color: event.target.value })}
          >
            <option value="purple">Lavender</option>
            <option value="blue">Blue</option>
            <option value="peach">Peach</option>
          </select>
        </div>
        <div className="modal-actions">
          <button className="button secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            {busy ? 'Saving…' : 'Create course'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function DeckCard({ deck, courses, onDelete }) {
  const course = courseFor(courses, deck);
  const Icon = courseIcon(course?.code);
  return (
    <article className="deck-card">
      <div className="deck-card-top">
        <span className={`deck-symbol ${course?.color || 'purple'}`}>
          <Icon size={24} strokeWidth={1.65} />
        </span>
        <button
          className="icon-button delete-deck"
          onClick={() => onDelete(deck)}
          aria-label={`Delete ${deck.title}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
      <span className={`course-label ${course?.color || 'purple'}`}>
        {course?.code || 'PERSONAL DECK'}
      </span>
      <h3>
        <Link to={`/app/decks/${deck.id}`}>{deck.title}</Link>
      </h3>
      <p>{deck.description || 'A blank canvas for your next lightbulb moment.'}</p>
      <div className="deck-card-bottom">
        <span>
          <Layers size={14} />
          {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
        </span>
        <Link
          to={deck.cardCount ? `/app/study/${deck.id}` : `/app/decks/${deck.id}`}
          aria-label={`${deck.cardCount ? 'Study' : 'Add cards to'} ${deck.title}`}
        >
          {deck.cardCount ? 'Study' : 'Add cards'}
          <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

export function CreateDeckModal({ onClose, onCreated }) {
  const { courses, createDeck } = useWorkspace();
  const [fields, setFields] = useState({ title: '', description: '', courseId: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!fields.title.trim()) {
      setError('Give your deck a title first.');
      return;
    }
    setBusy(true);
    try {
      const deck = await createDeck({
        title: fields.title.trim(),
        description: fields.description.trim(),
        courseId: fields.courseId || null,
      });
      onCreated?.(deck);
      onClose();
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Something new to learn."
      subtitle="Give your ideas a home. You can add flashcards next."
      onClose={onClose}
    >
      <ErrorMessage>{error}</ErrorMessage>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="deck-title">Deck title</label>
          <input
            id="deck-title"
            autoFocus
            value={fields.title}
            onChange={(event) => setFields({ ...fields, title: event.target.value })}
            placeholder="e.g. Midterm essentials"
            required
            maxLength={80}
          />
        </div>
        <div className="field">
          <label htmlFor="deck-course">
            Course <span className="optional">optional</span>
          </label>
          <select
            id="deck-course"
            value={fields.courseId}
            onChange={(event) => setFields({ ...fields, courseId: event.target.value })}
          >
            <option value="">Personal deck</option>
            {courses.map((course) => (
              <option value={course.id} key={course.id}>
                {course.code} · {course.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="deck-description">
            Description <span className="optional">optional</span>
          </label>
          <textarea
            id="deck-description"
            value={fields.description}
            onChange={(event) => setFields({ ...fields, description: event.target.value })}
            placeholder="What are we learning?"
            rows={3}
            maxLength={240}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            <Plus size={16} />
            {busy ? 'Creating…' : 'Create deck'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function AddCardModal({ deck, onClose, onAdded }) {
  const { addCard } = useWorkspace();
  const [fields, setFields] = useState({ front: '', back: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setError('');
    if (!fields.front.trim() || !fields.back.trim()) {
      setError('Add both a question and an answer.');
      return;
    }
    setBusy(true);
    try {
      await addCard(deck.id, { front: fields.front.trim(), back: fields.back.trim() });
      await onAdded();
      onClose();
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title="One more lightbulb moment."
      subtitle={`Add a flashcard to ${deck.title}.`}
      onClose={onClose}
    >
      <ErrorMessage>{error}</ErrorMessage>
      <form onSubmit={submit}>
        <div className="field">
          <label htmlFor="card-front">Front · question or term</label>
          <textarea
            id="card-front"
            autoFocus
            value={fields.front}
            onChange={(event) => setFields({ ...fields, front: event.target.value })}
            placeholder="What do you want to remember?"
            required
            rows={3}
            maxLength={1000}
          />
        </div>
        <div className="field">
          <label htmlFor="card-back">Back · answer or definition</label>
          <textarea
            id="card-back"
            value={fields.back}
            onChange={(event) => setFields({ ...fields, back: event.target.value })}
            placeholder="The lightbulb moment goes here…"
            required
            rows={4}
            maxLength={3000}
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="button secondary" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="button primary" disabled={busy}>
            <Plus size={16} />
            {busy ? 'Saving…' : 'Add flashcard'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DeleteDeckModal({ deck, onClose }) {
  const { deleteDeck } = useWorkspace();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  async function remove() {
    setBusy(true);
    try {
      await deleteDeck(deck.id);
      onClose();
    } catch (failure) {
      setError(failure.message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title="Ready to let this one go?"
      subtitle={`Delete “${deck.title}” and its ${deck.cardCount} flashcards? This cannot be undone.`}
      onClose={onClose}
    >
      <ErrorMessage>{error}</ErrorMessage>
      <div className="modal-actions">
        <button className="button secondary" onClick={onClose} disabled={busy} autoFocus>
          Keep deck
        </button>
        <button className="button danger" onClick={remove} disabled={busy}>
          {busy ? 'Deleting…' : 'Delete deck'}
        </button>
      </div>
    </Modal>
  );
}
