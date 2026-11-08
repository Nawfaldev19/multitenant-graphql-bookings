require "test_helper"

class BookingRulesTest < ActiveSupport::TestCase
  def violations(starts_at, ends_at)
    BookingRules.new(starts_at: starts_at, ends_at: ends_at, now: NOW).violations
  end

  test "accepts an aligned future slot" do
    assert_empty violations(NOW + 1.hour, NOW + 2.hours)
  end

  test "accepts exactly the maximum duration" do
    assert_empty violations(NOW + 1.hour, NOW + 5.hours)
  end

  test "rejects end before or equal to start and stops there" do
    assert_equal [{ field: "endsAt", message: "End time must be after the start time" }], violations(NOW + 2.hours, NOW + 2.hours)
    assert_equal 1, violations(NOW + 2.hours, NOW + 1.hour).size
  end

  test "rejects a start in the past" do
    assert_includes violations(NOW - 15.minutes, NOW + 1.hour).pluck(:message), "Start time is in the past"
  end

  test "accepts a start exactly at now" do
    assert_empty violations(NOW, NOW + 30.minutes)
  end

  test "rejects times off the 15 minute grid, naming each field" do
    result = violations(NOW + 1.hour + 7.minutes, NOW + 2.hours + 1.minute)

    assert_equal %w[startsAt endsAt], result.pluck(:field)
  end

  test "rejects reservations longer than four hours" do
    assert_equal ["Reservations can be at most 4 hours long"], violations(NOW + 1.hour, NOW + 5.hours + 15.minutes).pluck(:message)
  end
end
