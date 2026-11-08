module Types
  class EquipmentType < BaseObject
    MAX_WINDOW = 7.days

    field :id, ID, null: false
    field :name, String, null: false
    field :category, String, null: false
    field :location, String, null: false
    field :description, String, null: false
    field :active, Boolean, null: false

    field :reservations, [ReservationType], null: false,
                                            description: "Confirmed reservations overlapping the window (at most 7 days)" do
      argument :from, GraphQL::Types::ISO8601DateTime
      argument :to, GraphQL::Types::ISO8601DateTime
    end

    def reservations(from:, to:)
      raise GraphQL::ExecutionError, "`to` must be after `from`" unless to > from
      raise GraphQL::ExecutionError, "The window can be at most 7 days" if to - from > MAX_WINDOW

      object.reservations.confirmed.overlapping(from, to).chronological
    end
  end
end
