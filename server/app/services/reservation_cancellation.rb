# Cancels a confirmed reservation that has not ended yet.
#
# The state checks run inside a transaction with the reservation row locked,
# so when two cancellations race, the second one waits, reloads, sees the
# first one's change, and reports "already cancelled" instead of writing a
# second update and a second audit event.
class ReservationCancellation
  def self.call(...) = new(...).call

  def initialize(reservation:, membership:, now: Time.current)
    @reservation = reservation
    @membership = membership
    @now = now
  end

  def call
    return failure("You can only cancel your own reservations") unless allowed?

    Reservation.transaction do
      @reservation.lock!
      problem = state_problem
      next failure(problem) if problem

      @reservation.update!(status: :cancelled, cancelled_at: @now)
      AuditLog.record!(action: "reservation.cancelled", subject: @reservation,
                       metadata: { cancelled_by_owner: @reservation.user_id == @membership.user_id })
      ServiceResult.success(@reservation)
    end
  end

  private

  # Ownership and role never change on a reservation, so this check does not need the lock.
  def allowed?
    AccessPolicy.cancel_reservation?(@membership, @reservation)
  end

  # Read only after the lock, so it sees any cancellation committed before ours.
  def state_problem
    if @reservation.cancelled?
      "This reservation is already cancelled"
    elsif @reservation.ends_at <= @now
      "Reservations that have ended cannot be cancelled"
    end
  end

  def failure(message)
    ServiceResult.failure([{ field: nil, message: message }])
  end
end
