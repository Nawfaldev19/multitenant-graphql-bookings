require "test_helper"

class ReservationCancellationTest < ActiveSupport::TestCase
  setup do
    travel_to NOW
    organization = create_organization
    @owner_of_booking = add_member(organization)
    @other_member = add_member(organization)
    @staff = add_member(organization, role: "staff")
    @item = create_equipment(@staff)
    @reservation = create_reservation(@owner_of_booking, @item, starts_at: NOW + 1.hour)
  end

  def cancel(membership, reservation = @reservation)
    as_member(membership) { ReservationCancellation.call(reservation: reservation, membership: membership) }
  end

  test "a member cancels their own reservation and it is audited" do
    result = cancel(@owner_of_booking)

    assert_predicate result, :success?
    assert_predicate @reservation.reload, :cancelled?
    assert_equal NOW, @reservation.cancelled_at
    event = as_member(@staff) { AuditEvent.sole }

    assert_equal({ "cancelled_by_owner" => true }, event.metadata)
  end

  test "staff can cancel anyone's reservation" do
    assert_predicate cancel(@staff), :success?
    assert_equal({ "cancelled_by_owner" => false }, as_member(@staff) { AuditEvent.sole.metadata })
  end

  test "a member cannot cancel someone else's reservation" do
    result = cancel(@other_member)

    assert_equal ["You can only cancel your own reservations"], result.errors.pluck(:message)
    assert_predicate @reservation.reload, :confirmed?
  end

  test "cancelling twice is reported, not repeated" do
    cancel(@owner_of_booking)

    assert_equal ["This reservation is already cancelled"], cancel(@owner_of_booking).errors.pluck(:message)
  end

  test "a stale copy is re-checked under the lock, so a second cancel writes nothing" do
    stale_copy = as_member(@staff) { Reservation.find(@reservation.id) }
    cancel(@owner_of_booking)

    assert_equal ["This reservation is already cancelled"], cancel(@staff, stale_copy).errors.pluck(:message)
    assert_equal 1, as_member(@staff) { AuditEvent.count }
  end

  test "past reservations cannot be cancelled" do
    travel 3.hours

    assert_equal ["Reservations that have ended cannot be cancelled"], cancel(@owner_of_booking).errors.pluck(:message)
  end
end
