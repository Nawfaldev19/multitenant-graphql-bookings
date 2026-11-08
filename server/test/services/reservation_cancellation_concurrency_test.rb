require "test_helper"
require_relative "../support/race_helpers"

# Two people (the member and a staff member) cancel the same booking at once.
# On PostgreSQL this fails if `lock!` is removed from ReservationCancellation:
# both would see a confirmed booking and both would write an audit event.
class ReservationCancellationConcurrencyTest < ActiveSupport::TestCase
  include RaceHelpers

  self.use_transactional_tests = false

  setup do
    organization = create_organization
    @member = add_member(organization)
    @staff = add_member(organization, role: "staff")
    item = create_equipment(@staff)
    @reservation = create_reservation(@member, item, starts_at: 1.day.from_now.utc.beginning_of_hour)
  end

  teardown { delete_all_records }

  test "only one of two simultaneous cancellations succeeds and one audit event is written" do
    results = with_widened_race_window(ReservationCancellation, :state_problem) do
      run_concurrently(2) do |index|
        membership = reload_membership(index.zero? ? @member : @staff)
        as_member(membership) do
          ReservationCancellation.call(reservation: Reservation.find(@reservation.id), membership: membership)
        end
      end
    end

    refused = results.reject(&:success?).map { |result| result.errors.pluck(:message) }

    assert_equal 1, results.count(&:success?)
    assert_equal [["This reservation is already cancelled"]], refused
    assert_predicate as_member(@member) { @reservation.reload }, :cancelled?
    assert_equal 1, as_member(@member) { AuditEvent.where(action: "reservation.cancelled").count }
  end
end
