import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  ChevronRight,
  CircleHelp,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  X,
} from 'lucide-react';
import { Brand, Modal, Toast } from './UI.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { useWorkspace } from '../state/WorkspaceContext.jsx';
import { initials } from '../lib/format.js';
import { IS_DEMO } from '../services/client.js';

export default function Layout() {
  const { user, logout } = useAuth();
  const { toast, setToast } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const sidebarRef = useRef(null);
  const menuButtonRef = useRef(null);
  const previouslyOpen = useRef(false);
  useEffect(() => {
    if (!menuOpen) {
      if (previouslyOpen.current) menuButtonRef.current?.focus();
      previouslyOpen.current = false;
      return;
    }
    previouslyOpen.current = true;
    const sidebar = sidebarRef.current;
    sidebar.querySelector('.mobile-close')?.focus();
    function trap(event) {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
      if (event.key !== 'Tab') return;
      const focusable = [...sidebar.querySelectorAll('a[href], button:not([disabled])')];
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    sidebar.addEventListener('keydown', trap);
    return () => sidebar.removeEventListener('keydown', trap);
  }, [menuOpen]);
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 901px)');
    const closeOnDesktop = () => {
      if (desktop.matches) setMenuOpen(false);
    };
    desktop.addEventListener('change', closeOnDesktop);
    return () => desktop.removeEventListener('change', closeOnDesktop);
  }, []);
  const location = useLocation();
  const section =
    location.pathname.includes('/decks') || location.pathname.includes('/study/')
      ? 'My decks'
      : location.pathname.includes('/sessions')
        ? 'Study sessions'
        : 'Overview';
  async function signOut() {
    setSigningOut(true);
    try {
      await logout();
    } catch {
      /* Local session is cleared even if the API logout request fails. */
    }
  }
  return (
    <div className="app-layout">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {menuOpen && (
        <button
          className="sidebar-scrim"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        ref={sidebarRef}
        className={`sidebar ${menuOpen ? 'open' : ''}`}
        role={menuOpen ? 'dialog' : undefined}
        aria-modal={menuOpen || undefined}
        aria-label="Workspace navigation"
      >
        <div className="sidebar-brand">
          <Brand />
          <button
            className="icon-button mobile-close"
            onClick={() => {
              setMenuOpen(false);
              menuButtonRef.current?.focus();
            }}
            aria-label="Close navigation"
          >
            <X size={21} />
          </button>
        </div>
        <div className="workspace-label">YOUR WORKSPACE</div>
        <nav aria-label="Main navigation">
          <NavLink end to="/app" onClick={() => setMenuOpen(false)}>
            <LayoutDashboard size={19} />
            Overview
          </NavLink>
          <NavLink to="/app/decks" onClick={() => setMenuOpen(false)}>
            <BookOpen size={19} />
            My decks
          </NavLink>
          <NavLink to="/app/sessions" onClick={() => setMenuOpen(false)}>
            <Clock3 size={19} />
            Study sessions
          </NavLink>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-spark">
              <Sparkles size={21} />
            </span>
            <h3>
              A little every day
              <br />
              goes a long way.
            </h3>
            <p>
              Your next aha moment
              <br />
              is just a card away.
            </p>
            <span className="note-doodle" aria-hidden="true">
              ✧
            </span>
          </div>
          <button className="help-button" onClick={() => setHelpOpen(true)}>
            <CircleHelp size={17} />
            How it works
            <ArrowUpRight size={15} />
          </button>
          <div className="profile">
            <span className="avatar">{initials(user)}</span>
            <div>
              <strong>
                {user.firstName} {user.lastName}
              </strong>
              <span>@{user.login}</span>
            </div>
            <button
              className="icon-button"
              onClick={signOut}
              disabled={signingOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className="app-body" inert={menuOpen}>
        <header className="topbar">
          <div>
            <button
              ref={menuButtonRef}
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(!menuOpen)}
            >
              <Menu size={21} />
            </button>
            <span className="breadcrumb">
              Workspace <ChevronRight size={13} />
              <strong>{section}</strong>
            </span>
          </div>
          <div className="topbar-right">
            {IS_DEMO && (
              <span className="mode-badge">
                <span />
                Local demo
              </span>
            )}
            <span className="topbar-date">
              {new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }).format(new Date())}
            </span>
            <span className="avatar top-avatar">{initials(user)}</span>
          </div>
        </header>
        {IS_DEMO && (
          <div className="demo-strip">
            <span />
            <strong>Local demo</strong>
            <span className="demo-strip-text">
              Your changes stay in this browser. API connection is pending.
            </span>
            <button onClick={() => setHelpOpen(true)}>
              Learn more
              <ArrowUpRight size={12} />
            </button>
          </div>
        )}
        <main id="main-content" className="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        <footer className="app-footer">
          <span>
            <BookOpen size={13} />A little progress, every day.
          </span>
          <span>Made for your next aha.</span>
        </footer>
      </div>
      <Toast message={toast} onClose={() => setToast('')} />
      {helpOpen && (
        <Modal
          title="A little guide to StudySync."
          subtitle="Your courses, your cards, your pace."
          onClose={() => setHelpOpen(false)}
        >
          <div className="help-content">
            <h3>1. Make a deck</h3>
            <p>
              Group flashcards by topic or course. The starter decks are examples you can study,
              build on, or delete.
            </p>
            <h3>2. Make it stick</h3>
            <p>
              Start a session, reveal each answer, then mark whether you knew it or want more
              practice.
            </p>
            <h3>3. See your progress</h3>
            <p>
              Completed sessions appear in your history and count toward your daily goal of 20
              cards.
            </p>
            {IS_DEMO && (
              <div className="demo-help">
                <strong>You’re using local demo mode.</strong>
                <p>
                  Accounts, decks, and sessions live in this browser. Clearing site storage removes
                  them. Demo authentication is for practice; the team’s server will handle real
                  accounts once the API is connected.
                </p>
              </div>
            )}
          </div>
          <button className="button primary full-width" onClick={() => setHelpOpen(false)}>
            Got it
            <Sparkles size={16} />
          </button>
        </Modal>
      )}
    </div>
  );
}
