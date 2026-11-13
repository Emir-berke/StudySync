# StudySync Front-End End-to-End Checklist

Manual checklist covering registration, login, sessions, tasks and logout.
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
| 5 | Logout | Click Log out | Sent to `/login`; token removed from `localStorage` | none | | |
| 6 | Duplicate email | Register again with the same email | "An account with this email already exists" | POST `/api/auth/register` (409) | | |
| 7 | Login failure | Log in with a wrong password | "Invalid email or password" | POST `/api/auth/login` (401) | | |
| 8 | Login | Log in with the correct details | Lands on Sessions | POST `/api/auth/login` | | |
| 9 | Redirect after login | Log out, open `/account`, then log in | Returned to `/account` | POST `/api/auth/login` | | |
| 10 | Account update | Change your name and save | Success message; navbar shows the new name | PATCH `/api/users/:id` | | |
| 11 | Session list | Open Sessions | Sessions load; a loading message shows first | GET `/api/sessions` | | |
| 12 | Create session | New session with title, date and time | New card appears at the top | POST `/api/sessions` | | |
| 13 | Edit session | Edit your own session title and status | Card updates | PATCH `/api/sessions/:id` | | |
| 14 | Join and leave | Join another user's session, then leave | Button and joined count change each time | POST `/api/sessions/:id/join`, POST `/api/sessions/:id/leave` | | |
| 15 | Owner-only actions | View a session you did not create | No Edit or Delete buttons | none | | |
| 16 | Task board | Open a session's task board | Tasks appear in To Do, In Progress and Done | GET `/api/sessions/:id/tasks` | | |
| 17 | Create task | Add a task with title and priority | Appears in To Do | POST `/api/sessions/:id/tasks` | | |
| 18 | Move task | Move it To Do, In Progress, Done | Column counts update after each move | PUT `/api/tasks/:id` | | |
| 19 | Delete task | Delete the task | Removed from the board | DELETE `/api/tasks/:id` | | |
| 20 | API error message | Stop the backend, then try to log in | "Cannot reach the server" message | none | | |
| 21 | Expired token | Replace the token in `localStorage` with junk and reload | Signed out and sent to `/login` | GET `/api/users/me` (401) | | |
| 22 | Responsive layout | Resize the window to about 390 px wide | No horizontal scrolling; cards and board stack vertically | none | | |
| 23 | Delete account | Delete your account on the Account page | Signed out; logging in again fails | DELETE `/api/users/:id` | | |
| 24 | Final logout | Log in again with another account, then log out | Back on `/login`; protected pages redirect | none | | |

## Defects found

| # | Row | Description | Jira ticket | Status |
| --- | --- | --- | --- | --- |
| | | | | |
