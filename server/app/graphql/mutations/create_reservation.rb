module Mutations
  class CreateReservation < BaseMutation
    argument :equipment_id, ID
    argument :starts_at, GraphQL::Types::ISO8601DateTime
    argument :ends_at, GraphQL::Types::ISO8601DateTime
    argument :note, String, required: false, default_value: ""

    field :reservation, Types::ReservationType

    def resolve(equipment_id:, starts_at:, ends_at:, note:)
      membership = require_membership!
      equipment = Equipment.find(equipment_id)
      result = ReservationBooking.call(equipment: equipment, user: membership.user, starts_at: starts_at, ends_at: ends_at, note: note)
      respond(result, :reservation)
    end
  end
end
