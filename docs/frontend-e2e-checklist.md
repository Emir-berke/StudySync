# StudySync Front-End End-to-End Checklist

Manual checklist covering the landing page, navigation, registration, login, sessions, tasks and sign out.
Run it with the backend (`cd server && node server.js`) and the client
(`cd client && npm run dev`) both running, then record the result of each row.

- **Tester:** ______________________
- **Date:** ______________________
- **Browser and version:** ______________________
- **Mode:** Real API / Demo data for sessions and tasks (circle one)

| # | Area | Steps | Expected result | Endpoint | Result (Pass / Fail) | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Route protection | Open `/sessions` while logged out | Redirected to `/login` | none | | |
| 2 | Registration validation | Register with name `A`, email `not-an-email`, password `weak`, a different confirmation | A list of problems is shown and no request is sent | none | | |
| 3 | Registration | Register with a valid name, email and password | Lands on Sessions; name shown in the navbar; token present in `localStorage` | POST `/api/auth/register` | | |
| 4 | Session restore | Refresh the page | Still signed in | GET `/api/users/me` | | |
| 5 | Logout | Click Sign Out | Sent to `/login`; token removed from `localStorage` | none | | |
| 6 | Duplicate email | Register again with the same email | "An account with this email already exists" | POST `/api/auth/register` (409) | | |
| 7 | Login failure | Log in with a wrong password | "Invalid email or password" | POST `/api/auth/login` (401) | | |
| 8 | Login | Log in with the correct details | Lands on Sessions | POST `/api/auth/login` | | |
| 9 | Redirect after login | Sign out, open `/account`, then sign in | Returned to `/account` | POST `/api/auth/login` | | |
| 10 | Account update | Change your name and save | Success message; navbar shows the new name | PATCH `/api/users/:id` | | |
| 11 | Session list | Open Sessions | Sessions load; a loading message shows first | GET `/api/sessions` | | |
| 12 | Create session | New session with title, date and time | New card appears at the top | POST `/api/sessions` | | |
| 13 | Edit session | Edit your own session title and status | Card updates | PATCH `/api/sessions/:id` | | |
| 14 | Join and leave | Join another user's session, then leave | Button and joined count change each time | POST `/api/sessions/:id/join`, POST `/api/sessions/:id/leave` | | |
| 15 | Owner-only actions | View a session you did not create, then open its task board | No Edit or Delete buttons; board shows "Only the session owner can add or change tasks" | none | | |
| 16 | Task board | Open the task board of a session you own | Tasks appear in To Do, In Progress and Done | GET `/api/tasks` | | |
| 17 | Create task | Add a task with title and priority | Appears in To Do | POST `/api/tasks` | | |
| 18 | Move task | Move it To Do, In Progress, Done | Column counts update after each move | PUT `/api/tasks/:id/status` | | |
| 19 | Delete task | Delete the task | Removed from the board | DELETE `/api/tasks/:id` | | |
| 20 | API error message | Stop the backend, then try to log in | "Cannot reach the server" message | none | | |
| 21 | Expired token | Replace the token in `localStorage` with junk and reload | Signed out and sent to `/login` | GET `/api/users/me` (401) | | |
| 22 | Responsive layout | Resize the window to about 390 px wide | No horizontal scrolling; cards and board stack vertically | none | | |
| 23 | Delete account | Delete your account on the My Profile page | Signed out; logging in again fails | DELETE `/api/users/:id` | | |
| 24 | Final sign out | Sign in again with another account, then sign out | Back on `/login`; protected pages redirect | none | | |
| 25 | Landing page | Open `/` while signed out | StudySync name, team logo, Sign Up and Sign In links and a list of sessions; no redirect | public sessions endpoint (when merged) | | |
| 26 | Landing links | Click Sign Up, then go back and click Sign In | Opens `/register`, then `/login`; the nav marks the current page | none | | |
| 27 | Signed-in navigation | Sign in as a student | Nav shows Sessions, My Profile and Sign Out; no Users link | none | | |
| 28 | Admin navigation | Sign in as an admin | Nav also shows Users and the page lists users without passwords | GET `/api/users` | | |
| 29 | Access control | As a student, open `/users` directly | Sent to `/sessions` | none | | |
| 30 | Mobile menu | Resize to about 390 px | Links collapse behind Menu; Menu opens them; no horizontal scrolling | none | | |

## Defects found

| # | Row | Description | Jira ticket | Status |
| --- | --- | --- | --- | --- |
| | | | | |
