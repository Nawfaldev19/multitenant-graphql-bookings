# Architecture decision records

Each record states the context, the decision, and its consequences, including what was given up.

## ADR-001: Tenant isolation with a fail-closed default scope

**Context.** Every tenant-owned table carries `organization_id`. The common bug in multi-tenant apps is a query that forgets to filter by it. Options considered:

1. Filter manually in every resolver (`Current.organization.equipment`). Simple, but one forgotten call leaks data.
2. A separate database or schema per tenant. Strong isolation, but heavy operational cost for a handful of small spaces, and it complicates users who belong to several spaces.
3. PostgreSQL row-level security. Strong and enforced by the database, but ties the demo to one database and moves logic out of the application where reviewers can read it.
4. A model-level default scope that raises when no tenant is set.

**Decision.** Option 4, implemented in a small concern (`TenantScoped`) rather than a gem, so the mechanism is visible. Resolvers still call explicit guards (`require_membership!`) so intent is clear at the API layer.

**Consequences.** Forgetting a guard raises an error instead of leaking rows; a test proves this. Seeds and maintenance code must wrap cross-tenant work in `TenantScoped.across_tenants`, which is easy to search for in review. Raw SQL and `unscoped` bypass the scope, so both are avoided in application code. If the app moved to PostgreSQL, adding row-level security underneath would be a natural second layer.

## ADR-002: SQLite by default

**Context.** Reviewers should be able to run the project with one command and no database server.

**Decision.** Use SQLite in development, test, and the Docker image unless `DATABASE_URL` says otherwise. Rails 8 opens SQLite transactions in `IMMEDIATE` mode, so concurrent writers are serialized.

**Consequences.** Setup is trivial. Booking writes are serialized across the whole database, which is far more than enough for a makerspace but would not suit high write volume. The services still call `lock!`, which is a real row lock on PostgreSQL; ADR-009 covers how we check that. Case-insensitive search uses `LOWER(...) LIKE`, which works on both.

## ADR-003: GraphQL with mutation payload errors

**Context.** The client needs to show validation problems next to the right form field, and also to react to authentication and permission failures.

**Decision.** Two error channels. User-fixable problems are returned as data in each mutation payload (`errors: [{ field, message }]`). Everything else is a top-level GraphQL error with `extensions.code` (`UNAUTHENTICATED`, `FORBIDDEN`, `TENANT_REQUIRED`, `NOT_FOUND`).

**Consequences.** Forms render field errors without parsing messages, and the client can sign the user out on `UNAUTHENTICATED` from one place (an Apollo error link). The cost is a slightly larger schema, since every mutation declares an `errors` field.

## ADR-004: Signed, expiring bearer tokens

**Context.** The API needs stateless authentication that is easy to demonstrate and test.

**Decision.** Issue tokens with `ActiveSupport::MessageVerifier` (HMAC-signed, purpose-bound, 12-hour expiry) keyed from `secret_key_base`. The client sends them in the `Authorization` header.

**Consequences.** No token table and no external dependency. Tokens cannot be revoked individually before expiry; deleting the user or their membership does take effect immediately because both are checked on each request. Storing the token in `localStorage` exposes it to any script injected into the page; see [SECURITY.md](SECURITY.md) for why this is acceptable here and what a production build would do instead.

## ADR-005: Offset-backed cursors

**Context.** graphql-ruby's default connection for Active Record relations encodes the offset in an opaque cursor.

**Decision.** Keep the default, with a stable sort (`name, id` and `starts_at, id`) so pages never overlap or skip items when nothing changes between requests.

**Consequences.** Simple and well tested by the library. With concurrent inserts, a page boundary can shift by one item, and deep pages cost more on large tables. Keyset ("seek") pagination would fix both; it was not worth the extra code at this scale.

## ADR-006: Dataloader for associations instead of `includes`

**Context.** GraphQL clients choose which nested fields to request, so the server cannot know up front which associations to preload.

**Decision.** Resolve `belongs_to` fields in lists through a batching source (`Sources::RecordById`) that collects ids during execution and loads each model once.

**Consequences.** Query count stays constant regardless of page size, and only requested associations are loaded. The source still goes through the tenant default scope, so batching cannot cross tenants.

## ADR-007: Generated client types, committed to the repository

**Context.** Hand-written TypeScript types for API responses drift from the schema.

**Decision.** Dump the schema (`bin/rails graphql:dump_schema`) and generate typed documents with GraphQL Code Generator's client preset. Both outputs are committed, and CI fails if regenerating them changes anything.

**Consequences.** The client builds without a running server, and any breaking schema change shows up as a type error. Contributors must remember to run `npm run codegen`; CI catches it if they do not.

## ADR-008: Apollo Client 3 and pinned Playwright

**Context.** Apollo Client 3.14 marks several callback properties as deprecated ahead of version 4. Playwright's newest browser builds do not support the macOS version this was developed on.

**Decision.** Stay on Apollo Client 3 (one deprecated property is used, with an inline note). Pin `@playwright/test` to 1.49.1, which still ships browsers for that macOS version.

**Consequences.** Upgrading to Apollo Client 4 is a contained follow-up (error handling moves to a single `error` property). Playwright can be upgraded freely on Linux CI runners.

## ADR-009: PostgreSQL as a second test database

**Context.** The concurrency tests first ran on SQLite only. SQLite's `IMMEDIATE` transactions serialize every writer, so those tests passed even with the `lock!` calls deleted: they proved SQLite's write lock, not our locking.

**Decision.** Support PostgreSQL through `DATABASE_URL` (the `pg` gem), keep SQLite as the default for `bin/dev`, and run the full server suite on a `postgres:16` service in CI as well. The concurrency tests give each thread its own records and connection, and widen the gap between check and write with a short sleep, so a missing lock fails on every run rather than occasionally.

**Consequences.** The locks are now tested where they matter, and the schema, search, and JSON columns are known to work on both databases. CI takes one more job. Locally the PostgreSQL run is optional; [TESTING.md](TESTING.md#concurrency-on-postgresql) shows how to start a throwaway cluster. Row-level security under the default scope (ADR-001) becomes possible but is not added.
