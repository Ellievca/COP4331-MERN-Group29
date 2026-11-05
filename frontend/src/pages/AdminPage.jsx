import { useCallback, useEffect, useState } from 'react';
import { Search, ShieldCheck, Users, BookOpen, Clock3 } from 'lucide-react';
import { useAuth } from '../state/AuthContext.jsx';
import { adminService } from '../services/index.js';
import { PageHeading } from './Dashboard.jsx';
import { EmptyState, ErrorMessage, Modal, Spinner } from '../components/UI.jsx';

export default function AdminPage() {
  const { session, user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [target, setTarget] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (user.role !== 'admin') return;
    try {
      setData(await adminService.load(session));
      setError('');
    } catch (failure) {
      setError(failure.message);
    }
  }, [session, user.role]);
  useEffect(() => {
    load();
  }, [load]);
  if (user.role !== 'admin')
    return (
      <EmptyState
        icon={ShieldCheck}
        title="This space is for administrators."
        action="Back to overview"
        to="/app"
      >
        Your current account does not have administrator access.
      </EmptyState>
    );
  async function changeActivation() {
    setBusy(true);
    setError('');
    try {
      await adminService.setActive(session, target.id, target.isActive === false);
      await load();
      setTarget(null);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  const visible = (data?.users || []).filter((item) =>
    `${item.firstName} ${item.lastName} ${item.login} ${item.email}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="ADMINISTRATION"
        title="Keep your study space in good hands."
        subtitle="Manage account access and see an overview of the workspace."
      />
      <ErrorMessage>{error}</ErrorMessage>
      {!data ? (
        error ? (
          <button className="button secondary" onClick={load}>
            Try again
          </button>
        ) : (
          <Spinner label="Loading administration…" />
        )
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon purple">
                <Users size={21} />
              </span>
              <div>
                <span>Registered accounts</span>
                <strong>
                  {data.stats.users}
                  <small>{data.stats.activeUsers} active</small>
                </strong>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon blue">
                <BookOpen size={21} />
              </span>
              <div>
                <span>Total decks</span>
                <strong>
                  {data.stats.decks}
                  <small>{data.stats.cards} flashcards</small>
                </strong>
              </div>
            </div>
            <div className="stat-card">
              <span className="stat-icon peach">
                <Clock3 size={21} />
              </span>
              <div>
                <span>Completed sessions</span>
                <strong>{data.stats.sessions}</strong>
              </div>
            </div>
          </div>
          <div className="library-toolbar">
            <div className="search-field">
              <Search size={18} />
              <input
                aria-label="Search users"
                placeholder="Find an account by name, username, or email…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </div>
            <span className="result-count">{visible.length} accounts</span>
          </div>
          <div className="admin-users">
            {visible.map((item) => (
              <article key={item.id} className="admin-user">
                <div>
                  <strong>
                    {item.firstName} {item.lastName}
                  </strong>
                  <span>
                    @{item.login} · {item.email}
                  </span>
                </div>
                <span className={`account-status ${item.isActive === false ? 'disabled' : ''}`}>
                  {item.role === 'admin'
                    ? 'Admin'
                    : item.isActive === false
                      ? 'Disabled'
                      : 'Active'}
                </span>
                {item.role !== 'admin' && (
                  <button className="button secondary" onClick={() => setTarget(item)}>
                    {item.isActive === false ? 'Enable account' : 'Disable account'}
                  </button>
                )}
              </article>
            ))}
            {!visible.length && (
              <EmptyState icon={Users} title="No accounts match that search.">
                Try another name or username.
              </EmptyState>
            )}
          </div>
          <p className="admin-caption">
            Administrator accounts are protected. Roles are assigned through the server’s trusted
            admin command.
          </p>
        </>
      )}
      {target && (
        <Modal
          title={target.isActive === false ? 'Enable this account?' : 'Disable this account?'}
          subtitle={
            target.isActive === false
              ? `${target.firstName} will be able to sign in again.`
              : `${target.firstName} will be signed out and unable to sign in until the account is enabled again. Their study data will be kept.`
          }
          onClose={() => setTarget(null)}
        >
          <ErrorMessage>{error}</ErrorMessage>
          <div className="modal-actions">
            <button className="button secondary" onClick={() => setTarget(null)} disabled={busy}>
              Cancel
            </button>
            <button
              className={`button ${target.isActive === false ? 'primary' : 'danger'}`}
              onClick={changeActivation}
              disabled={busy}
            >
              {busy ? 'Saving…' : target.isActive === false ? 'Enable account' : 'Disable account'}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
