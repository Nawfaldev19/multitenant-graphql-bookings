module Mutations
  class CancelReservation < BaseMutation
    argument :id, ID

    field :reservation, Types::ReservationType

    def resolve(id:)
      membership = require_membership!
      result = ReservationCancellation.call(reservation: Reservation.find(id), membership: membership)
      respond(result, :reservation)
    end
  end
end
