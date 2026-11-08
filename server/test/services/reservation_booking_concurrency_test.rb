require "test_helper"
require_relative "../support/race_helpers"

# Real concurrent transactions against the configured database. On PostgreSQL
# (DATABASE_URL set, as in CI) these tests fail if the `lock!` calls are removed
# from ReservationBooking; docs/TESTING.md records that check. On SQLite they
# pass either way, because SQLite serializes all writers.
class ReservationBookingConcurrencyTest < ActiveSupport::TestCase
  include RaceHelpers

  self.use_transactional_tests = false

  setup do
    @member = add_member(create_organization)
    @item = create_equipment(@member)
    @starts_at = 1.day.from_now.utc.beginning_of_hour
  end

  teardown { delete_all_records }

  def book_in_thread
    membership = reload_membership(@member)
    as_member(membership) do
      equipment = Equipment.find(@item.id)
      ReservationBooking.call(equipment: equipment, user: membership.user, starts_at: @starts_at, ends_at: @starts_at + 1.hour)
    end
  end

  test "only one of several simultaneous requests for the same slot succeeds" do
    results = with_widened_race_window(ReservationBooking, :conflicting?) do
      run_concurrently(4) { book_in_thread }
    end

    assert_equal 1, results.count(&:success?)
    assert_equal 1, as_member(@member) { Reservation.count }
    assert_equal 1, as_member(@member) { AuditEvent.count }
  end

  test "a booking racing a retirement never lands on retired equipment" do
    retire = lambda do
      membership = reload_membership(@member)
      as_member(membership) do
        equipment = Equipment.find(@item.id)
        Equipment.transaction do
          equipment.lock!
          equipment.update!(active: false)
          sleep 0.2 # hold the lock while the booking thread waits for it
        end
      end
    end

    results = run_concurrently(2) do |index|
      next retire.call if index.zero?

      sleep 0.05 # let the retirement take the lock first
      book_in_thread
    end
    booking = results.last

    assert_equal [{ field: "equipmentId", message: "This equipment has been retired" }], booking.errors
    assert_equal 0, as_member(@member) { Reservation.count }
  end
end
