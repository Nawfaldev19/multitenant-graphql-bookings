# Security

This is a threat model for the demo: what is protected, from whom, how, and what is knowingly left out.

## Assets

- Reservation and audit data of each organization.
- Member email addresses.
- User passwords and session tokens.

## Actors

- **Anonymous visitor:** no token.
- **Member of organization A:** valid token, membership in A only.
- **Manager (owner or staff) of A.**
- **Member of A and B:** valid token, two memberships.

## Threats and mitigations

| Threat | Mitigation | Where |
|---|---|---|
| Member of A reads or changes B's data by guessing ids | Tenant default scope hides B's rows; the record looks absent (`NOT_FOUND`). | `TenantScoped`, `EquipmentBookingsSchema.rescue_from` |
| Member of A sends `X-Organization-Id: B` | The membership is looked up through the user's own memberships; no match means no tenant (`TENANT_REQUIRED`). | `GraphqlController#membership_for_requested_organization` |
| A new resolver forgets the tenant guard | Querying a tenant model with no tenant raises; the schema maps it to `TENANT_REQUIRED` and logs it. | `TenantScoped`, test in `request_handling_test.rb` |
| Member performs a manager action | `require_manager!` and `AccessPolicy` checked on every request. | `AccessGuards`, `AccessPolicy` |
| Member cancels someone else's booking | `AccessPolicy.cancel_reservation?` | `ReservationCancellation` |
| Member reads peers' emails | `Member.email` returns null unless the viewer is a manager or that member. | `Types::MemberType` |
| Removed member keeps access with an old token | Membership is re-checked on every request. | `GraphqlController` |
| Token forgery or tampering | HMAC-signed with `secret_key_base`, purpose-bound, 12-hour expiry. | `AuthToken` |
| Account enumeration through sign-in | Same message for unknown email and wrong password; `authenticate_by` runs a password hash even for unknown emails, so timing is similar. | `Mutations::SignIn` |
| Password guessing | Failed sign-ins are counted per email and per client IP over a 15-minute window. After 5 failures for one email, or 20 from one IP, sign-in is refused (even with the right password) until the window passes. Successful sign-ins never count. | `SignInThrottle`, `Mutations::SignIn` |
| Weak passwords | Minimum 12 characters; stored with bcrypt. | `User` |
| Double booking through a race | Equipment row locked, then the active and overlap checks, then the insert, all in one transaction. Tested on PostgreSQL in CI. | `ReservationBooking` |
| Booking a just-retired item, or cancelling twice | The state checks run after the row lock, so they see any concurrent change. | `ReservationBooking`, `ReservationCancellation`, `Mutations::RetireEquipment` |
| Abusive queries (deep nesting, huge pages) | `max_depth`, `max_complexity`, page size cap of 50, schedule window of at most 7 days. | `EquipmentBookingsSchema`, `EquipmentType` |
| SQL injection through search | Parameterized query; `LIKE` wildcards in user input are escaped. | `Equipment.matching` |
| Tampering with history | Audit events are read-only once saved. | `AuditEvent#readonly?` |
| Content sniffing, framing, referrer leaks | Every API response sends `Content-Security-Policy: default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`. The API only returns JSON, so it needs no allowances. | `config/application.rb`, `security_headers_test.rb` |
| Cross-origin requests from other sites | CORS allows only the configured web origin, and only `POST /graphql`. | `config/initializers/cors.rb` |
| Secrets in logs | `password`, `token`, and `secret` parameters are filtered. | `filter_parameter_logging.rb` |
| Secrets in the repository | None committed. Development generates a local secret in `tmp/` (gitignored); production requires `SECRET_KEY_BASE`. | `.env.example` |

## Input validation

- GraphQL types reject wrongly typed input before any resolver runs (for example, an invalid `ISO8601DateTime`).
- Model validations bound every string (names 80, notes 280, descriptions 1000 characters) and check formats (email, slug).
- Mutation inputs are trimmed before validation.
- Malformed request bodies return HTTP 400 with a coded error.

## Known limitations

These are deliberate scope cuts for a demo, listed so nobody mistakes them for oversights:

- **Token storage.** The client keeps the token in `localStorage`, which any injected script could read. React escapes rendered content and the app renders no user HTML, which limits that risk, but a production app should use an `HttpOnly`, `SameSite` cookie with CSRF protection, or a server-side session table that supports revocation.
- **Rate limiting covers sign-in only, in one process.** Other mutations need a valid token and are not limited. The sign-in counters live in a per-process memory store, so they reset on restart and are not shared between processes; a multi-process deployment would pass a shared cache store to `SignInThrottle.store=`. The per-email limit also lets someone who knows an address lock it out for one 15-minute window; we accept that in exchange for stopping guessers who rotate IPs. The client IP comes from `request.remote_ip`, so behind a proxy Rails must be told which proxies to trust.
- **No revocation list** for tokens before expiry.
- **The web app's own headers.** The API sets the headers above, but the Vite dev server that serves the web app does not set a Content-Security-Policy. A production deployment would set one at the web server that hosts the built files.
- **No HTTPS** in local development. `FORCE_SSL=true` enables Rails' SSL enforcement in production.
