# StudySync

COP4331 Group 29 MERN application: React/JavaScript frontend, Express API, and MongoDB persistence. The frontend uses the bundled API by default. A separate browser-only demo remains available for design work.

## Run the full application locally

Moving to a Mac? Use the [copy-and-paste Codex setup prompt](docs/MACOS_SETUP.md).

Use Node.js 22.12+ and pnpm 11. From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open **http://127.0.0.1:5173**. Register a new account and sign in. Create a course from My decks, create a deck, add flashcards, and complete a study session. New server accounts start with an empty private workspace rather than fabricated activity.

The launcher starts React/Vite on `127.0.0.1:5173`, Express on `127.0.0.1:5000`, and a real MongoDB 8.0.17 process on `127.0.0.1:27019`. Vite proxies `/api` to Express. MongoDB uses WiredTiger and the ignored `server/.local-mongo/` directory, so data survives restarts. The first launch downloads the official MongoDB binary through `mongodb-memory-server-core`; despite that package's name, this development database is persisted to disk.

The local launcher uses **StudySync_local** and does not connect to or reset the group's droplet/Atlas database. Do not run the original Docker MongoDB container on port 27019 at the same time. To use another MongoDB, configure `server/.env` from its example and run `pnpm start`, then start the frontend separately.

```sh
pnpm test          # frontend behavior tests + disposable real-MongoDB integration tests
pnpm build         # production React bundle in frontend/dist/
pnpm dev:demo      # optional browser-only prototype
```

Stop the root launcher with Ctrl+C. Stop an existing preview before starting another copy on port 5173. Authentication uses an HttpOnly server-session cookie; database credentials stay on the server.

## Implemented behavior

- Registration, server-hashed passwords, new-user login, generic login-error page, session validation, and logout.
- Owner-scoped courses, decks, and flashcards. The UI supports course/deck creation, adding/deleting flashcards, search, filters, and sorting. API PATCH routes also support course/deck/card updates.
- Answer reveals, recall self-checks, saved study history, dashboard totals, and idempotent session saving.
- Admin-only account search, workspace statistics, and account activation/deactivation. Disabling an account revokes its sessions. Public registration cannot assign an admin role.
- Server-side validation/authorization, CSRF tokens, origin checks, rate limiting, unique identity indexes, expiring sessions, safe JSON errors, and production Secure/HttpOnly cookies.

Email verification and password-reset delivery are not implemented: the supplied frontend lab does not require them. `isVerified` stays false after registration; the new account can sign in for the lab flow. Group meetings and room booking remain outside the current flashcard-oriented schema.

## Administrator access

Register an ordinary account first, then run from a trusted server terminal configured for the intended database:

```sh
pnpm create-admin --login your-existing-username
```

Locally this command defaults to MongoDB on port 27019; `server/.env` overrides that connection. Configure the intended database first in production. Sign in again or refresh afterward. Both the UI and API check the admin role.

## Teammate integration

See [the API contract and merge guide](docs/API_HANDOFF.md). Frontend mappings are isolated in `frontend/src/services/index.js`; the bundled backend lives under `server/`. Compare it with the teammates' implementation when received and retain the behavior that passes the acceptance checks.

Collections follow Ellie's setup: `Users`, `Courses`, `Decks`, `Cards`, and `StudySessions`, plus `AuthSessions`. Startup creates missing collections/indexes and preserves existing validators/data. Confirm the authoritative database before deployment: earlier inspection found `study_app` on the droplet, while the setup script targets `StudySync`.

## Lab readiness and deployment

The [rubric audit](docs/LAB_RUBRIC.md) covers all seven requirements. The five application behaviors can now run through React, Express, and MongoDB locally. Final readiness still requires the group's HTTPS domain and repeating that workflow there.

1. Confirm the domain, DNS access, authoritative database, and final merged API.
2. Configure the production server's ignored `server/.env`: `NODE_ENV=production`, least-privileged `MONGODB_URI`, `MONGODB_DB_NAME`, `APP_ORIGIN=https://your-domain`, `HOST=127.0.0.1`, `PORT=5000`, and `TRUST_PROXY=1` behind one trusted Nginx proxy.
3. Install dependencies and run `pnpm build`. `pnpm start` serves the built React app and API. Review the [systemd](deploy/studysync.service.example) and [Nginx](deploy/nginx.conf.example) templates for the actual user/paths.
4. Install a valid certificate and HTTP-to-HTTPS redirect. Production rejects an HTTP or numeric-IP app origin and sets Secure cookies.
5. Repeat registration, wrong-password rejection, successful login, studying, refresh, and logout through the deployed domain.

Templates have not been installed on the shared droplet. The domain/certificate are still pending. GitHub Actions runs tests/builds only; it does not deploy.

The server setup follows [Express security guidance](https://expressjs.com/en/advanced/best-practice-security/). The development/test launcher follows [mongodb-memory-server's lifecycle](https://typegoose.github.io/mongodb-memory-server/docs/guides/quick-start-guide/).
