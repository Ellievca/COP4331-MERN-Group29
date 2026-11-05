import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowDownWideNarrow,
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Clock3,
  Layers,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../state/AuthContext.jsx';
import { useWorkspace } from '../state/WorkspaceContext.jsx';
import {
  DeckCard,
  CreateDeckModal,
  DeleteDeckModal,
  CreateCourseModal,
} from '../components/Decks.jsx';
import { EmptyState } from '../components/UI.jsx';
import { dateLabel, filterDecks, firstName, isToday, withinLastWeek } from '../lib/format.js';

function PageHeading({ eyebrow, title, subtitle, children }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
export { PageHeading };

function DailyRhythm({ sessions }) {
  const reviewed = sessions
    .filter((session) => isToday(session.startedAt))
    .reduce((sum, session) => sum + session.cardsReviewed, 0);
  const progress = Math.min(reviewed / 20, 1);
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  return (
    <aside className="rhythm-panel">
      <div className="panel-title">
        <h2>Your daily rhythm</h2>
        <span>
          <Target size={16} />
        </span>
      </div>
      <p>Small steps add up.</p>
      <div className="goal-ring">
        <svg viewBox="0 0 160 160" aria-hidden="true">
          <circle cx="80" cy="80" r="68" fill="none" stroke="#efebf8" strokeWidth="9" />
          <circle
            cx="80"
            cy="80"
            r="68"
            fill="none"
            stroke="#8664d9"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={`${progress * 427.26} 427.26`}
            transform="rotate(-90 80 80)"
          />
        </svg>
        <div>
          <strong>
            {reviewed}
            <span>/ 20</span>
          </strong>
          <span>cards reviewed</span>
        </div>
      </div>
      <div className="goal-label">
        <span className="tiny-star">✦</span>
        {reviewed >= 20
          ? 'Daily goal reached. Look at you go!'
          : `${20 - reviewed} more cards to your daily goal`}
      </div>
      <div className="week-strip">
        {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((label, index) => {
          const date = new Date(monday);
          date.setDate(monday.getDate() + index);
          const practiced = sessions.some(
            (session) => new Date(session.startedAt).toDateString() === date.toDateString(),
          );
          return (
            <div
              key={index}
              className={`${isToday(date) ? 'today' : ''} ${practiced ? 'practiced' : ''}`}
              title={`${dateLabel(date)}${practiced ? ' · studied' : ''}`}
            >
              <span>{label}</span>
              <span>{practiced ? <Check size={13} /> : date.getDate()}</span>
            </div>
          );
        })}
      </div>
      <div className="rhythm-tip">
        <Sparkles size={17} />
        <p>You don’t need a perfect study session. Just a little curiosity.</p>
      </div>
    </aside>
  );
}

export function SessionList({ limit }) {
  const { sessions, decks } = useWorkspace();
  const sorted = [...sessions].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
  const visible = limit ? sorted.slice(0, limit) : sorted;
  if (!sessions.length)
    return (
      <div className="activity-empty">
        <span>
          <Clock3 size={23} />
        </span>
        <div>
          <strong>Your first session is waiting.</strong>
          <p>Review a deck and your progress will show up here.</p>
        </div>
        <Link to="/app/decks" aria-label="Choose a deck to start studying">
          <ArrowRight size={19} />
        </Link>
      </div>
    );
  return (
    <div className="session-list">
      {visible.map((session) => {
        const deck = decks.find((item) => item.id === session.deckId);
        const title = deck?.title || session.deckTitle || 'Study session';
        const minutes = Math.max(
          1,
          Math.round((new Date(session.endedAt) - new Date(session.startedAt)) / 60000),
        );
        return (
          <article className="session-row" key={session.id}>
            <span className="session-icon">
              <BookOpen size={20} />
            </span>
            <div>
              <strong>{title}</strong>
              <span>
                {dateLabel(session.startedAt)} · {minutes} min · {session.cardsReviewed} cards
                reviewed
              </span>
            </div>
            <span className="session-result">
              <Check size={14} />
              {session.cardsCorrect} / {session.cardsReviewed} recalled
            </span>
            {deck && (
              <Link to={`/app/decks/${deck.id}`} aria-label={`Open ${title}`}>
                <ChevronRight size={19} />
              </Link>
            )}
          </article>
        );
      })}
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { decks, courses, sessions } = useWorkspace();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const totalCards = decks.reduce((sum, deck) => sum + deck.cardCount, 0);
  const weekReviewed = sessions
    .filter((session) => withinLastWeek(session.startedAt))
    .reduce((sum, session) => sum + session.cardsReviewed, 0);
  const recommended = filterDecks(decks).find((deck) => deck.cardCount > 0);
  return (
    <>
      <PageHeading
        eyebrow="A FRESH PAGE, EVERY DAY"
        title={
          <>
            Let’s get in sync, {firstName(user)}
            <span className="greeting-spark">✦</span>
          </>
        }
        subtitle="A little focus today. A little more confidence tomorrow."
      >
        <button className="button primary" onClick={() => setCreateOpen(true)}>
          <Plus size={17} />
          Create deck
        </button>
      </PageHeading>
      <section className="study-hero">
        <div className="hero-copy">
          <span className="eyebrow">
            <span className="tiny-star">✦</span> MAKE ROOM FOR YOUR NEXT AHA
          </span>
          <h2>
            Small sessions.
            <br />
            Big lightbulb moments.
          </h2>
          <p>
            Pick a deck, find your rhythm,
            <br className="desktop-break" /> and make a little progress.
          </p>
          <Link
            className="button hero-button"
            to={recommended ? `/app/study/${recommended.id}` : '/app/decks'}
          >
            <BookOpen size={17} />
            Let’s study
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="hero-art" aria-hidden="true">
          <span className="hero-orbit" />
          <span className="hero-doodle">✧</span>
          <div className="hero-back-card" />
          <div className="hero-flashcard">
            <span className="flashcard-mini-label">
              <span />
              THE POWER OF A LITTLE PRACTICE
            </span>
            <span className="flashcard-code">{'{ aha! }'}</span>
            <strong>Make it stick.</strong>
            <div>
              <span>one card at a time</span>
              <Sparkles size={16} />
            </div>
          </div>
          <span className="hero-art-label">
            <Check size={13} /> A little more confident.
          </span>
        </div>
      </section>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon purple">
            <BookOpen size={21} />
          </span>
          <div>
            <span>My decks</span>
            <strong>
              {decks.length}
              <small>places to begin</small>
            </strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon blue">
            <Layers size={21} />
          </span>
          <div>
            <span>Total flashcards</span>
            <strong>
              {totalCards}
              <small>little lightbulb moments</small>
            </strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon peach">
            <TrendingUp size={21} />
          </span>
          <div>
            <span>Reviewed this week</span>
            <strong>
              {weekReviewed}
              <small>one step further</small>
            </strong>
          </div>
        </div>
      </div>
      <div className="overview-columns">
        <section className="decks-section">
          <div className="section-heading">
            <div>
              <h2>Pick up a little knowledge</h2>
              <p>Your decks, ready when you are.</p>
            </div>
            <Link to="/app/decks" className="text-link">
              View all
              <ArrowRight size={15} />
            </Link>
          </div>
          {decks.length ? (
            <div className="deck-grid overview-decks">
              {filterDecks(decks)
                .slice(0, 4)
                .map((deck) => (
                  <DeckCard key={deck.id} deck={deck} courses={courses} onDelete={setDeleting} />
                ))}
            </div>
          ) : (
            <EmptyState
              title="A fresh start for your ideas."
              action={
                <button className="button primary" onClick={() => setCreateOpen(true)}>
                  <Plus size={16} />
                  Create your first deck
                </button>
              }
            >
              Start with one topic. Add a few cards. See where it takes you.
            </EmptyState>
          )}
        </section>
        <DailyRhythm sessions={sessions} />
      </div>
      <section className="activity-section">
        <div className="section-heading">
          <div>
            <h2>A little progress lately</h2>
            <p>Every study session counts.</p>
          </div>
          <Link to="/app/sessions" className="text-link">
            View history
            <ArrowRight size={15} />
          </Link>
        </div>
        <SessionList limit={3} />
      </section>
      {createOpen && <CreateDeckModal onClose={() => setCreateOpen(false)} />}
      {deleting && <DeleteDeckModal deck={deleting} onClose={() => setDeleting(null)} />}
    </>
  );
}

export function LibraryPage() {
  const { decks, courses } = useWorkspace();
  const [params, setParams] = useSearchParams();
  const query = params.get('q') || '';
  const [courseId, setCourseId] = useState('all');
  const [sort, setSort] = useState('recent');
  const [createOpen, setCreateOpen] = useState(false);
  const [courseOpen, setCourseOpen] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const visible = filterDecks(decks, { query, courseId, sort });
  const filtered = query || courseId !== 'all';
  return (
    <>
      <PageHeading
        eyebrow="KNOWLEDGE, NICELY ORGANIZED"
        title="A home for every aha."
        subtitle="Your courses and curiosities, one deck at a time."
      >
        <div className="button-group">
          <button className="button secondary" onClick={() => setCourseOpen(true)}>
            <Plus size={16} />
            New course
          </button>{' '}
          <button className="button primary" onClick={() => setCreateOpen(true)}>
            <Plus size={17} />
            Create deck
          </button>
        </div>
      </PageHeading>
      <div className="library-toolbar">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search decks"
            placeholder="Find a deck, find your focus…"
            value={query}
            onChange={(event) =>
              setParams(event.target.value ? { q: event.target.value } : {}, { replace: true })
            }
          />
        </div>
        <div className="sort-field">
          <ArrowDownWideNarrow size={16} />
          <select
            aria-label="Sort decks"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="recent">Recently updated</option>
            <option value="title">Title: A to Z</option>
            <option value="cards">Most cards</option>
          </select>
        </div>
      </div>
      <div className="filter-row">
        <div className="course-filters" role="group" aria-label="Filter by course">
          <button
            aria-pressed={courseId === 'all'}
            className={courseId === 'all' ? 'selected' : ''}
            onClick={() => setCourseId('all')}
          >
            All decks<span>{decks.length}</span>
          </button>
          {courses.map((course) => (
            <button
              key={course.id}
              aria-pressed={courseId === course.id}
              className={courseId === course.id ? 'selected' : ''}
              onClick={() => setCourseId(course.id)}
            >
              <span className={`course-dot ${course.color || 'purple'}`} />
              {course.code || course.name}
            </button>
          ))}
        </div>
        <span className="result-count" role="status">
          {visible.length} {visible.length === 1 ? 'deck' : 'decks'}
        </span>
      </div>
      {visible.length ? (
        <div className="deck-grid library-decks">
          {visible.map((deck) => (
            <DeckCard key={deck.id} deck={deck} courses={courses} onDelete={setDeleting} />
          ))}
          <button className="create-deck-tile" onClick={() => setCreateOpen(true)}>
            <span>
              <Plus size={25} />
            </span>
            <strong>A little space for something new.</strong>
            <span>
              Create a deck
              <ArrowRight size={14} />
            </span>
          </button>
        </div>
      ) : (
        <EmptyState
          icon={filtered ? Search : BookOpen}
          title={filtered ? 'No decks found. A fresh search?' : 'Your ideas belong here.'}
          action={
            filtered ? (
              <button
                className="button secondary"
                onClick={() => {
                  setParams({});
                  setCourseId('all');
                }}
              >
                Clear filters
              </button>
            ) : (
              <button className="button primary" onClick={() => setCreateOpen(true)}>
                Create your first deck
                <Plus size={16} />
              </button>
            )
          }
        >
          {filtered
            ? 'Try a different title or description, or choose another course.'
            : 'Create a deck and add your first flashcard to get started.'}
        </EmptyState>
      )}
      {createOpen && <CreateDeckModal onClose={() => setCreateOpen(false)} />}
      {courseOpen && <CreateCourseModal onClose={() => setCourseOpen(false)} />}
      {deleting && <DeleteDeckModal deck={deleting} onClose={() => setDeleting(null)} />}
    </>
  );
}

export function SessionsPage() {
  const { sessions } = useWorkspace();
  const reviewed = sessions.reduce((sum, session) => sum + session.cardsReviewed, 0);
  const correct = sessions.reduce((sum, session) => sum + session.cardsCorrect, 0);
  return (
    <>
      <PageHeading
        eyebrow="LOOK HOW FAR YOU’VE COME"
        title="Little sessions. Real progress."
        subtitle="A record of the time you made for learning."
      >
        <Link className="button primary" to="/app/decks">
          <BookOpen size={17} />
          Start studying
        </Link>
      </PageHeading>
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-icon purple">
            <Clock3 size={21} />
          </span>
          <div>
            <span>Completed sessions</span>
            <strong>{sessions.length}</strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon blue">
            <Layers size={21} />
          </span>
          <div>
            <span>Cards reviewed</span>
            <strong>{reviewed}</strong>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon peach">
            <Target size={21} />
          </span>
          <div>
            <span>Recall rate</span>
            <strong>
              {reviewed ? `${Math.round((correct / reviewed) * 100)}%` : '—'}
              <small>based on your self-checks</small>
            </strong>
          </div>
        </div>
      </div>
      <div className="section-heading">
        <div>
          <h2>Your study history</h2>
          <p>Small steps worth remembering.</p>
        </div>
      </div>
      <SessionList />
    </>
  );
}
