# Pure time rules for a reservation request. No database access, so these are
# fast to unit test and easy to reason about in isolation.
class BookingRules
  def initialize(starts_at:, ends_at:, now: Time.current)
    @starts_at = starts_at
    @ends_at = ends_at
    @now = now
  end

  # Returns a list of { field:, message: } hashes; empty means the request is valid.
  def violations
    return [{ field: "endsAt", message: "End time must be after the start time" }] unless @ends_at > @starts_at

    [past_start, misaligned(@starts_at, "startsAt"), misaligned(@ends_at, "endsAt"), too_long].compact
  end

  private

  def past_start
    { field: "startsAt", message: "Start time is in the past" } if @starts_at < @now
  end

  def misaligned(time, field)
    return if (time.to_i % Reservation::SLOT.to_i).zero?

    { field: field, message: "Times must fall on #{Reservation::SLOT.in_minutes.to_i}-minute boundaries" }
  end

  def too_long
    return if @ends_at - @starts_at <= Reservation::MAX_DURATION

    { field: "endsAt", message: "Reservations can be at most #{Reservation::MAX_DURATION.in_hours.to_i} hours long" }
  end
end
