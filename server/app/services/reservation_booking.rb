# Creates a reservation if the time rules pass and the slot is free.
#
# The equipment row is locked before anything that a concurrent request could
# change is read: whether the item is still active, and whether the slot is
# free. On PostgreSQL `lock!` is a `SELECT ... FOR UPDATE`, which serializes
# bookings per item; on SQLite the transaction is IMMEDIATE, which serializes
# all writers. Either way two requests for the same slot cannot both succeed,
# and a booking cannot slip in after the item is retired.
class ReservationBooking
  def self.call(...) = new(...).call

  def initialize(equipment:, user:, starts_at:, ends_at:, note: "", now: Time.current)
    @equipment = equipment
    @user = user
    @starts_at = starts_at
    @ends_at = ends_at
    @note = note.to_s.strip
    @now = now
  end

  def call
    violations = BookingRules.new(starts_at: @starts_at, ends_at: @ends_at, now: @now).violations
    return ServiceResult.failure(violations) if violations.any?

    Reservation.transaction do
      # lock! reloads the row, so `active?` reflects any retirement committed before us.
      @equipment.lock!
      next ServiceResult.failure([retired_error]) unless @equipment.active?
      next ServiceResult.failure([conflict_error]) if conflicting?

      create_reservation
    end
  end

  private

  def create_reservation
    reservation = Reservation.new(equipment: @equipment, user: @user, starts_at: @starts_at, ends_at: @ends_at, note: @note)
    return ServiceResult.from_model_errors(reservation) unless reservation.save

    AuditLog.record!(action: "reservation.created", subject: reservation,
                     metadata: { equipment_id: @equipment.id, starts_at: @starts_at.iso8601, ends_at: @ends_at.iso8601 })
    ServiceResult.success(reservation)
  end

  def conflicting?
    @equipment.reservations.confirmed.overlapping(@starts_at, @ends_at).exists?
  end

  def retired_error
    { field: "equipmentId", message: "This equipment has been retired" }
  end

  def conflict_error
    { field: "startsAt", message: "This time overlaps an existing reservation" }
  end
end
