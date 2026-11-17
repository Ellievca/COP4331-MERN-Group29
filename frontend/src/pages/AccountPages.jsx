import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { request, IS_DEMO } from '../services/client.js';
import { useAuth } from '../state/AuthContext.jsx';
import { AuthLayout } from './AuthPages.jsx';
import { ErrorMessage } from '../components/UI.jsx';
import GoogleButton from '../components/GoogleButton.jsx';

export function EmailPage({ reset = false }) {
  const { state } = useLocation();
  const { user } = useAuth();
  const [email, setEmail] = useState(state?.email || user?.email || '');
  const [stage, setStage] = useState(state?.sent ? 'code' : 'email');
  const [code, setCode] = useState(''),
    [password, setPassword] = useState(''),
    [confirm, setConfirm] = useState(''),
    [token, setToken] = useState('');
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  async function submit(event, resend = false) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (IS_DEMO)
        throw new Error('Email verification and recovery require the connected application.');
      if (stage === 'email' || resend) {
        const result = await request('/api/auth/email/request', {
          method: 'POST',
          body: { email, purpose: reset ? 'reset' : 'verify' },
        });
        setMessage(result.message);
        setStage('code');
      } else if (stage === 'code') {
        const result = await request(
          reset ? '/api/auth/password/verify' : '/api/auth/email/verify',
          { method: 'POST', body: { email, code } },
        );
        if (reset) {
          setToken(result.resetToken);
          setStage('password');
        } else {
          setStage('done');
          setMessage(result.message);
        }
      } else {
        if (password !== confirm) throw new Error('Your passwords do not match.');
        const result = await request('/api/auth/password/reset', {
          method: 'POST',
          body: { resetToken: token, password },
        });
        setToken('');
        setPassword('');
        setConfirm('');
        setStage('done');
        setMessage(result.message);
      }
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout>
      <h2>{reset ? 'Reset your password' : 'Verify your email'}</h2>
      <p className="auth-subtitle">
        {reset
          ? 'Use the email address you verified for your account. Google-only accounts sign in and recover access through Google.'
          : 'Confirm that this email belongs to you. Codes expire after 10 minutes.'}
      </p>
      <ErrorMessage>{error}</ErrorMessage>
      {message && (
        <p className="success-note" role="status">
          {message}
        </p>
      )}
      {stage !== 'done' && (
        <form onSubmit={submit} aria-busy={busy}>
          <div className="field">
            <label htmlFor="recovery-email">Email address</label>
            <input
              id="recovery-email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              disabled={busy || stage !== 'email'}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          {stage === 'code' && (
            <div className="field">
              <label htmlFor="email-code">Six-digit code</label>
              <input
                id="email-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={busy}
              />
            </div>
          )}
          {stage === 'password' && (
            <>
              <div className="field">
                <label htmlFor="reset-password">New password</label>
                <input
                  id="reset-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={busy}
                />
              </div>
              <div className="field">
                <label htmlFor="reset-confirm">Confirm new password</label>
                <input
                  id="reset-confirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  disabled={busy}
                />
              </div>
            </>
          )}
          <button className="button primary auth-submit" disabled={busy}>
            {busy
              ? 'Please wait…'
              : stage === 'email'
                ? 'Send code'
                : stage === 'code'
                  ? 'Verify code'
                  : 'Save new password'}
          </button>
          {stage === 'code' && (
            <div className="recovery-actions">
              <button
                className="text-link"
                type="button"
                disabled={busy}
                onClick={(e) => submit(e, true)}
              >
                Resend code
              </button>
              <button
                className="text-link"
                type="button"
                disabled={busy}
                onClick={() => {
                  setStage('email');
                  setCode('');
                  setError('');
                }}
              >
                Change email
              </button>
              <small>Wait at least 60 seconds between requests.</small>
            </div>
          )}
        </form>
      )}
      <p className="auth-switch">
        <Link to={user ? '/app/account' : '/login'}>Back to {user ? 'account' : 'sign in'}</Link>
      </p>
    </AuthLayout>
  );
}

export function AccountPage() {
  const { user, session, acceptSession } = useAuth();
  const [fields, setFields] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    login: user.login,
  });
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [message, setMessage] = useState('');
  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (IS_DEMO) throw new Error('Account changes require the connected application.');
      await request('/api/auth/profile', {
        method: 'PATCH',
        body: fields,
        csrfToken: session.csrfToken,
      });
      await acceptSession();
      setMessage('Profile updated.');
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="learning-panel">
      <h1>Your account</h1>
      <p>
        {user.email} · {user.isVerified ? 'Email verified' : 'Email not yet verified'}
      </p>
      {!user.isVerified && (
        <Link className="button secondary" to="/verify-email" state={{ email: user.email }}>
          Verify email
        </Link>
      )}
      <ErrorMessage>{error}</ErrorMessage>
      {message && <p role="status">{message}</p>}
      <form onSubmit={save}>
        {[
          ['firstName', 'First name'],
          ['lastName', 'Last name'],
          ['login', 'Username'],
        ].map(([key, label]) => (
          <div className="field" key={key}>
            <label htmlFor={`profile-${key}`}>{label}</label>
            <input
              id={`profile-${key}`}
              required
              maxLength={key === 'login' ? 32 : 60}
              value={fields[key]}
              onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
            />
          </div>
        ))}
        <button className="button primary" disabled={busy || IS_DEMO}>
          {busy ? 'Saving…' : 'Save profile'}
        </button>
      </form>
      <h2>Google sign-in</h2>
      {user.googleLinked ? (
        <p>Google is linked to this account.</p>
      ) : (
        <>
          <p>Link the Google account with the same email to keep all your existing decks.</p>
          <GoogleButton link />
        </>
      )}
      <p>
        <Link to="/forgot-password" state={{ email: user.email }}>
          Reset password
        </Link>
      </p>
    </section>
  );
}
