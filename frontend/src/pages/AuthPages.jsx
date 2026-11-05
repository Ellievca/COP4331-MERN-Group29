import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Braces,
  Check,
  CircleCheck,
  Eye,
  EyeOff,
  Layers,
  ShieldAlert,
  Sparkles,
  Star,
} from 'lucide-react';
import { Brand, ErrorMessage } from '../components/UI.jsx';
import { useAuth } from '../state/AuthContext.jsx';
import { authService } from '../services/index.js';
import { IS_DEMO } from '../services/client.js';

function AuthLayout({ children }) {
  return (
    <div className="auth-layout">
      <aside className="auth-story">
        <Brand />
        <div className="auth-story-copy">
          <span className="eyebrow">
            <span className="tiny-star">✦</span> A CALMER WAY TO LEARN
          </span>
          <h1>
            Good things
            <br />
            take a little
            <br />
            <span>study time.</span>
          </h1>
          <p>
            A home for your courses, flashcards,
            <br className="desktop-break" /> and those little lightbulb moments.
          </p>
        </div>
        <div className="auth-art" aria-hidden="true">
          <span className="art-orbit orbit-one" />
          <span className="art-orbit orbit-two" />
          <div className="art-card rear-card">
            <span className="art-card-icon peach">
              <Layers size={23} />
            </span>
            <strong>A little more confident.</strong>
          </div>
          <div className="art-card front-card">
            <span className="art-card-course">
              COP4331 <span>•</span> SOFTWARE ENGINEERING
            </span>
            <span className="art-card-icon lilac">
              <Braces size={28} />
            </span>
            <strong>
              What’s your next
              <br />
              lightbulb moment?
            </strong>
            <div className="art-card-footer">
              <span>
                <span className="art-dot" /> One card at a time
              </span>
              <Sparkles size={17} />
            </div>
          </div>
          <span className="art-spark spark-one">✦</span>
          <span className="art-spark spark-two">✧</span>
          <span className="art-mini">
            <Check size={16} /> You’ve got this.
          </span>
        </div>
        <div className="auth-story-footer">
          <span className="small-book">
            <BookOpen size={16} />
          </span>{' '}
          Your courses. Your cards. Your pace.
        </div>
      </aside>
      <main className="auth-main">
        <div className="auth-mobile-brand">
          <Brand compact />
        </div>
        <div className="auth-topline">
          {IS_DEMO && (
            <span className="mode-badge">
              <span /> Local demo
            </span>
          )}
          <span>
            Made for a little more focus <Star size={12} />
          </span>
        </div>
        <div className="auth-form-wrap">{children}</div>
        <footer className="auth-footer">
          A little progress, every day. <span>StudySync © {new Date().getFullYear()}</span>
        </footer>
      </main>
    </div>
  );
}

function PasswordInput({
  id,
  label = 'Password',
  autoComplete = 'current-password',
  minLength,
  value,
  onChange,
  hint,
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="password-wrap">
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={128}
          placeholder={
            autoComplete === 'new-password' ? 'At least 8 characters' : 'Enter your password'
          }
          aria-describedby={hint ? `${id}-hint` : undefined}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible(!visible)}
          aria-label={`${visible ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}

export function LoginPage() {
  const { user, login, restoreError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [fields, setFields] = useState({ login: location.state?.login || '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (user) return <Navigate to="/app" replace />;
  async function signIn(event, demo = false) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(demo ? { login: 'student', password: 'StudySync123!' } : fields);
      navigate('/app', { replace: true });
    } catch (failure) {
      if (failure.status === 401) navigate('/login-error', { state: { login: fields.login } });
      else setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout>
      <span className="form-eyebrow">YOUR STUDY SPACE IS WAITING</span>
      <h2>
        Welcome back<span className="heading-dot">.</span>
      </h2>
      <p className="auth-subtitle">A fresh start, a familiar place. Let’s get in sync.</p>
      {location.state?.registered && (
        <div className="success-note" role="status">
          <CircleCheck size={18} />
          Account created! Sign in to start studying.
        </div>
      )}
      <ErrorMessage>{error || restoreError}</ErrorMessage>
      <form onSubmit={signIn} aria-label="Sign in" aria-busy={busy}>
        <div className="field">
          <label htmlFor="login">Username or email</label>
          <input
            id="login"
            name="username"
            autoComplete="username"
            value={fields.login}
            onChange={(event) => setFields({ ...fields, login: event.target.value })}
            placeholder="Enter your username or email"
            required
            maxLength={254}
          />
        </div>
        <PasswordInput
          id="password"
          value={fields.password}
          onChange={(event) => setFields({ ...fields, password: event.target.value })}
        />
        <button type="submit" className="button primary auth-submit" disabled={busy}>
          {busy ? 'Signing you in…' : 'Sign in'}
          <ArrowRight size={18} />
        </button>
      </form>
      <p className="auth-switch">
        New around here?{' '}
        <Link to="/register">
          Create an account <ArrowRight size={14} />
        </Link>
      </p>
      {IS_DEMO && (
        <div className="demo-panel">
          <div>
            <span className="demo-icon">
              <Sparkles size={18} />
            </span>
            <div>
              <strong>Just taking a look?</strong>
              <p>Explore with sample flashcards. No signup needed.</p>
            </div>
          </div>
          <button
            type="button"
            className="button secondary"
            onClick={(event) => signIn(event, true)}
            disabled={busy}
          >
            Try the demo
            <ArrowRight size={16} />
          </button>
          <small>
            Local demo only. Use a practice password when registering.
            <br />
            Accounts and decks are saved in this browser.
          </small>
        </div>
      )}
    </AuthLayout>
  );
}

export function RegisterPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [fields, setFields] = useState({
    firstName: '',
    lastName: '',
    email: '',
    login: '',
    password: '',
    confirm: '',
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const change = (key) => (event) => setFields({ ...fields, [key]: event.target.value });
  if (user) return <Navigate to="/app" replace />;
  async function register(event) {
    event.preventDefault();
    setError('');
    if (fields.password !== fields.confirm) {
      setError('Your passwords do not match. Please check them and try again.');
      return;
    }
    if (!fields.firstName.trim() || !fields.lastName.trim()) {
      setError('Please enter your first and last name.');
      return;
    }
    if (!/^[a-zA-Z0-9_.-]{3,32}$/.test(fields.login.trim())) {
      setError('Use 3–32 letters, numbers, dots, hyphens, or underscores for your username.');
      return;
    }
    setBusy(true);
    try {
      const payload = {
        firstName: fields.firstName.trim(),
        lastName: fields.lastName.trim(),
        email: fields.email.trim().toLowerCase(),
        login: fields.login.trim(),
        password: fields.password,
      };
      await authService.register(payload);
      navigate('/login', {
        replace: true,
        state: { registered: true, login: fields.login.trim() },
      });
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <AuthLayout>
      <Link to="/login" className="back-link">
        <ArrowLeft size={15} />
        Back to sign in
      </Link>
      <span className="form-eyebrow">A LITTLE SPACE TO GROW</span>
      <h2>
        Make yourself
        <br className="register-break" /> at home<span className="heading-dot">.</span>
      </h2>
      <p className="auth-subtitle">Your next chapter starts with a few details.</p>
      <ErrorMessage>{error}</ErrorMessage>
      <form onSubmit={register} aria-label="Create account" aria-busy={busy}>
        <div className="field-row">
          <div className="field">
            <label htmlFor="firstName">First name</label>
            <input
              id="firstName"
              autoComplete="given-name"
              value={fields.firstName}
              onChange={change('firstName')}
              placeholder="Alex"
              required
              maxLength={60}
            />
          </div>
          <div className="field">
            <label htmlFor="lastName">Last name</label>
            <input
              id="lastName"
              autoComplete="family-name"
              value={fields.lastName}
              onChange={change('lastName')}
              placeholder="Morgan"
              required
              maxLength={60}
            />
          </div>
        </div>
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={fields.email}
            onChange={change('email')}
            placeholder="you@example.com"
            required
            maxLength={254}
          />
        </div>
        <div className="field">
          <label htmlFor="new-login">Username</label>
          <input
            id="new-login"
            name="username"
            autoComplete="username"
            value={fields.login}
            onChange={change('login')}
            placeholder="Choose your username"
            required
            minLength={3}
            maxLength={32}
            aria-describedby="username-hint"
          />
          <small id="username-hint">3–32 letters, numbers, dots, hyphens, or underscores.</small>
        </div>
        <PasswordInput
          id="new-password"
          autoComplete="new-password"
          minLength={8}
          value={fields.password}
          onChange={change('password')}
        />
        <PasswordInput
          id="confirm-password"
          label="Confirm password"
          autoComplete="new-password"
          minLength={8}
          value={fields.confirm}
          onChange={change('confirm')}
        />
        <button className="button primary auth-submit" disabled={busy}>
          {busy ? 'Creating your account…' : 'Create account'}
          <ArrowRight size={18} />
        </button>
      </form>
      {IS_DEMO && (
        <p className="demo-footnote">
          Local demo · Use a practice password. This account stays in your browser.
        </p>
      )}
      <p className="auth-switch">
        Already have an account?{' '}
        <Link to="/login">
          Sign in <ArrowRight size={14} />
        </Link>
      </p>
    </AuthLayout>
  );
}

export function LoginErrorPage() {
  const { user } = useAuth();
  const location = useLocation();
  if (user) return <Navigate to="/app" replace />;
  return (
    <AuthLayout>
      <div className="login-failure">
        <span className="failure-icon">
          <ShieldAlert size={33} strokeWidth={1.6} />
        </span>
        <span className="form-eyebrow">LET’S TRY THAT AGAIN</span>
        <h2>
          We couldn’t
          <br />
          sign you in<span className="heading-dot">.</span>
        </h2>
        <p className="auth-subtitle" role="alert">
          Login failed. Please check your credentials and try again.
        </p>
        <Link
          className="button primary auth-submit"
          to="/login"
          replace
          state={{ login: location.state?.login || '' }}
        >
          <ArrowLeft size={17} />
          Back to sign in
        </Link>
        <p className="auth-switch">
          Need an account?{' '}
          <Link to="/register">
            Register here <ArrowRight size={14} />
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
