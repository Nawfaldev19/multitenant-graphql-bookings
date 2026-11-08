require "test_helper"

class ReservationTest < ActiveSupport::TestCase
  setup do
    @member = add_member(create_organization)
    @item = create_equipment(@member)
    @existing = create_reservation(@member, @item, starts_at: NOW + 2.hours, ends_at: NOW + 3.hours)
  end

  def overlaps?(starts_at, ends_at)
    as_member(@member) { Reservation.overlapping(starts_at, ends_at).exists? }
  end

  test "overlapping uses half-open intervals" do
    assert overlaps?(NOW + 2.hours + 30.minutes, NOW + 4.hours), "partial overlap at the end"
    assert overlaps?(NOW + 1.hour, NOW + 2.hours + 15.minutes), "partial overlap at the start"
    assert overlaps?(NOW + 1.hour, NOW + 5.hours), "fully containing"
    assert overlaps?(NOW + 2.hours + 15.minutes, NOW + 2.hours + 30.minutes), "fully contained"
    assert_not overlaps?(NOW + 3.hours, NOW + 4.hours), "starts when the other ends"
    assert_not overlaps?(NOW + 1.hour, NOW + 2.hours), "ends when the other starts"
  end

  test "the database rejects an end time before the start time" do
    as_member(@member) do
      assert_raises(ActiveRecord::StatementInvalid) do
        Reservation.insert_all!([{ organization_id: @member.organization_id, equipment_id: @item.id, user_id: @member.user_id,
                                   starts_at: NOW + 3.hours, ends_at: NOW + 2.hours, status: "confirmed", note: "" }])
      end
    end
  end

  test "rejects an unknown status" do
    as_member(@member) do
      @existing.status = "pending"

      assert_not @existing.valid?
    end
  end

  test "equipment with reservations cannot be deleted" do
    as_member(@member) do
      assert_not @item.destroy
      assert_includes @item.errors.full_messages.first, "Cannot delete record because dependent reservations exist"
    end
  end
end
