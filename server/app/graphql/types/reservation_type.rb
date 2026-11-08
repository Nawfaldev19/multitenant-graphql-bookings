module Types
  class ReservationType < BaseObject
    field :id, ID, null: false
    field :starts_at, GraphQL::Types::ISO8601DateTime, null: false
    field :ends_at, GraphQL::Types::ISO8601DateTime, null: false
    field :note, String, null: false
    field :status, ReservationStatusEnum, null: false
    field :cancelled_at, GraphQL::Types::ISO8601DateTime
    field :equipment, EquipmentType, null: false
    field :member, MemberType, null: false
    field :is_mine, Boolean, null: false, resolver_method: :owned_by_viewer?
    field :can_cancel, Boolean, null: false, resolver_method: :cancellable_by_viewer?

    def equipment
      dataloader.with(Sources::RecordById, Equipment).load(object.equipment_id)
    end

    def member
      dataloader.with(Sources::RecordById, User).load(object.user_id)
    end

    def owned_by_viewer?
      object.user_id == Current.user.id
    end

    def cancellable_by_viewer?
      object.confirmed? && object.ends_at > Time.current && AccessPolicy.cancel_reservation?(Current.membership, object)
    end
  end
end
