# Tenant isolation at the data layer.
#
# Every query on a tenant-scoped model is filtered to the organization of the
# current membership. Querying without a tenant raises instead of silently
# returning every organization's rows. Code that legitimately works across
# tenants (seeds, maintenance tasks) must say so with TenantScoped.across_tenants.
module TenantScoped
  extend ActiveSupport::Concern

  class MissingTenantError < StandardError
    def initialize(model_name)
      super("#{model_name} was queried without a current organization")
    end
  end

  BYPASS_KEY = :tenant_scoped_bypass

  def self.across_tenants
    previous = ActiveSupport::IsolatedExecutionState[BYPASS_KEY]
    ActiveSupport::IsolatedExecutionState[BYPASS_KEY] = true
    yield
  ensure
    ActiveSupport::IsolatedExecutionState[BYPASS_KEY] = previous
  end

  def self.bypassed?
    ActiveSupport::IsolatedExecutionState[BYPASS_KEY] == true
  end

  included do
    belongs_to :organization

    default_scope lambda {
      organization = Current.organization
      if organization
        where(organization_id: organization.id)
      elsif !TenantScoped.bypassed?
        raise MissingTenantError, name
      end
    }

    before_validation { self.organization ||= Current.organization }
    validate :organization_must_match_current_tenant
  end

  private

  def organization_must_match_current_tenant
    current = Current.organization
    return if current.nil? || organization_id == current.id

    errors.add(:organization, "does not match the current organization")
  end
end
