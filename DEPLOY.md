# Deploying a free live demo (Render)

This is a checklist for putting the demo online on Render's free tier. [`render.yaml`](render.yaml) describes both services; nothing is deployed until you connect the repository.

What you get: a Rails GraphQL API (`equipment-bookings-api`) and a static React site (`equipment-bookings-web`).

Free-tier behaviour to expect:

- The API sleeps after about 15 minutes without traffic, so the first request after a pause takes up to a minute.
- The disk is ephemeral. SQLite is re-created and re-seeded on every restart, so bookings made by visitors do not last. That suits a demo.
- SQLite serializes writes, so the no-double-booking guarantee holds here through that serialization. The row locks are exercised on PostgreSQL ([ADR-009](docs/DECISIONS.md#adr-009-postgresql-as-a-second-test-database)). To run the demo on PostgreSQL, create a free Render Postgres, set `DATABASE_URL` on the API, and add `BUNDLE_WITH=postgres` to its build environment.

## Steps

1. Create a Render account at render.com (sign in with GitHub) and grant it access to this repository.
2. Push the repository to GitHub.
3. In Render choose **New > Blueprint**, pick this repository, and apply. Render reads `render.yaml` and creates both services.
4. Generate a secret locally and paste it as `SECRET_KEY_BASE` on `equipment-bookings-api` when Render asks:

   ```bash
   ruby -rsecurerandom -e 'puts SecureRandom.hex(64)'
   ```

5. Leave `CORS_ALLOWED_ORIGINS` empty for the first deploy, then copy the static site's URL (for example `https://equipment-bookings-web.onrender.com`, no trailing slash) into it on the API and save. The service restarts.
6. If Render renamed the API (the name was taken), set `VITE_API_URL` to `https://<api-host>/graphql` on the static site, then **Manual Deploy > Clear build cache & deploy**. It is a build-time value.
7. Open the site, click **Try the demo**, continue as Ada Okafor, open the laser cutter and book a slot.
8. Put the site URL in the "Live demo" line of the README.

## Environment variables

| Service | Variable | Value |
|---|---|---|
| API | `RAILS_ENV` | `production` (set in the blueprint) |
| API | `SECRET_KEY_BASE` | your generated secret |
| API | `CORS_ALLOWED_ORIGINS` | the static site's origin |
| API | `DATABASE_URL` | optional, a `postgres://` URL (needs `BUNDLE_WITH=postgres` at build time) |
| Site | `VITE_API_URL` | `https://<api-host>/graphql` |
