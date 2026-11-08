require "test_helper"

class AuditEventTest < ActiveSupport::TestCase
  test "audit events are append-only once saved" do
    member = add_member(create_organization, role: "owner")
    event = as_member(member) { AuditLog.record!(action: "test.event", subject: member.organization) }

    as_member(member) do
      assert_raises(ActiveRecord::ReadOnlyRecord) { event.update!(action: "edited") }
    end
  end
end
