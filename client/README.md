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
  components/   NavBar, ProtectedRoute, SessionForm, TaskCard, ErrorMessage
  pages/        Login, Register, Sessions, SessionBoard, Account, NotFound
  utils/        validation, formatting, enum constants
```

## How authentication works

1. `POST /api/auth/login` or `/register` returns `{ token, user }`.
2. `AuthProvider` stores the JWT in `localStorage` and the user in React state.
3. `api/client.js` adds `Authorization: Bearer <token>` to every protected call.
4. On refresh, `AuthProvider` calls `GET /api/users/me` to restore the user.
5. A 401 on a protected call clears the token and sends the user to `/login`.
6. `ProtectedRoute` guards `/sessions`, `/sessions/:id` and `/account`.

## Mock mode

Auth and user calls always use the real API. Sessions and tasks use demo data
(stored in `localStorage`) until their endpoints are merged. To use the real
sessions and tasks API, create `client/.env.local` containing:

```
VITE_USE_MOCK=false
```

The expected endpoints are documented at the top of `src/api/sessions.js` and
`src/api/tasks.js`. If a path or method differs, change it in those two files.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
