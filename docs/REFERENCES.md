# References

Specifications, official documentation, and books behind the patterns in this project.

## Specifications

- GraphQL Specification. https://spec.graphql.org/
- GraphQL Cursor Connections Specification (Relay). https://relay.dev/graphql/connections.htm
- RFC 6750, *The OAuth 2.0 Authorization Framework: Bearer Token Usage* (the `Authorization: Bearer` header format). https://www.rfc-editor.org/rfc/rfc6750
- RFC 3339, *Date and Time on the Internet: Timestamps* (the ISO 8601 profile used for all API times). https://www.rfc-editor.org/rfc/rfc3339
- Web Content Accessibility Guidelines (WCAG) 2.2. https://www.w3.org/TR/WCAG22/
- WAI-ARIA Authoring Practices Guide. https://www.w3.org/WAI/ARIA/apg/

## Official documentation

- Ruby on Rails Guides. https://guides.rubyonrails.org/
  - Active Record Query Interface (scopes, default scopes). https://guides.rubyonrails.org/active_record_querying.html
  - Securing Rails Applications. https://guides.rubyonrails.org/security.html
- `ActiveSupport::CurrentAttributes` API. https://api.rubyonrails.org/classes/ActiveSupport/CurrentAttributes.html
- `ActiveSupport::MessageVerifier` API. https://api.rubyonrails.org/classes/ActiveSupport/MessageVerifier.html
- GraphQL-Ruby. https://graphql-ruby.org/
  - Dataloader. https://graphql-ruby.org/dataloader/overview.html
  - Complexity and depth limits. https://graphql-ruby.org/queries/complexity_and_depth.html
- SQLite: transactions and `BEGIN IMMEDIATE`. https://www.sqlite.org/lang_transaction.html
- Apollo Client (React). https://www.apollographql.com/docs/react/
- GraphQL Code Generator, client preset. https://the-guild.dev/graphql/codegen/plugins/presets/preset-client
- Testing Library guiding principles. https://testing-library.com/docs/guiding-principles
- Playwright. https://playwright.dev/

## Security guidance

- OWASP Cheat Sheet Series. https://cheatsheetseries.owasp.org/
  - GraphQL Cheat Sheet. https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html
  - Authentication Cheat Sheet. https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html

## Books

- Martin Kleppmann, *Designing Data-Intensive Applications*, O'Reilly, 2017. Chapter 7 (Transactions) explains race conditions such as the double-booking problem and how serializable execution prevents them.
- Martin Fowler, *Patterns of Enterprise Application Architecture*, Addison-Wesley, 2002. The Service Layer pattern behind `server/app/services`.
