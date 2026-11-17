import { useEffect, useRef, useState } from 'react';
import { request, normalizeLoginResponse, IS_DEMO } from '../services/client.js';
import { useAuth } from '../state/AuthContext.jsx';

let googleScript;
function loadGoogle() {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!googleScript)
    googleScript = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        script.remove();
        googleScript = null;
        reject(new Error('Google could not load. Check your connection and try again.'));
      };
      document.head.append(script);
    });
  return googleScript;
}
export default function GoogleButton({ link = false }) {
  const container = useRef(null);
  const { acceptSession, session } = useAuth();
  const [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0),
    [message, setMessage] = useState('');
  useEffect(() => {
    if (IS_DEMO) return;
    let active = true;
    async function setup() {
      try {
        const options = await request('/api/auth/options');
        if (!options.googleClientId) {
          if (active) setMessage('Google sign-in will be available once setup is complete.');
          return;
        }
        const { nonce } = await request('/api/auth/google/challenge');
        await loadGoogle();
        if (!active) return;
        setMessage('');
        window.google.accounts.id.initialize({
          client_id: options.googleClientId,
          nonce,
          callback: async ({ credential }) => {
            if (!active) return;
            try {
              setError('');
              const result = await request(link ? '/api/auth/google/link' : '/api/auth/google', {
                method: 'POST',
                body: { credential },
                csrfToken: session?.csrfToken,
              });
              if (link) {
                await acceptSession();
                setMessage('Google sign-in linked.');
              } else await acceptSession(normalizeLoginResponse(result));
            } catch (failure) {
              if (active) setError(failure.message);
            }
          },
        });
        container.current.replaceChildren();
        window.google.accounts.id.renderButton(container.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          text: link ? 'continue_with' : 'signin_with',
          width: 280,
        });
      } catch (failure) {
        if (active) setError(failure.message);
      }
    }
    setup();
    return () => {
      active = false;
    };
  }, [attempt, link, session?.csrfToken, acceptSession]);
  if (IS_DEMO) return null;
  return (
    <div className="google-signin">
      <div ref={container} />
      {message && <p role="status">{message}</p>}
      {error && (
        <>
          <p role="alert">{error}</p>
          <button
            type="button"
            className="text-link"
            onClick={() => {
              setError('');
              setAttempt(attempt + 1);
            }}
          >
            Try Google sign-in again
          </button>
        </>
      )}
    </div>
  );
}
