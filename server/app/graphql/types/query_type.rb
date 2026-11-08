module Types
  class QueryType < BaseObject
    field :viewer, ViewerType, description: "The signed-in user, or null"

    def viewer
      Current.user
    end

    field :current_organization, OrganizationType, null: false

    def current_organization
      require_membership!.organization
    end

    field :current_role, RoleEnum, null: false

    def current_role
      require_membership!.role
    end

    field :equipment, EquipmentType.connection_type, null: false do
      argument :search, String, required: false
      argument :category, String, required: false
      argument :include_retired, Boolean, required: false, default_value: false,
                                          description: "Managers only"
    end

    def equipment(search: nil, category: nil, include_retired: false)
      membership = require_membership!
      raise GraphqlErrors.forbidden if include_retired && !membership.manager?

      scope = Equipment.matching(search).in_category(category).order(:name, :id)
      include_retired ? scope : scope.active
    end

    field :equipment_item, EquipmentType, null: false do
      argument :id, ID
    end

    def equipment_item(id:)
      require_membership!
      Equipment.find(id)
    end

    field :equipment_categories, [String], null: false

    def equipment_categories
      require_membership!
      Equipment.active.distinct.order(:category).pluck(:category)
    end

    field :my_reservations, ReservationType.connection_type, null: false do
      argument :include_past, Boolean, required: false, default_value: false
    end

    def my_reservations(include_past: false)
      membership = require_membership!
      scope = Reservation.where(user_id: membership.user_id).chronological
      include_past ? scope : scope.where("ends_at > ?", Time.current)
    end

    field :audit_events, AuditEventType.connection_type, null: false, description: "Managers only"

    def audit_events
      membership = require_membership!
      raise GraphqlErrors.forbidden unless AccessPolicy.view_audit_log?(membership)

      AuditEvent.newest_first
    end
  end
end
