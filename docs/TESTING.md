# Testing

## Strategy

Each layer is tested with the cheapest tool that can prove its behavior, and every test checks an observable outcome (a returned value, a database row, a rendered message, an HTTP response), not that a function was merely called.

| Layer | Tool | Location | What it proves |
|---|---|---|---|
| Pure rules | Minitest | `server/test/services/booking_rules_test.rb` | Time rules: ordering, 15-minute grid, past starts, maximum length, boundary values. |
| Models | Minitest | `server/test/models` | Validations, the half-open overlap scope, the database check constraint, append-only audit events, tenant scoping. |
| Services | Minitest | `server/test/services` | Booking and cancellation rules, audit side effects, nothing written on failure, token expiry and tampering. |
| Concurrency | Minitest with real threads | `server/test/services/*_concurrency_test.rb` | Four simultaneous bookings of one slot: exactly one succeeds. A booking racing a retirement is refused. Two simultaneous cancellations: one succeeds, one audit event. Each thread loads its own records on its own connection, and the tests run without the wrapping test transaction so threads see each other's commits. |
| API | Rails integration tests | `server/test/graphql` | Full HTTP requests against `/graphql`: authentication, sign-in throttling, security headers, roles, pagination, limits, error codes, query counts, and tenant isolation. |
| Client logic | Vitest | `client/src/lib/*.test.ts` | Date and time math, error mapping, storage fallbacks, session persistence, request headers. |
| Components and pages | Vitest + Testing Library + Apollo `MockedProvider` | `client/src/**/*.test.tsx` | What a user sees and can do: loading, empty, and error states; field errors linked with ARIA; sign-in, booking, cancelling, switching spaces. |
| End to end | Playwright | `client/e2e` | Real browser against real servers and a freshly seeded database. Includes direct API calls with forged headers and guessed ids. |

## Tenant isolation tests

`server/test/graphql/tenant_isolation_test.rb` and `server/test/models/tenant_scoped_test.rb` cover:

- Lists only return the current organization's rows.
- Reading, booking, cancelling, or retiring another organization's record by id returns `NOT_FOUND` and changes nothing.
- A forged `X-Organization-Id` header for a space the user does not belong to yields `TENANT_REQUIRED`.
- Audit logs never include another organization's events.
- A user in two organizations sees each one separately.
- Removing a membership revokes access on the very next request, even with a valid token.
- Querying a tenant model with no tenant raises; bulk updates cannot touch another tenant's rows; records cannot be saved into another tenant.
- A resolver that forgets its guard fails closed with `TENANT_REQUIRED` (`request_handling_test.rb`).

`client/e2e/tenancy.spec.ts` repeats the forged-header and guessed-id attacks through the running server.

## Concurrency on PostgreSQL

SQLite serializes every writer, so on SQLite the concurrency tests would pass even without the row locks. To see the locks do their job, the suite also runs on PostgreSQL: the `server-postgres` CI job uses a `postgres:16` service, and locally any PostgreSQL works through `DATABASE_URL`.

To make a missing lock fail on every run rather than occasionally, the tests use `RaceHelpers#with_widened_race_window` (`server/test/support/race_helpers.rb`), which adds a 0.2-second sleep between the check and the write.

A throwaway local cluster, kept under `server/tmp/pg` (gitignored):

```bash
cd server
LC_ALL=C initdb -D tmp/pg/data -U equipment_bookings --auth=trust --locale=C -E UTF8
pg_ctl -D tmp/pg/data -l tmp/pg/server.log -o "-p 54329 -k $PWD/tmp/pg" -w start
BUNDLE_WITH=postgres bundle install   # installs the optional pg gem
export DATABASE_URL=postgres://equipment_bookings@localhost:54329/equipment_bookings_test RAILS_ENV=test
bin/rails db:prepare && bin/rails test
pg_ctl -D tmp/pg/data stop
```

What we saw on PostgreSQL 17 locally (21 October 2026):

| Change | Test | Result |
|---|---|---|
| None | full suite | 98 tests pass |
| `@equipment.lock!` removed from `ReservationBooking` | "only one of several simultaneous requests for the same slot succeeds" | Fails: 4 of 4 bookings succeed |
| `@equipment.lock!` removed from `ReservationBooking` | "a booking racing a retirement never lands on retired equipment" | Fails: the booking succeeds |
| `@reservation.lock!` removed from `ReservationCancellation` | "only one of two simultaneous cancellations succeeds" | Fails: both succeed |

The same removals on SQLite: the slot test still passes (SQLite's write lock covers it), while the retirement test fails, because without `lock!` the booking never re-reads the row. The concurrency tests passed five runs in a row on PostgreSQL with the locks in place.

## Running

```bash
cd server && bin/rails test          # 98 tests (SQLite; set DATABASE_URL for PostgreSQL)
cd client && npm run test:coverage   # 71 tests
cd client && npm run test:e2e        # 4 Playwright tests (starts both servers)
```

## Coverage (last run)

| Suite | Lines | Branches |
|---|---|---|
| Server (SimpleCov) | 98% | 91% |
| Client (V8) | 97% | 90% |

Thresholds are enforced: the server fails below 95% lines or 85% branches, the client below 80% lines, functions, and statements, or 75% branches.

## Known gaps

- **`client/src/main.tsx` is excluded from coverage.** It only wires providers together and is exercised by every Playwright test.
- **A few client handlers are not covered:** the category drop-down's change handler (category filtering itself is tested through the URL), the "Load more" click handlers, and some `catch` blocks for network failures. Pagination behavior is covered on the server.
- **PostgreSQL runs only in CI by default.** `bin/dev` and a plain `bin/rails test` use SQLite, where the concurrency tests cannot detect a missing lock. Run the suite with `DATABASE_URL` set (above) before changing locking code.
- **The race window is widened by a sleep.** That makes the tests reliable, but it means they prove the lock serializes the check and the write, not that no other race exists.
- **No automated accessibility scanner or accessibility lint plugin runs in CI.** The widely used scanner engine is licensed under MPL-2.0, which is outside this project's permissive-only dependency policy, and the popular JSX accessibility lint plugin depends on it. Accessibility is instead covered by role- and label-based queries in every component and end-to-end test (they fail if an element is not exposed with the right role and accessible name), explicit assertions on `aria-invalid`, `aria-describedby`, `aria-current`, and live regions, and manual keyboard checks.
- **Visual regressions are not tested.** Screenshots would be the next addition.
