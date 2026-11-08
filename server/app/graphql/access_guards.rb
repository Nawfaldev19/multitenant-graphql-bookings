# Guards shared by query resolvers and mutations. Each returns the value the
# caller needs (user or membership) or raises a coded GraphQL error.
module AccessGuards
  def require_user!
    Current.user || raise(GraphqlErrors.unauthenticated)
  end

  def require_membership!
    require_user!
    Current.membership || raise(GraphqlErrors.tenant_required)
  end

  def require_manager!
    membership = require_membership!
    raise GraphqlErrors.forbidden unless membership.manager?

    membership
  end
end
