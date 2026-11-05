# Frontend API handoff

The React UI is ready to connect once the API team provides the real endpoint contract. The paths below are provisional placeholders, not a claim that these endpoints exist. The original class tutorial uses different paths and response shapes. Change the service adapter to match the team's actual API.

## Integration seam

- `frontend/src/services/client.js`: base URL, fetch, headers, timeout, error handling, ID normalization.
- `frontend/src/services/index.js`: all API routes and request/response adaptation.
- `frontend/src/services/demo.js`: browser-only demo authentication and persistence.
- `frontend/src/state/`: authenticated session and workspace state consumed by the UI.

Set `VITE_DATA_MODE=api` and `VITE_API_BASE_URL=https://your-domain.example` in an ignored `frontend/.env.local`. Leave the base URL blank for same-origin `/api` requests, which is preferred when deployed behind Nginx. Restart/rebuild after changes. There is no automatic fallback to demo data if a real API fails.

## Proposed request and response shapes

| Operation       | Method and path                       | Body / response                                                                                                                                                                                               |
| --------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Register        | `POST /api/auth/register`             | Body: `{ firstName, lastName, email, login, password }`. Any successful JSON response is accepted; the UI returns to login.                                                                                   |
| Login           | `POST /api/auth/login`                | Body: `{ login, password }`. Response: `{ user: { id, firstName, lastName, login, email }, accessToken? }`. Invalid credentials must use 401 or be mapped to a `ServiceError` with status 401 in the adapter. |
| Restore session | `GET /api/auth/me`                    | Response: `{ user: { id, firstName, lastName, login, email } }`. This is verified with the server on refresh in API mode.                                                                                     |
| Logout          | `POST /api/auth/logout`               | Revoke the cookie/session; return success. The browser clears its local session even if this request fails.                                                                                                   |
| Courses         | `GET /api/courses`                    | Array of `{ id, name, code, color? }`. Colors may be `purple`, `blue`, or `peach`; otherwise the UI uses its default.                                                                                         |
| Decks           | `GET /api/decks`                      | Array of `{ id, courseId, title, description, cardCount, isPublic, createdAt, updatedAt }`.                                                                                                                   |
| Create deck     | `POST /api/decks`                     | Body: `{ title, description, courseId }`, with a nullable course ID. Return the created deck. The server should set the authenticated owner, `isPublic: false`, and timestamps.                               |
| Delete deck     | `DELETE /api/decks/:id`               | Return 204 or successful JSON. Handle dependent cards on the server.                                                                                                                                          |
| Deck cards      | `GET /api/decks/:id/cards`            | Array of `{ id, front, back }`.                                                                                                                                                                               |
| Add card        | `POST /api/decks/:id/cards`           | Body: `{ front, back }`. Return the created card. The server sets owner/deck IDs and timestamps.                                                                                                              |
| Delete card     | `DELETE /api/decks/:id/cards/:cardId` | Return 204 or successful JSON. Keep deck card counts consistent.                                                                                                                                              |
| Sessions        | `GET /api/study-sessions`             | Array of `{ id, deckId, deckTitle?, courseId, startedAt, endedAt, cardsReviewed, cardsCorrect }`.                                                                                                             |
| Save session    | `POST /api/study-sessions`            | Body: `{ deckId, deckTitle, courseId, startedAt, endedAt, cardsReviewed, cardsCorrect }`. Return the saved session.                                                                                           |

IDs may be serialized as `id` or `_id`; the adapter normalizes those fields. Other field names should be adapted explicitly. If endpoints wrap arrays in `{ results: [...] }`, unwrap them in `services/index.js`. Do not expose password hashes or verification/reset tokens in user responses.

## Authentication and errors

The request helper supports secure server cookies using `credentials: include`, and attaches a bearer token if login returns `accessToken`. Settle on the API team's actual strategy. A cookie-based session must use an appropriate Secure, HttpOnly, SameSite cookie and server-side CSRF protection when needed. Cross-origin requests require the server to allow the exact frontend origin and credentials. Same-origin deployment avoids that CORS configuration.

During this initial scaffold, bearer access tokens are held in sessionStorage if supplied; review token storage with the API team before production. All ownership/role checks must run on the server; the demo client is not an authorization boundary. Backend password hashing must use a suitable server-side password hashing library rather than the browser demo code.

The client handles non-2xx HTTP responses, HTTP-200 `{ error: "..." }` responses, network failures, timeouts, and malformed JSON. The login adapter normalizes HTTP-200 errors, HTTP 401/403 authentication failures, `{ success: false }`, and zero/negative user IDs to a generic 401 failure so the dedicated error-page route is used. Map any additional invalid-login signals in your backend's contract to that same flow. Avoid displaying which part of the credentials was wrong.

## Open questions for the API team

1. What are the real route paths, payloads, and response bodies for registration/login/logout/session validation?
2. Does registration require email verification before login? The lab flow expects a newly registered user to be able to sign in; coordinate the demonstration account flow accordingly.
3. Which database is authoritative: `StudySync` from the setup script or `study_app` on the droplet?
4. Are courses, decks, cards, and study-session endpoints available? If only auth is ready first, adapt workspace loading to the agreed minimum without silently pretending API data exists.
5. Does the project need an admin role in the frontend? The earlier team discussion says it does, but the role schema and admin endpoints have not been supplied. This lab pass implements the student experience only.
6. Is group/room planning still in scope, or is the flashcard-oriented database now the final product direction?
