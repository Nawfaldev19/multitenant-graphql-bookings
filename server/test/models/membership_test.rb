require "test_helper"

class MembershipTest < ActiveSupport::TestCase
  test "manager? is true for owners and staff only" do
    organization = create_organization

    assert_predicate add_member(organization, role: "owner"), :manager?
    assert_predicate add_member(organization, role: "staff"), :manager?
    assert_not add_member(organization, role: "member").manager?
  end

  test "a user can join an organization only once" do
    organization = create_organization
    user = create_user
    add_member(organization, user)

    duplicate = Membership.new(organization: organization, user: user, role: "member")

    assert_not duplicate.valid?
  end

  test "rejects unknown roles" do
    membership = Membership.new(organization: create_organization, user: create_user, role: "admin")

    assert_not membership.valid?
    assert_includes membership.errors[:role], "is not included in the list"
  end
end
