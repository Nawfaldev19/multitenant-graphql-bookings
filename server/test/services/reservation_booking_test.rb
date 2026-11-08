require "test_helper"

class ReservationBookingTest < ActiveSupport::TestCase
  setup do
    travel_to NOW
    @member = add_member(create_organization)
    @item = create_equipment(@member)
  end

  def book(starts_at, ends_at, equipment: @item, note: "")
    as_member(@member) do
      ReservationBooking.call(equipment: equipment, user: @member.user, starts_at: starts_at, ends_at: ends_at, note: note)
    end
  end

  test "books a free slot and records an audit event" do
    result = book(NOW + 1.hour, NOW + 2.hours, note: "  Prototype enclosure  ")

    assert_predicate result, :success?
    assert_equal "Prototype enclosure", result.record.note
    event = as_member(@member) { AuditEvent.sole }

    assert_equal "reservation.created", event.action
    assert_equal result.record.id, event.subject_id
    assert_equal @member.user, event.actor
  end

  test "refuses an overlapping slot and writes nothing" do
    book(NOW + 1.hour, NOW + 2.hours)

    result = book(NOW + 1.hour + 30.minutes, NOW + 3.hours)

    assert_not result.success?
    assert_equal [{ field: "startsAt", message: "This time overlaps an existing reservation" }], result.errors
    assert_equal 1, as_member(@member) { Reservation.count }
    assert_equal 1, as_member(@member) { AuditEvent.count }
  end

  test "allows back-to-back slots" do
    book(NOW + 1.hour, NOW + 2.hours)

    assert_predicate book(NOW + 2.hours, NOW + 3.hours), :success?
  end

  test "cancelled reservations do not block the slot" do
    create_reservation(@member, @item, starts_at: NOW + 1.hour, status: "cancelled")

    assert_predicate book(NOW + 1.hour, NOW + 2.hours), :success?
  end

  test "the same slot on different equipment is fine" do
    other = create_equipment(@member)
    book(NOW + 1.hour, NOW + 2.hours)

    assert_predicate book(NOW + 1.hour, NOW + 2.hours, equipment: other), :success?
  end

  test "returns time rule violations without touching the database" do
    result = book(NOW - 1.hour, NOW + 1.hour)

    assert_equal ["Start time is in the past"], result.errors.pluck(:message)
    assert_equal 0, as_member(@member) { Reservation.count }
  end

  test "refuses retired equipment" do
    as_member(@member) { @item.update!(active: false) }

    assert_equal [{ field: "equipmentId", message: "This equipment has been retired" }], book(NOW + 1.hour, NOW + 2.hours).errors
  end

  test "checks retirement after taking the lock, not on the caller's possibly stale copy" do
    stale_copy = as_member(@member) { Equipment.find(@item.id) }
    as_member(@member) { @item.update!(active: false) }

    result = book(NOW + 1.hour, NOW + 2.hours, equipment: stale_copy)

    assert_equal [{ field: "equipmentId", message: "This equipment has been retired" }], result.errors
    assert_equal 0, as_member(@member) { Reservation.count }
  end

  test "surfaces model validation errors as field errors" do
    result = book(NOW + 1.hour, NOW + 2.hours, note: "x" * 281)

    assert_equal ["note"], result.errors.pluck(:field)
  end
end
