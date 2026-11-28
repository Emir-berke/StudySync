# StudySync Client (React + Vite)

Front end for StudySync. It talks to the Express API in `../server` through
the Vite dev proxy (`/api` -> `http://localhost:5000`).

## Run it

```bash
cd client
npm install
npm run dev        # http://localhost:5173
```

Start the backend in another terminal (`cd server && node server.js`) so
register, login and account pages can reach the real API.

## Folder structure

```
src/
  api/          fetch helper, auth/sessions/tasks API modules, mock data
  auth/         AuthContext, AuthProvider (token + current user), useAuth hook
  components/   NavBar, Footer, ProtectedRoute, AdminRoute, SessionForm, TaskCard, ErrorMessage
  pages/        Landing, Login, Register, Sessions, SessionBoard, Account, Users, NotFound
  test/         Vitest setup and a router helper (tests sit beside the code as *.test.jsx)
  utils/        validation, formatting, enum constants
```

## How authentication works

1. `POST /api/auth/login` or `/register` returns `{ token, user }`.
2. `AuthProvider` stores the JWT in `localStorage` and the user in React state.
3. `api/client.js` adds `Authorization: Bearer <token>` to every protected call.
4. On refresh, `AuthProvider` calls `GET /api/users/me` to restore the user.
5. A 401 on a protected call clears the token and sends the user to `/login`.
6. `ProtectedRoute` guards `/sessions`, `/sessions/:id` and `/account`. `AdminRoute` guards `/users` (admins only).

## Real API and demo mode

All calls use the real Express API by default (`/api` is proxied to
`http://localhost:5000`). Start the backend first (`cd server && node server.js`).

For a demo without a backend, create `client/.env.local` containing:

```
VITE_USE_MOCK=true          # sessions use localStorage demo data
VITE_USE_MOCK_TASKS=true    # tasks use localStorage demo data
```

Auth and user calls always use the real API. A yellow banner shows when demo
data is on.

## API contract used by the client

| Module | Calls |
| --- | --- |
| `api/auth.js` | `POST /auth/register`, `POST /auth/login`, `GET /users/me`, `PATCH /users/:id`, `DELETE /users/:id` |
| `api/sessions.js` | `GET/POST /sessions`, `GET/PATCH/DELETE /sessions/:id`, `POST /sessions/:id/join`, `POST /sessions/:id/leave` |
| `api/tasks.js` | `GET/POST /tasks`, `PUT /tasks/:id`, `PUT /tasks/:id/status`, `PUT /tasks/:id/assign`, `DELETE /tasks/:id` |

Only the session owner can create, update, assign, change the status of or
delete tasks, so the board hides those controls for other participants. The
Task API does not accept `assignedTo` when creating a task, so the client
creates the task and then assigns it.

## Landing page and navigation (SCRUM-10)

- `/` is a public landing page: StudySync name, team logo, Sign Up and Sign In
  links and a list of upcoming study sessions. Signed-in users see a "Go to my
  sessions" button instead.
- The navigation bar marks the current page (`aria-current="page"`). Signed-out
  visitors see Home, Sign In and Sign Up. Signed-in users see Sessions,
  My Profile and Sign Out, plus Users when their role is `admin`.
- Below 640 px the links collapse behind a Menu button.
- Routes other than the landing, sign-in and sign-up pages load on demand.

### Public session list (proposed contract)

The landing page needs session data without a token, and `GET /api/sessions`
requires sign-in. The proposed public endpoint, to be agreed with the Sessions
lead (SCRUM-12), is:

```
GET /api/public/sessions        (no token)
-> { success: true, sessions: [{ id, title, description, scheduledAt, status, participantCount }] }
```

It must not return emails, participant lists or tasks. Until it exists the page
shows labelled sample sessions. Set `VITE_USE_MOCK_PUBLIC=false` in
`client/.env.local` to call the real endpoint once it is merged.

## Tests

```bash
cd client
npm test            # Vitest + React Testing Library
```

Covered so far: `NavBar` (signed-out and signed-in links, admin-only Users link,
current-page marker, sign out, menu button), `LandingPage` (content, sessions,
loading, empty and error states, no private data), `AdminRoute` and `UsersPage`.
Evidence from the latest run is in `docs/evidence/`.

SCRUM-11 adds auth/profile page and auth-provider tests, API error/token tests,
and admin User editing/deletion tests. The admin-only `/users` page reuses the
SCRUM-10 table. Users create accounts through Sign Up; students manage their
own profile; admins can edit names/emails/roles and delete accounts. Self-edits
also update the auth context so role changes take effect immediately.

### Cypress auth/User tests

These tests create and delete disposable accounts. Use a separate local MongoDB
instance/database, never Atlas or the team database. Install dependencies in
both `client/` and `server/`, then run MongoDB locally on port 27018.

1. Start Express with `MONGO_URI=mongodb://127.0.0.1:27018/studysync_e2e`,
   `PORT=5050` and a locally generated `JWT_SECRET`.
2. Start Vite with `VITE_API_URL=http://localhost:5050/api npm run dev`.
3. In another client terminal:

```bash
E2E_MONGO_URI=mongodb://127.0.0.1:27018/studysync_e2e npm run test:e2e
```

The fixture refuses non-local databases or a database name other than
`studysync_e2e`. It creates a test-only admin, without a production backdoor.
The tests cover registration, duplicate email, incorrect login, restoration,
profile persistence, student/admin access, expired tokens, account deletion
and admin User CRUD. Videos and screenshots are generated under `cypress/`
and ignored by Git. Curated evidence is in `../docs/evidence/scrum-11/`.
The tests and recording were AI-assisted; the instructor's specific meaning
of "AI Cypress" still requires team clarification.

## Performance

Lighthouse before and after results, with what changed and why, are in
`docs/performance.md`.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
