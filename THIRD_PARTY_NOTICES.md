# Third-party notices

This project's own code is MIT licensed (see [LICENSE](LICENSE)). It depends on the open-source packages below, installed by Bundler and npm rather than copied into the repository. Only permissively licensed packages are used.

## Server (direct dependencies, from `server/Gemfile`)

| Package | License | Purpose |
|---|---|---|
| rails | MIT | Web framework |
| graphql | MIT | GraphQL server |
| sqlite3 | BSD-3-Clause | Database driver (default) |
| pg | BSD-2-Clause | PostgreSQL driver (used only when `DATABASE_URL` points at PostgreSQL) |
| puma | BSD-3-Clause | HTTP server |
| bcrypt | MIT | Password hashing |
| rack-cors | MIT | CORS headers |
| json | Ruby License | JSON encoding (also a Ruby default gem; pinned below 3.0 for Rails 8.0 compatibility) |
| rubocop, rubocop-rails, rubocop-minitest | MIT | Linting (development only) |
| simplecov | MIT | Coverage (test only) |

Transitive Ruby dependencies are MIT, Apache-2.0, BSD-2/3-Clause, or dual-licensed under the Ruby License and BSD-2-Clause. One transitive development gem, `rdoc` (pulled in by Rails' console tooling), is dual-licensed "Ruby License or GPL-2.0"; this project uses it under the Ruby License option.

## Client (direct dependencies, from `client/package.json`)

| Package | License | Purpose |
|---|---|---|
| react, react-dom | MIT | UI library |
| react-router-dom | MIT | Routing |
| @apollo/client | MIT | GraphQL client and cache |
| graphql | MIT | GraphQL parsing |
| lucide-react | ISC | Icons |
| vite, @vitejs/plugin-react | MIT | Dev server and build |
| typescript | Apache-2.0 | Type checking |
| @graphql-codegen/cli, @graphql-codegen/client-preset | MIT | Type generation |
| eslint, @eslint/js, typescript-eslint, eslint-plugin-react-hooks, globals | MIT | Linting |
| prettier | MIT | Code formatting |
| vitest, @vitest/coverage-v8 | MIT | Unit and component tests |
| @testing-library/react, @testing-library/user-event, @testing-library/jest-dom | MIT | Component testing |
| jsdom | MIT | DOM for tests |
| @playwright/test | Apache-2.0 | End-to-end tests |
| @types/react, @types/react-dom, @types/node | MIT | Type definitions |

Transitive npm dependencies (development tooling) are MIT, ISC, Apache-2.0, BSD-2/3-Clause, 0BSD, MIT-0, CC0-1.0, BlueOak-1.0.0, or Python-2.0, plus the browser-support dataset `caniuse-lite` (CC-BY-4.0), which is used by the build tooling and not shipped in the app bundle.

## Fonts

Loaded at runtime from Google Fonts; not redistributed in this repository.

| Font | License |
|---|---|
| Fraunces | SIL Open Font License 1.1 |
| Inter | SIL Open Font License 1.1 |
| JetBrains Mono | SIL Open Font License 1.1 |

## Icons and images

- Icons: Lucide (ISC License).
- The favicon (`client/public/favicon.svg`) is original artwork made for this project.
