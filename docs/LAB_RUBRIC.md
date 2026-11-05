# Frontend lab rubric audit

Source: the user's screenshot “MERN Project Lab - Front End.” Updated November 5, 2026. This records readiness, not awarded points. The lab requires full integration.

| Requirement                                             | Weight | Implementation                                                                                        | Remaining final check                                                            |
| ------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Domain name rather than numeric IP                      | 10%    | Production requires an HTTPS domain; deployment templates are prepared.                               | Group domain, DNS, and public deployment are pending.                            |
| HTTPS                                                   | 10%    | Secure production cookies; TLS/redirect Nginx template.                                               | Install and verify a real certificate. Shared droplet settings have not changed. |
| Initial access renders login                            | 10%    | Signed-out root visit opens /login.                                                                   | Repeat on the deployed domain.                                                   |
| Login offers registration                               | 10%    | Create an account opens /register.                                                                    | Repeat on the deployed domain.                                                   |
| Name, username, and password registration               | 20%    | Required fields plus email reach Express and MongoDB; password stored as bcrypt hash.                 | Repeat on the final merged API/database and domain.                              |
| New user's correct login opens an interactive main page | 20%    | Server authentication opens a private workspace; course/deck/card/session changes persist in MongoDB. | Repeat after teammate reconciliation and deployment.                             |
| Incorrect credentials show a generic error page         | 20%    | Generic server 401 routes to /login-error; alternate course-style failures are normalized too.        | Repeat against the final deployed API.                                           |

## Acceptance run

1. Run pnpm dev. Visit http://127.0.0.1:5173/ while signed out and confirm login.
2. Register a unique username, name, email, and matching passwords. Confirm return to login.
3. Use that username with a wrong password. Confirm the separate generic error page.
4. Return with the correct credentials and confirm the personalized main page.
5. Create a course/deck, add a flashcard, search/study it, and complete a session. Confirm history/totals update.
6. Refresh and sign in again to confirm MongoDB persistence. Sign out and verify /app requires login.
7. After merging teammates' work, repeat on the real HTTPS domain. Verify DNS, certificate, production cookies, registration, and database persistence there.

The backend integration tests use a disposable real MongoDB process. They cover authentication, hashing, ownership isolation, validated CRUD, session persistence/revocation, CSRF/origin checks, idempotent history, admin permissions, rate limits, and HTTPS production configuration. Local checks cannot establish that public DNS or TLS works.

The earlier group discussion also required an admin side. Account management and statistics are now implemented separately from these seven frontend lab points. Coordinate additional admin expectations with Lukas.
