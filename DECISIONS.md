# Decisions

## Assumptions
- Staff are internal users with seeded accounts; there is no registration.
- Each inquiry has one owner, its creator. Customers never log in.
- Inquiry volume per user is small enough to list without pagination.

## Design choices
1. **Access rule.** Staff see and change only inquiries they created; managers see all.
   It is enforced in the SQL `WHERE` clause, so bypassing the UI gains nothing. A record
   you cannot access returns **404, not 403**, so the API does not reveal that an ID exists.
2. **Status rules.** New → In Progress → Resolved, and Resolved → In Progress (reopen).
   Skipping a step or returning to New returns 409. The API sends `allowedNext`, so the UI
   offers only valid actions and never duplicates the rules.
3. **Duplicates and missing data.** All four fields are required with length limits,
   validated by Zod on the server and mirrored in the form. A partial unique index rejects
   the same owner + contact + subject (case-insensitive) while an inquiry is not Resolved,
   so the database enforces it even under a race. The API answers 409 with the existing ID.
4. **Stale data (two tabs).** Optimistic concurrency. Each inquiry has a `version`; a status
   change sends the version the tab last saw, and the `UPDATE` also requires
   `AND version = $n`. On a mismatch the API returns 409 with the latest record and the UI
   shows a banner saying the change was **not** applied.
5. **Auth.** JWT in an httpOnly, SameSite=Lax cookie (not readable by JavaScript). The
   middleware reloads the user on every request. Login errors do not reveal whether an
   email exists.

## Trade-off accepted
No real-time sync. A stale tab stays stale until the user acts or clicks Refresh, and the
failed click costs one retry. I chose this over polling or websockets because it is
predictable and cheap, and the brief does not ask for conflict resolution.

## Testing and gaps
- **Backend (real Postgres):** authentication required, the access rule, validation,
  duplicates, invalid transition, stale version, reopening.
- **Frontend (API mocked):** the stale-version banner, valid-only action buttons, the
  inaccessible-inquiry message, form validation, the duplicate link.
- **Gaps:** no concurrent-request test for the race guard, no test for the login page or
  route guard, no list debounce test, no browser end-to-end test. The one-click demo
  accounts on the login page put the demo password in frontend code, which is for
  reviewers only. No pagination (the list is capped at 200), no rate limiting, and CSRF
  protection relies on SameSite=Lax.

## What I would improve next
Pagination, an audit trail of status changes (who and when), login rate limiting and a CSRF
token, an admin-only way to create users, Playwright end-to-end tests, and revalidating the
detail page on window focus.

## Use of AI

I used Claude as a pair-programming assistant throughout. It wrote the first draft of most
of the code (API, database schema, tests, and the UI styling), and I ran everything
locally, read it, and tested it against the three situations in the brief before relying on it.

- **Accepted:** returning 404 instead of 403 when a user opens an inquiry that is not theirs,
  so the API does not reveal that the ID exists. I also accepted the `version` column for
  stale-data detection, because it is simple to enforce in SQL and I can show it working
  with two browser tabs.
- **Changed:** the verification commands were first given in Linux syntax and did not run in
  Windows `cmd`, so I switched to single-line `cmd` versions. While testing I also found and
  fixed two typos that the tests and API responses exposed: a missing space in the
  "Customer name is required." message, and a status string that was inconsistent between
  `allowed` and `allowedNext`.
- **Rejected:** I declined adding user registration and a priority field. The brief rewards a
  small scope I can explain, and registration raises role-assignment questions that are out
  of scope. I would add an admin-only way to create users later.