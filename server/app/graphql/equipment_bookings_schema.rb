class EquipmentBookingsSchema < GraphQL::Schema
  query Types::QueryType
  mutation Types::MutationType

  use GraphQL::Dataloader

  max_depth 12
  # Sized so a full page (50) of the richest list the client renders fits,
  # while requests for thousands of nodes are rejected before execution.
  max_complexity 1000
  default_page_size 20
  default_max_page_size 50

  # A record outside the current tenant is invisible to the default scope, so it
  # surfaces here as "not found" rather than "forbidden". That avoids revealing
  # whether an id exists in another organization.
  rescue_from(ActiveRecord::RecordNotFound) { raise GraphqlErrors.not_found }

  rescue_from(TenantScoped::MissingTenantError) do |error|
    Rails.logger.error(event: "tenant.missing", error: error.message)
    raise GraphqlErrors.tenant_required
  end
end
