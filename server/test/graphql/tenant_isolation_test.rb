require "test_helper"

# Proves that one organization can never read or change another's data,
# including through direct API calls with guessed ids and forged headers.
class TenantIsolationTest < ActionDispatch::IntegrationTest
  include GraphqlHelpers

  setup do
    travel_to NOW
    @alpha_owner = add_member(create_organization(name: "Alpha"), role: "owner")
    @beta_owner = add_member(create_organization(name: "Beta"), role: "owner")
    @alpha_item = create_equipment(@alpha_owner, name: "Alpha laser")
    @beta_item = create_equipment(@beta_owner, name: "Beta laser")
    @beta_booking = create_reservation(@beta_owner, @beta_item, starts_at: NOW + 1.hour)
    @alpha_user = @alpha_owner.user
    @alpha = @alpha_owner.organization
  end

  test "lists only the current organization's equipment" do
    body = graphql("{ equipment { nodes { name } } }", as: @alpha_user, organization: @alpha)

    assert_equal ["Alpha laser"], body["data"]["equipment"]["nodes"].pluck("name")
  end

  test "reading another organization's equipment by id looks like it does not exist" do
    body = graphql("query($id: ID!) { equipmentItem(id: $id) { name } }", variables: { id: @beta_item.id }, as: @alpha_user, organization: @alpha)

    assert_equal ["NOT_FOUND"], error_codes(body)
    assert_nil body["data"]
  end

  test "a forged organization header grants nothing" do
    body = graphql("{ equipment { nodes { name } } }", as: @alpha_user, organization: @beta_owner.organization)

    assert_equal ["TENANT_REQUIRED"], error_codes(body)
  end

  test "no organization header means no tenant data" do
    assert_equal ["TENANT_REQUIRED"], error_codes(graphql("{ equipmentCategories }", as: @alpha_user))
  end

  test "cannot book another organization's equipment" do
    body = graphql(<<~GQL, variables: { id: @beta_item.id }, as: @alpha_user, organization: @alpha)
      mutation($id: ID!) { createReservation(equipmentId: $id, startsAt: "2031-03-10T10:00:00Z", endsAt: "2031-03-10T11:00:00Z") { reservation { id } } }
    GQL

    assert_equal ["NOT_FOUND"], error_codes(body)
    assert_equal(1, TenantScoped.across_tenants { Reservation.count })
  end

  test "cannot cancel another organization's reservation, even as an owner" do
    body = graphql(<<~GQL, variables: { id: @beta_booking.id }, as: @alpha_user, organization: @alpha)
      mutation($id: ID!) { cancelReservation(id: $id) { reservation { status } } }
    GQL

    assert_equal ["NOT_FOUND"], error_codes(body)
    assert_predicate TenantScoped.across_tenants { @beta_booking.reload }, :confirmed?
  end

  test "cannot retire another organization's equipment" do
    body = graphql("mutation($id: ID!) { retireEquipment(id: $id) { equipment { active } } }",
                   variables: { id: @beta_item.id }, as: @alpha_user, organization: @alpha)

    assert_equal ["NOT_FOUND"], error_codes(body)
    assert(TenantScoped.across_tenants { @beta_item.reload.active })
  end

  test "audit log shows only the current organization's events" do
    as_member(@beta_owner) { AuditLog.record!(action: "beta.secret", subject: @beta_item) }
    as_member(@alpha_owner) { AuditLog.record!(action: "alpha.visible", subject: @alpha_item) }

    body = graphql("{ auditEvents { nodes { action } } }", as: @alpha_user, organization: @alpha)

    assert_equal ["alpha.visible"], body["data"]["auditEvents"]["nodes"].pluck("action")
  end

  test "a user in both organizations sees each one separately" do
    add_member(@beta_owner.organization, @alpha_user)

    alpha_names = graphql("{ equipment { nodes { name } } }", as: @alpha_user, organization: @alpha)
    beta_names = graphql("{ equipment { nodes { name } } }", as: @alpha_user, organization: @beta_owner.organization)

    assert_equal ["Alpha laser"], alpha_names["data"]["equipment"]["nodes"].pluck("name")
    assert_equal ["Beta laser"], beta_names["data"]["equipment"]["nodes"].pluck("name")
  end

  test "removing a membership revokes access on the very next request" do
    token = AuthToken.issue(@alpha_user)
    @alpha_owner.destroy!

    assert_equal ["TENANT_REQUIRED"], error_codes(graphql("{ equipmentCategories }", token: token, organization: @alpha))
  end
end
