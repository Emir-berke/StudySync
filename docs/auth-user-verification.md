# Authentication and User integration verification

SCRUM-11 builds on the Part 1 User API and SCRUM-10's existing React screens.
The auth context, `studysync_token` storage key, `/users` admin route and
`GET /api/users/me` contract are preserved.

## Implemented behavior

- Sign Up creates student accounts. Sign In, saved-session restoration,
  protected redirects and Sign Out use the real Express API.
- My Profile updates a user's name/email and supports confirmed account
  deletion. Pending deletion disables repeat actions.
- The existing admin Users table now supports editing name/email/role and
  confirmed deletion. Editing the current admin also updates the auth context.
  The server remains responsible for owner/admin access checks.
- Tokens remain available for the current page when browser storage is blocked.
  Logging out ignores a stale stored token if removal fails. Refresh persistence
  requires working browser storage.

## Verified locally on November 27, 2026

| Check | Result |
| --- | --- |
| Frontend Vitest component/API-client tests | 43 passed, 7 files |
| Backend Jest/Supertest tests | 44 passed, 7 suites |
| ESLint | Passed |
| Production Vite build | Passed |
| Cypress with React, Express and MongoDB | 2 complete flows passed |

Backend tests used a separate MongoDB instance on localhost port 27018 and the
guarded `studysync_test` database. Cypress used the separate `studysync_e2e`
database. No shared team database was used.

The recorded Cypress flows verify registration, duplicate-email errors,
incorrect credentials, login, refresh restoration, persisted profile changes,
logout, student/admin route access, API access denial, invalid-token handling,
account deletion, admin edits after refresh and admin deletion. Backend tests
also verify cross-user edit/delete denial, self-promotion denial, duplicate
profile email rejection and rejected restoration after account deletion.

## Evidence

- [Unit result screenshot](evidence/scrum-11/unit-test-results.jpg) is a rendered
  summary generated from the actual Vitest JSON output, not a terminal capture.
- [Cypress recording](evidence/scrum-11/auth-users.cy.js.mp4)
- [Persisted student profile](evidence/scrum-11/student-profile-persisted.png)
- [Admin User CRUD](evidence/scrum-11/admin-user-crud.png)
- Test code: `client/cypress/e2e/auth-users.cy.js`; fixture configuration:
  `client/cypress.config.js`. Reproduction steps are in `client/README.md`.

## Scope and limits

The Part 1 report identified a MongoDB permission error on `test.users`, followed
by a continued registration failure after configuration changes. This check
could not reproduce that specific Atlas environment because its current private
configuration was unavailable. Successful local registration does not prove
that historical deployment issue is fixed, and no registration-server fix is
claimed here.

These results apply to this branch locally. Merged/deployed verification remains
necessary after review. They do not certify Session/Task flows or complete
SCRUM-14's combined application tests. The assignment's exact intended
"AI Cypress" workflow still needs clarification; this evidence is an
AI-assisted Cypress specification and a recording of its actual execution.

## AI assistance

OpenAI Codex assisted with SCRUM-11 implementation, test authoring, execution
and documentation. The recorded test results above came from actual local runs.
