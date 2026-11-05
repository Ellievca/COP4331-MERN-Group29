# StudySync

StudySync is a flashcard study application developed by COP4331 Group 29. It uses React, Express, Node.js, and MongoDB to provide private course workspaces, flashcard decks, and saved study history.

**Live application:** [https://studysync.live](https://studysync.live)

## Features

- Account registration, login, and logout.
- Private courses, decks, and flashcards associated with each account.
- Deck search, course filters, and sorting.
- Flashcard review with answer reveals and recall self-assessment.
- Saved study sessions, study history, and dashboard totals.
- Administrator tools for account search, statistics, and account activation.

Email verification, password reset delivery, group meetings, and room booking are not currently implemented.

## Technology stack

| Component | Technology |
| --- | --- |
| Frontend | React, JavaScript, React Router, Vite |
| Backend | Node.js, Express |
| Database | MongoDB |
| Authentication | Cookie-based sessions, bcrypt password hashing |
| Production hosting | DigitalOcean, Nginx, systemd, Let's Encrypt |
| Package manager | pnpm |

## Local setup

### Requirements

- Node.js 22.12.0 or later.
- pnpm 11.25.0.
- Internet access for dependency installation and the first MongoDB download.

### Installation

```sh
git clone --branch studysync-frontend https://github.com/Ellievca/COP4331-MERN-Group29.git
cd COP4331-MERN-Group29
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://127.0.0.1:5173](http://127.0.0.1:5173). Register an account and sign in to create a course, add a deck and flashcards, and start a study session.

The development launcher starts these services:

| Service | Default address |
| --- | --- |
| React development server | `http://127.0.0.1:5173` |
| Express API | `http://127.0.0.1:5000` |
| MongoDB | `mongodb://127.0.0.1:27019` |

Vite proxies `/api` requests to Express. The frontend uses the API by default.

The first launch downloads the official MongoDB 8.0.17 binary. The local database, `StudySync_local`, stores its files in the ignored `server/.local-mongo/` directory and retains data across restarts. Local development does not use the production database. Docker is not required.

Stop the launcher with `Ctrl+C`. Only one process can use each configured port at a time.

## Commands

Run these commands from the repository root:

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the frontend, API, and persistent local MongoDB database. |
| `pnpm test` | Run frontend behavior tests and backend integration tests against a disposable MongoDB instance. |
| `pnpm build` | Build the production frontend in `frontend/dist/`. |
| `pnpm start` | Start Express with the configured database and serve the built frontend. |
| `pnpm dev:demo` | Start the optional browser-only demo. |
| `pnpm create-admin --login username` | Grant administrator access to an existing account in the configured database. |

The demo is separate from the MongoDB-backed application and does not verify API integration or server persistence.

## Configuration

The default local launcher does not require a manually configured MongoDB connection. To use a separately managed database or run the production server, copy `server/.env.example` to `server/.env` and set the appropriate values.

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Set to `production` for production hosting. |
| `HOST` | API bind address; use `127.0.0.1` behind Nginx. |
| `PORT` | API listening port. |
| `MONGODB_URI` | Server-side MongoDB connection string. |
| `MONGODB_DB_NAME` | Database used by the application. |
| `APP_ORIGIN` | Application origin, including the scheme and hostname. |
| `SESSION_HOURS` | Session lifetime in hours. |
| `TRUST_PROXY` | Set to `1` when running behind the single trusted Nginx proxy. |

Keep environment files and database credentials out of version control. Never place database credentials in frontend `VITE_` variables. The development launcher manages its own MongoDB connection; use `pnpm start` with a separately configured database.

## Production deployment

StudySync is hosted at [https://studysync.live](https://studysync.live). Nginx provides HTTPS and forwards requests to the production application. HTTP requests and the `www` hostname redirect to the HTTPS root domain. The application runs as a systemd service and uses the isolated `StudySync_production` database.

For a production installation:

1. Install dependencies with `pnpm install --frozen-lockfile`.
2. Run `pnpm test` and `pnpm build`.
3. Configure the server environment with the intended MongoDB connection, `NODE_ENV=production`, `APP_ORIGIN=https://studysync.live`, and the appropriate bind address and port.
4. Configure the systemd service and Nginx upstream for the actual installation paths and API port.
5. Install a valid TLS certificate, configure HTTP redirects, and verify automatic certificate renewal.
6. Check `/api/health` and repeat the account and study workflow through the public HTTPS URL.

The [systemd](deploy/studysync.service.example) and [Nginx](deploy/nginx.conf.example) files are deployment examples. Adjust their users, paths, ports, and hostnames before installing them. GitHub Actions runs tests and builds; it does not automatically deploy changes.

## Authentication and administration

Passwords are hashed with bcrypt. Authentication uses an HttpOnly session cookie, with the Secure attribute enabled in production. The API enforces account ownership, request validation, CSRF protection, origin checks, and rate limits.

New accounts receive the standard user role. To assign administrator access, register the account first and run this command from a trusted terminal configured for the intended database:

```sh
pnpm create-admin --login existing-username
```

Sign in again to refresh account permissions. Public registration cannot assign administrator privileges.

## Project structure

```text
frontend/    React application, API client, and frontend tests
server/      Express API, database access, and backend tests
scripts/     Development launcher and test/build commands
deploy/      Production service and reverse proxy examples
docs/        Setup instructions, API contract, and lab requirements
```

## Verification

The DigitalOcean deployment was verified on November 5, 2026. All 8 frontend tests and 14 backend integration tests passed, and the production frontend build succeeded.

The public HTTPS application was also checked for registration, generic incorrect-password errors, successful login, course/deck/flashcard creation, completed study sessions, persistence after refresh, and logout. The health endpoint returned:

```json
{ "status": "ok", "database": "connected" }
```

## Additional documentation

- [API contract and backend integration](docs/API_HANDOFF.md)
- [Frontend lab requirements](docs/LAB_RUBRIC.md)
