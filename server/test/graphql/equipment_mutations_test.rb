require "test_helper"

class EquipmentMutationsTest < ActionDispatch::IntegrationTest
  include GraphqlHelpers

  CREATE = <<~GQL.freeze
    mutation($name: String!, $category: String!) {
      createEquipment(name: $name, category: $category, location: " Bay 3 ") { equipment { name location active } errors { field message } }
    }
  GQL

  setup do
    @staff = add_member(create_organization, role: "staff")
    @member = add_member(@staff.organization)
  end

  test "staff create equipment, inputs are trimmed, and the action is audited" do
    payload = graphql(CREATE, variables: { name: " Bandsaw ", category: "Woodworking" }, as: @staff.user, organization: @staff.organization)

    assert_equal({ "name" => "Bandsaw", "location" => "Bay 3", "active" => true }, payload["data"]["createEquipment"]["equipment"])
    assert_equal ["equipment.created"], as_member(@staff) { AuditEvent.pluck(:action) }
  end

  test "members are forbidden from creating equipment" do
    body = graphql(CREATE, variables: { name: "Bandsaw", category: "Woodworking" }, as: @member.user, organization: @member.organization)

    assert_equal ["FORBIDDEN"], error_codes(body)
    assert_equal 0, as_member(@staff) { Equipment.count }
  end

  test "duplicate names within an organization are validation errors" do
    create_equipment(@staff, name: "Bandsaw")

    payload = graphql(CREATE, variables: { name: "Bandsaw", category: "Woodworking" }, as: @staff.user, organization: @staff.organization)

    assert_equal [{ "field" => "name", "message" => "Name has already been taken" }], payload["data"]["createEquipment"]["errors"]
  end

  test "retiring equipment hides it from members and blocks retiring twice" do
    item = create_equipment(@staff, name: "Bandsaw")
    retire = "mutation($id: ID!) { retireEquipment(id: $id) { equipment { active } errors { message } } }"

    first = graphql(retire, variables: { id: item.id }, as: @staff.user, organization: @staff.organization)["data"]["retireEquipment"]
    second = graphql(retire, variables: { id: item.id }, as: @staff.user, organization: @staff.organization)["data"]["retireEquipment"]

    assert_equal({ "active" => false }, first["equipment"])
    assert_equal ["Already retired"], second["errors"].pluck("message")
    assert_empty graphql("{ equipment { nodes { id } } }", as: @member.user, organization: @member.organization)["data"]["equipment"]["nodes"]
  end

  test "members cannot retire equipment or read the audit log" do
    item = create_equipment(@staff)

    retire = graphql("mutation($id: ID!) { retireEquipment(id: $id) { errors { message } } }", variables: { id: item.id },
                                                                                               as: @member.user, organization: @member.organization)
    audit = graphql("{ auditEvents { nodes { id } } }", as: @member.user, organization: @member.organization)

    assert_equal ["FORBIDDEN"], error_codes(retire)
    assert_equal ["FORBIDDEN"], error_codes(audit)
  end
end
