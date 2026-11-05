# Implemented API and teammate merge guide

The bundled Express server implements this contract against MongoDB. The frontend defaults to API mode and does not silently fall back to demo data. The teammates' backend has not yet been received or merged.

## Authentication

| Method and path         | Request / response                                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| POST /api/auth/register | `{ firstName, lastName, email, login, password }` returns `201 { user }`.                                                                                       |
| POST /api/auth/login    | `{ login, password }` returns `{ user, csrfToken }` and an HttpOnly session cookie. Username or email is accepted. Incorrect credentials produce a generic 401. |
| GET /api/auth/me        | Cookie returns `{ user, csrfToken }`; missing/expired/disabled sessions return 401.                                                                             |
| POST /api/auth/logout   | Cookie plus `X-CSRF-Token` revokes the session and clears its cookie; returns 204.                                                                              |

Public user fields are id, firstName, lastName, email, login, role, isVerified, and isActive. Password hashes/tokens are never returned. Registration always assigns `user`; passwords use bcrypt with 12 rounds, a minimum of eight characters, and a maximum of 72 UTF-8 bytes. Verification delivery is not implemented and isVerified remains false.

The cookie contains a random opaque token; MongoDB stores its SHA-256 digest in AuthSessions. Expiry is checked on every authenticated request independently of TTL cleanup. Cookies use HttpOnly, SameSite=Lax, /api scope, and Secure in production. Sessions expire after eight hours by default, and login rotates an existing session.

All authenticated POST/PATCH/PUT/DELETE calls require `X-CSRF-Token` from login or /me. The frontend stores that anti-CSRF value with the public user in sessionStorage; it cannot read the authentication cookie. Focus refreshes and login/logout notifications reconcile session changes across tabs. The frontend retains its bearer-token adapter option for merging with a teammate JWT API, but this server uses cookies.

## Workspace routes

All workspace operations require authentication and are owner-scoped. IDs are ObjectId strings; arrays are returned directly; resource responses use `id` and ISO dates.

| Operation               | Method and path                               | Body / behavior                                                                                        |
| ----------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| List/create courses     | GET/POST /api/courses                         | `{ name, code?, color? }`                                                                              |
| Update/delete course    | PATCH/DELETE /api/courses/:id                 | Update name/code/color; deleting a course with active decks returns 409.                               |
| List/create decks       | GET/POST /api/decks                           | `{ title, description?, courseId? }`; private by default.                                              |
| Read/update/delete deck | GET/PATCH/DELETE /api/decks/:id               | Update title/description/courseId; deletion hides the deck, removes cards, and preserves history.      |
| List/create cards       | GET/POST /api/decks/:deckId/cards             | `{ front, back }`                                                                                      |
| Update/delete card      | PATCH/DELETE /api/decks/:deckId/cards/:cardId | Update front and/or back.                                                                              |
| List/save sessions      | GET/POST /api/study-sessions                  | `{ deckId, courseId?, deckTitle?, clientSessionId?, startedAt, endedAt, cardsReviewed, cardsCorrect }` |
| Health                  | GET /api/health                               | Anonymous `{ status: "ok", database: "connected" }` connectivity check.                                |

The server assigns ownership, timestamps, visibility, and historical deck titles. Client-supplied owner IDs/roles are rejected. Cross-account IDs return 404. Card counts come from MongoDB. Decks support up to 1,000 cards; card lists return up to that maximum. Other lists accept `?limit=` (default 500, maximum 1,000). Deck lists also accept literal `?search=` and `?courseId=`.

Session totals must agree with the deck, correct cards cannot exceed reviewed cards, and end time must follow start time. The UI sends a UUID clientSessionId; retries with the same identifier create one history record. Recall is self-reported, not independently verified performance.

## Administration

- GET /api/admin/stats returns users, activeUsers, decks, cards, sessions.
- GET /api/admin/users returns safe user records (default 100, maximum 500 through ?limit=).
- PATCH /api/admin/users/:id/activation accepts `{ isActive }`. Disabling a student revokes sessions. Administrator accounts are protected.

The UI at /app/admin exposes these operations for admins. The API independently enforces the role. Use the trusted `pnpm create-admin --login existing-username` command to assign a role; no public promotion endpoint exists.

## Integration seam

- frontend/src/services/client.js: requests, cookies, CSRF headers, timeout/errors, normalization.
- frontend/src/services/index.js: endpoint paths and payload adapters.
- frontend/.env.development and .env.production: API mode, same-origin requests.
- frontend/vite.config.js: local /api proxy to port 5000.
- frontend/.env.demo: explicitly selected browser-only demo.

Never expose database credentials through VITE\_ variables. For a separate API origin configure VITE_API_BASE_URL and the exact backend allowed origin. Same-origin HTTPS is preferred. The login adapter also normalizes the course examples' HTTP-200 errors, auth-denied replies, and zero/negative IDs to the generic error page.

## Merge the teammates' code

1. Fetch and inspect their branches, routes, schema, session/JWT strategy, and tests. Keep a review branch rather than overwriting their API or the shared database.
2. Agree on StudySync versus the previously observed study_app database. Preserve real data and reconcile validators deliberately.
3. Compare the routes above with theirs. Reuse equivalent existing behavior and map naming/wrapper differences in the frontend service adapter.
4. Choose one authentication strategy. Reconcile verification, expiry, logout, storage, and CSRF explicitly if adopting their JWT approach.
5. Preserve password hashing, duplicate handling, generic failures, ownership, admin checks, and session invalidation tests.
6. Repeat the fresh-account rubric flow on the merged app, then on the deployed HTTPS domain.

Email verification/reset delivery and room/group scheduling are not implemented. Confirm those final-project requirements separately. Admin account management is implemented; reconcile broader admin scope with Lukas when his code arrives.
