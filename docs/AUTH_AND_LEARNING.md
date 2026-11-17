# Authentication and learning tools

## Implemented

- Google Identity Services button on login/registration; server validation with Google's Node library, audience validation, a single-use nonce, existing cookie sessions, and authenticated linking in Account settings. Existing email collisions require signing into the original account before linking. Google-only accounts have no password hash. Basic Google accounts with third-party email addresses still verify the email with StudySync; Gmail/Workspace authoritative addresses are verified from the validated Google identity.
- Six-digit email verification and password recovery codes: ten-minute expiry, five attempts, sixty-second resend cooldown, purpose-bound HMAC digests, and single use. A verified reset code creates a five-minute reset grant. Password reset revokes all sessions using an account authentication version, invalidates outstanding recovery challenges, and attempts a change-notification email. Google-only accounts recover through Google. Existing accounts can sign in, then verify their email from Account; unverified addresses cannot reset a password.
- FSRS-6 scheduling through the pinned `ts-fsrs@5.4.2` library. Server-side ratings Again/Hard/Good/Easy, 90% initial desired retention, a configurable new-card limit, timezone day boundaries, mixed-deck review, and separate free practice. `CardProgress` atomically stores schedule and review events together, with revision checks and review IDs for retry safety. Old aggregate study sessions are not fabricated into per-card history.
- Optional typed recall before revealing answers; cloze syntax `{{c1::answer}}`; private PNG/JPEG/WebP diagram uploads with rectangular label masks; application questions with worked explanations; struggling-card repair after five lapses, pause/resume and restart learning; deck exam dates and suggested daily introduction counts. Suggestions are workload estimates, not predicted exam scores.

## Google configuration

1. Complete Google Auth Platform configuration for the StudySync project. Use the existing account/support contact and an external test audience. Add the team's test users where Google requires them.
2. Create a **Web application** OAuth client for `https://studysync.live`, `http://localhost`, `http://localhost:5173`, and `http://127.0.0.1:5173` in Authorized JavaScript origins. This integration uses a JavaScript callback, so redirect URIs are not required.
3. Set the public client ID as `GOOGLE_CLIENT_ID` in the backend's ignored environment file; restart the server. The frontend discovers it from `/api/auth/options` without a rebuild. Never put a client secret into frontend configuration.
4. Register a new Google test account and test linking an existing password account. Add any future native mobile client IDs deliberately; the web client does not automatically enable native Google sign-in.

Google setup requires the account owner's approval of Google's API Services User Data Policy and creation of the OAuth client. The UI does not pretend Google is configured when the client ID is missing.

## Resend production setup

1. In Resend, verify a domain you control, preferably `auth.studysync.live`. Add the exact SPF/DKIM DNS records Resend supplies at your domain's DNS provider. Configure DMARC according to your domain's existing policy.
2. Create a sending API key limited to that domain where supported. Put it in the **server's ignored** `.env` as `RESEND_API_KEY`. Do not commit or paste the key into frontend files or chat.
3. Set `MAIL_FROM=StudySync <accounts@auth.studysync.live>`. Generate a persistent random `AUTH_CHALLENGE_SECRET` of at least 32 characters. Set `MAIL_MODE=disabled`, `EMAIL_VERIFICATION_REQUIRED=true`, and retain the existing production database/origin configuration.
4. Restart the application. Verify a fresh registration arrives in a real mailbox, test code expiry/resend, reset a verified password, and confirm old sessions no longer work. Test wrong codes and Google-only recovery behavior as well.

No email-provider account or DNS record is created by the application. Configuration remains a prerequisite for real delivery. Delivery failures do not falsely verify an account; a newly registered user can resend from the verification page.

## Local development

`pnpm dev` uses a real persistent local MongoDB and defaults to a local-only mail outbox in `server/.local-mail/`. Read the latest JSON file there to get the code for a synthetic test account. This folder is ignored by Git, is not exposed by the API, and is disabled in production. Set a persistent challenge secret in ignored `server/.env` so pending codes survive a development restart. The browser-only demo supports learning features but deliberately does not fake Google or email recovery.

Startup creates indexes and makes only `Users.$jsonSchema.required.passwordHash` optional when that legacy requirement is present. Other validator rules and all existing accounts are preserved. If the app's MongoDB role cannot run `collMod`, the app stays available and Google sign-in displays a setup notice. An operator must supply an administrator connection privately as `MONGODB_MIGRATION_URI` and run `node server/scripts/migrate-auth.mjs`, then restart the service. Remove that elevated connection from the environment afterward; the application retains its ordinary read/write database role. Back up the database before migrating. Deployments with a different custom validator should review the migration before rollout. New authenticated collections are `EmailChallenges`, `ResetGrants`, `GoogleChallenges`, `CardProgress`, and `CardImages`. Challenge/grant expiry is checked in requests as well as TTL cleanup. Uploaded images are owner-scoped, limited to 2 MB each and 100 per account.

Set the reverse proxy's request body limit to at least `2m` for diagram uploads (see `deploy/nginx.conf.example`). The API still limits JSON requests to 32 KB.

## API additions

- `GET /api/auth/options`, `GET /api/auth/google/challenge`, `POST /api/auth/google`, authenticated `POST /api/auth/google/link`, authenticated `PATCH /api/auth/profile`.
- `POST /api/auth/email/request` (`email`, `purpose: verify|reset`), `POST /api/auth/email/verify` (`email`, `code`), `POST /api/auth/password/verify` (`email`, `code`), `POST /api/auth/password/reset` (`resetToken`, `password`).
- `GET /api/reviews?deckId=...&courseId=...`; `PATCH /api/reviews/settings`; `POST /api/reviews/:cardId` (`reviewId`, `version`, numeric `rating: 1..4`); `PATCH /api/reviews/:cardId` (`suspended` and/or `reset: true`).
- Authenticated `POST /api/card-images` sends raw PNG/JPEG/WebP bytes with the session CSRF token. Owner-only `GET /api/card-images/:id` reads the image.
- Deck create/update accepts optional `examDate` (`YYYY-MM-DD` or null). Card create/update accepts `kind`, `explanation`, `imageId`, and percentage-coordinate `masks`.

Review logs use server time. A stale revision returns 409; clients reload their queue. A retry with the same review ID reuses the saved result. Free practice never submits review ratings, although its final summary can appear in ordinary study history. Card content edits preserve scheduling; use **Restart learning** when a rewritten card should be learned anew. Retention preferences affect future ratings, not a bulk reschedule of existing cards.

## References

- https://developers.google.com/identity/gsi/web/guides/verify-google-id-token
- https://github.com/open-spaced-repetition/ts-fsrs/tree/ts-fsrs%405.4.2
- https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html
- https://resend.com/docs/dashboard/domains/introduction
