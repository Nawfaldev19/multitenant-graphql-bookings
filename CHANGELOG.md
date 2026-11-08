# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-10-21

### Added

- Failed sign-in throttling per email (5) and per client IP (20) over 15 minutes (`SignInThrottle`).
- Security headers on every API response: a `default-src 'none'` Content-Security-Policy, `nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`.
- Optional PostgreSQL through `DATABASE_URL` (the `pg` gem); SQLite stays the default.
- A CI job that runs the server suite on PostgreSQL 16.
- Concurrency tests for cancelling and for booking while an item is retired; each thread now loads its own records.
- Prettier for the client (`npm run format`, `npm run format:check`, checked in CI); client sources formatted.

### Fixed

- A booking could land on equipment retired by a concurrent request: the active check now runs after the row lock.
- Two concurrent cancellations could both succeed and write two audit events: cancellation now locks the row and re-checks its state.
- Two concurrent retirements could both write an audit event: retiring now takes the same row lock.

## [1.0.0] - 2026-10-17

### Added

- Multi-tenant data model (organizations, users, memberships with roles, equipment, reservations, audit events) with fail-closed tenant scoping at the model layer.
- Booking rules (15-minute grid, four-hour maximum, no past starts) and conflict-safe booking under concurrency.
- Cancellation rules and an append-only audit log.
- GraphQL API with signed bearer-token authentication, role checks, coded errors, cursor pagination, depth and complexity limits, and batched association loading.
- React client with typed operations: landing view, sign-in with demo accounts, equipment catalog with search and filters, day schedule and booking form, my reservations, audit log, space switcher, light and dark themes.
- Test suites: Minitest (unit, integration, concurrency, tenant isolation), Vitest with Testing Library, and Playwright end-to-end flows.
- One-command start (`bin/dev`), Docker Compose setup, and GitHub Actions CI.
