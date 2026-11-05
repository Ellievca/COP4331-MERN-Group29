import { Component, useEffect } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { useAuth } from './state/AuthContext.jsx';
import { WorkspaceProvider, useWorkspace } from './state/WorkspaceContext.jsx';
import { LoginPage, RegisterPage, LoginErrorPage } from './pages/AuthPages.jsx';
import { DashboardPage, LibraryPage, SessionsPage } from './pages/Dashboard.jsx';
import { DeckDetailPage, StudyPage } from './pages/DeckPages.jsx';
import { EmptyState, Spinner } from './components/UI.jsx';
import Layout from './components/Layout.jsx';
import AdminPage from './pages/AdminPage.jsx';

class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed)
      return (
        <div className="fatal-error">
          <AlertCircle size={30} />
          <h1>Let’s take a fresh page.</h1>
          <p>Something unexpected happened. Reload to try again.</p>
          <button className="button primary" onClick={() => window.location.reload()}>
            Reload StudySync
          </button>
        </div>
      );
    return this.props.children;
  }
}

function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? (
    <WorkspaceProvider>
      <WorkspaceGate />
    </WorkspaceProvider>
  ) : (
    <Navigate to="/login" replace />
  );
}
function WorkspaceGate() {
  const { loading, error, reload } = useWorkspace();
  const { logout } = useAuth();
  if (loading) return <Spinner />;
  if (error)
    return (
      <div className="workspace-load-error">
        <EmptyState
          icon={AlertCircle}
          title="Your study space couldn’t load."
          action={
            <button className="button primary" onClick={reload}>
              Try again
            </button>
          }
        >
          {error}
        </EmptyState>
        <button className="text-link" onClick={() => logout().catch(() => {})}>
          Sign out and try again
        </button>
      </div>
    );
  return <Layout />;
}
function RouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    const page =
      pathname === '/register'
        ? 'Create account'
        : pathname === '/login-error'
          ? 'Login failed'
          : pathname === '/login'
            ? 'Welcome back'
            : pathname.includes('/study/')
              ? 'Focus session'
              : pathname.includes('/decks')
                ? 'My decks'
                : pathname.includes('/sessions')
                  ? 'Study sessions'
                  : 'Your study space';
    document.title = `${page} · StudySync`;
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
function PublicRoutes() {
  const { loading } = useAuth();
  return loading ? <Spinner /> : <Outlet />;
}
function StudyRoute() {
  const location = useLocation();
  return <StudyPage key={location.pathname} />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <RouteEffects />
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login-error" element={<LoginErrorPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<Outlet />}>
            <Route index element={<DashboardPage />} />
            <Route path="decks" element={<LibraryPage />} />
            <Route path="decks/:id" element={<DeckDetailPage />} />
            <Route path="study/:id" element={<StudyRoute />} />
            <Route path="sessions" element={<SessionsPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route
              path="*"
              element={
                <EmptyState
                  title="A little off the beaten path."
                  action="Back to overview"
                  to="/app"
                >
                  That page could not be found. Let’s head back to your study space.
                </EmptyState>
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ErrorBoundary>
  );
}
