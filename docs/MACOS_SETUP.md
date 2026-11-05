# Set up StudySync on a Mac

Use the **codex/studysync-frontend** branch of [Ellievca/COP4331-MERN-Group29](https://github.com/Ellievca/COP4331-MERN-Group29). The branch contains both the React frontend and the new Express/MongoDB API. The name reflects where the work started; it now contains the full local application.

## Copy and paste this into Codex on the Mac

```text
Set up and run my COP4331 StudySync project on this Mac.

Repository: https://github.com/Ellievca/COP4331-MERN-Group29.git
Branch: codex/studysync-frontend
Preferred folder: ~/Developer/StudySync

I authorize you to create/use that project folder, clone/fetch the repository,
install the project's dependencies and required official development tools,
download the official MongoDB binary, edit project setup files as needed,
run tests/builds, and start the frontend/API/database on localhost. Continue
through routine setup without asking for the same authorization again.
Honor any actual macOS or Codex permission/authentication prompts; ask only
for the specific action that the app or OS requires me to perform.

First inspect any existing checkout and preserve its uncommitted changes.
Use an existing compatible native Node installation if available; otherwise
install native Node.js 24 LTS and pnpm 11.25.0 from official sources, preferably
using an already-installed version manager or Homebrew. Keep Apple Silicon
on arm64 and Intel on x64. Do not assume Windows executable paths exist.

Clone the branch above, or fetch and safely update the matching checkout.
Read README.md, docs/API_HANDOFF.md, docs/LAB_RUBRIC.md, and this Mac setup guide.
From the repository root, run pnpm install --frozen-lockfile, pnpm test, and
pnpm build. Fix setup problems, then start pnpm dev in a retained terminal.
Wait for the first MongoDB download if needed.

Use real API mode. Verify http://127.0.0.1:5173/api/health reports MongoDB
connected. Open http://127.0.0.1:5173 and test a new synthetic account:
registration, incorrect-password generic error page, correct login,
course/deck/flashcard creation, a completed study session, refresh, and logout.
Keep the working app running and show me its local URL and project location.

All local accounts are new on this Mac. Keep database files, passwords,
private keys, session cookies, and .env files local. Limit setup to this
project and its required development tools; preserve existing repositories
and system security controls. The shared DigitalOcean/Atlas environment is
outside this setup task, and the project's production domain is still unknown.

Report test/build results and any remaining real blocker. Do not report
macOS setup or the lab as complete until you have actually verified it here.
```

## Permission setup

Open the project folder as the chat's workspace so routine file changes are in scope. Codex's permissions control determines the actual filesystem/network boundary; a pasted prompt records your authorization but cannot bypass that boundary or macOS authentication. When available, **Approve for me** can handle eligible approval requests automatically while retaining the workspace sandbox. For broader access, the user can explicitly choose the permission profile they intend in the app. Full access is not required just to run the project. See the [official sandbox and permissions documentation](https://learn.chatgpt.com/docs/sandboxing).

GitHub cloning is public and does not require copying the Windows SSH key. macOS may request approval for installing a tool or accessing a selected folder; handle those genuine prompts on the Mac. Never paste an account password, private key, or database secret into the setup prompt or commit one to GitHub.

## Manual commands after Node and pnpm are available

```sh
mkdir -p ~/Developer
git clone --branch codex/studysync-frontend https://github.com/Ellievca/COP4331-MERN-Group29.git ~/Developer/StudySync
cd ~/Developer/StudySync
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm dev
```

If the folder already exists, inspect it first and fetch/update its matching branch without discarding local changes. The development launcher starts a real local MongoDB, the Express API on port 5000, and Vite on port 5173. Stop another copy before reusing those ports. MongoDB uses port 27019; Docker is optional and should not also bind that port.

MongoDB 8 supports native Apple Silicon through the launcher's architecture selection; use native Node rather than forcing x64/Rosetta on an arm64 Mac. Intel Macs use the x64 binary. The package's [supported-platform guidance](https://typegoose.github.io/mongodb-memory-server/docs/guides/supported-systems/) covers OS/architecture limitations. If the Mac is too old for the selected MongoDB binary, report the actual compatibility error and choose an officially supported database setup; do not replace persistence with demo data to make checks appear to pass.

## What GitHub transfers

The repository transfers source, dependency versions, tests, deployment templates, and setup instructions. It deliberately excludes node_modules, build output, browser-only demo data, server/.env, and server/.local-mongo. The Mac installs its own native packages and starts a fresh local database. The test accounts created on Windows are not shared production accounts and are not copied to the Mac. Register a new account there.

The verified Windows run is useful evidence, but it is not proof that a particular Mac has passed its setup. Run the commands and browser checks above on that Mac. Public domain, HTTPS, and reconciliation with teammates' APIs remain separate final deployment tasks.
