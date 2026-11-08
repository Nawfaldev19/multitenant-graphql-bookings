# Top-level GraphQL errors carry a machine-readable `extensions.code` so the
# client can react (for example, sign the user out on UNAUTHENTICATED).
module GraphqlErrors
  module_function

  def build(message, code)
    GraphQL::ExecutionError.new(message, extensions: { "code" => code })
  end

  def unauthenticated = build("Sign in to continue", "UNAUTHENTICATED")
  def forbidden = build("You do not have permission to do that", "FORBIDDEN")
  def tenant_required = build("Choose an organization you belong to", "TENANT_REQUIRED")
  def not_found = build("Not found", "NOT_FOUND")
end
