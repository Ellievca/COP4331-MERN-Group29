# StudySync

React frontend for the COP4331 Group 29 MERN project. The frontend lab flow is implemented with a browser-local demo adapter so it can be reviewed while the team's backend is being prepared.

## Run locally

Requires Node.js 20.19+ or 22.12+ and a package manager. From `frontend/`:

```sh
npm install
npm run dev
```

The app opens at the local URL printed by Vite, normally `http://localhost:5173`. `pnpm install` and `pnpm dev` also work; the committed `pnpm-lock.yaml` records the verified dependency versions. Run `pnpm install --frozen-lockfile` to reproduce them exactly.

```sh
npm test
npm run build
npm run preview
```

The production static files are generated in `frontend/dist/`. The deployed app is a client-side React application. It needs a static host with SPA fallback and a backend API for real accounts and persisted shared data.

## What works in demo mode

- Initial access opens the login page. Authenticated routes redirect signed-out visitors to login.
- Registration collects first name, last name, email, username, password, and password confirmation. Email is included because the existing database schema requires it.
- Successful registration returns to login with a confirmation. The new credentials open the main application.
- Incorrect credentials navigate to a separate generic login-failure page, with a path back to sign in.
- The dashboard shows the user's name, deck/card totals, actual completed study sessions, and progress toward a daily goal of 20 reviewed cards.
- Users can create and delete decks, search/filter/sort them, add/delete/search flashcards, reveal answers, self-assess recall, complete sessions, and view study history.
- Layouts adapt to phone and desktop sizes. Forms have labels and validation. Native dialogs support focus management and Escape; buttons support keyboard navigation.

“Try the demo” signs into the example account (`student` / `StudySync123!`). Register a new account to test the actual registration → login flow. Starter flashcards are example content; activity starts empty. The workspace is based on the courses/decks/cards structure in `database-setup.js` on the repository's `ellie` branch. Group meetings and room booking are not implemented in this first frontend pass.

Demo accounts and workspaces are stored in localStorage, separately for each user. The current session is kept in sessionStorage, survives refresh in the same tab, and clears on logout. Demo passwords are salted and derived with Web Crypto PBKDF2, never stored in plaintext. This is a test harness, not production authentication: use practice credentials. Clearing the site's browser storage removes all demo data. No real email, reset, or verification messages are sent.

## Connect the team's API

See [the API handoff](docs/API_HANDOFF.md). Every request is centralized in `frontend/src/services/`. Components use the same service interface in demo and API modes.

Copy `frontend/.env.example` to `frontend/.env.local`, set `VITE_DATA_MODE=api`, configure the API base URL, and update the provisional endpoint/payload mappings in `src/services/index.js`. Restart Vite after changing these settings. The current REST contract is a frontend proposal; it has not been confirmed with or tested against the API team's server.

Never put a MongoDB connection string, database password, signing secret, or private key into a frontend environment variable. Vite variables are public build inputs. Real password hashing, authorization, authentication, and database access belong to the backend.

## Frontend lab demonstration

| Rubric item                                        | Current state                                                 |
| -------------------------------------------------- | ------------------------------------------------------------- |
| Domain name (10%)                                  | Pending deployment and the group's domain/DNS setup.          |
| HTTPS (10%)                                        | Pending the droplet's TLS setup.                              |
| Initial login page (10%)                           | Implemented at `/login`; `/` redirects there.                 |
| Registration option (10%)                          | Implemented on the login page.                                |
| Name, username, password registration (20%)        | Implemented, plus the schema-required email field.            |
| Correct login opens an interactive main page (20%) | Works with demo accounts. Real server integration is pending. |
| Incorrect login opens a generic error page (20%)   | Implemented at `/login-error`.                                |

For a practice run: register with new credentials, sign in, create a deck, add a flashcard, study it, and check the session history. Sign out, enter the wrong password, and verify the generic error page. Repeat through the production domain after the API and HTTPS are connected. A demo-only build is not a substitute for the lab's fully integrated deployment.

## Deployment notes

The existing droplet and MongoDB were inspected but have not been changed by this frontend work. Confirm with the API team whether the app will use the droplet's `study_app` database or the `StudySync` schema on the `ellie` branch.

For Nginx, use SPA fallback for the static frontend and proxy the API separately:

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:5000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}

location / {
    try_files $uri $uri/ /index.html;
}
```

The port is an example; match the backend team's actual port. Configure the group's domain and a valid TLS certificate on the droplet before demoing. Prefer an API behind the same HTTPS domain: an HTTPS frontend cannot reliably call an HTTP API because browsers block mixed content. Do not replace the droplet's current configuration until the complete deployment has been reviewed.
