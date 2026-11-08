# Plan

## Goal

Show, in one small but complete project, how to build a multi-tenant SaaS feature end to end: a secure GraphQL API, business rules that survive concurrency, a typed and accessible client, and tests that prove the important properties.

## Users and stories

- **Member:** "I can see what my makerspace has, check when it's free, book a slot, and cancel my own booking."
- **Staff or owner:** "I can add or retire equipment, cancel any booking in my space, and see who changed what."
- **Person in two spaces:** "I can switch between spaces, and I never see one space's data while working in the other."

## In scope

- Sign-in with demo accounts; roles per organization.
- Equipment catalog with search, category filter, and pagination.
- Day schedule per item; booking with conflict detection; cancellation.
- Retiring equipment; audit log.
- Light and dark themes; responsive layout.

## Out of scope

Sign-up, invitations, password reset, payments, notifications, recurring bookings, per-organization time zones, real-time updates. See the README's "Known limitations and next steps".

## Build order

We built it bottom up, so each layer had tests before the next one depended on it:

1. **Data model and tenancy:** organizations, users, memberships, equipment, reservations, audit events; the `TenantScoped` concern with tests.
2. **Rules and services:** booking rules, booking with locking, cancellation, audit log; unit and concurrency tests.
3. **API:** schema, guards, error codes, limits, dataloader; integration and isolation tests.
4. **Client foundation:** tokens, layout, session, Apollo setup, generated types.
5. **Client features:** equipment list, detail and booking, my reservations, audit log; component tests.
6. **End to end and delivery:** Playwright flows, one-command start, Docker, CI, documentation.
7. **Hardening (1.1.0):** after reading the code again with an attacker's eye, we throttled failed sign-ins, added API security headers, moved every state check behind its row lock, ran the suite on PostgreSQL so the concurrency tests can fail, and added Prettier.

## What "finished" means here

- Lint, formatting, type check, unit, integration, component, and end-to-end tests pass.
- Coverage thresholds met on both sides.
- The server suite passes on SQLite and on PostgreSQL.
- `bin/dev` starts the app from a clean checkout.
- Every claim in the README links to code that demonstrates it.
