require "test_helper"

class EquipmentQueriesTest < ActionDispatch::IntegrationTest
  include GraphqlHelpers

  setup do
    travel_to NOW
    @staff = add_member(create_organization, role: "staff")
    @member = add_member(@staff.organization)
    @laser = create_equipment(@staff, name: "Laser cutter", category: "Cutting", description: "Engraves acrylic")
    @lathe = create_equipment(@staff, name: "Wood lathe", category: "Woodworking")
    @retired = create_equipment(@staff, name: "Old drill", category: "Woodworking", active: false)
  end

  def names(query, membership: @member, variables: {})
    body = graphql(query, variables: variables, as: membership.user, organization: membership.organization)
    body["data"]["equipment"]["nodes"].pluck("name")
  end

  test "lists active equipment alphabetically" do
    assert_equal ["Laser cutter", "Wood lathe"], names("{ equipment { nodes { name } } }")
  end

  test "search matches name or description, case-insensitively, and treats wildcards literally" do
    assert_equal ["Laser cutter"], names('{ equipment(search: "ACRYLIC") { nodes { name } } }')
    assert_empty names('{ equipment(search: "%") { nodes { name } } }')
  end

  test "filters by category" do
    assert_equal ["Wood lathe"], names('{ equipment(category: "Woodworking") { nodes { name } } }')
  end

  test "managers can include retired equipment, members cannot" do
    assert_equal ["Laser cutter", "Old drill", "Wood lathe"], names("{ equipment(includeRetired: true) { nodes { name } } }", membership: @staff)

    body = graphql("{ equipment(includeRetired: true) { nodes { name } } }", as: @member.user, organization: @member.organization)

    assert_equal ["FORBIDDEN"], error_codes(body)
  end

  test "cursor pagination walks every item exactly once" do
    query = "query($after: String) { equipment(first: 1, after: $after) { nodes { name } pageInfo { hasNextPage endCursor } } }"
    seen = []
    cursor = nil
    loop do
      page = graphql(query, variables: { after: cursor }, as: @member.user, organization: @member.organization)["data"]["equipment"]
      seen.concat(page["nodes"].pluck("name"))
      break unless page["pageInfo"]["hasNextPage"]

      cursor = page["pageInfo"]["endCursor"]
    end

    assert_equal ["Laser cutter", "Wood lathe"], seen
  end

  test "page size is capped at 50" do
    as_member(@staff) do
      Equipment.insert_all(Array.new(55) do |i|
        { name: "Clamp #{i}", category: "Clamps", organization_id: @staff.organization_id }
      end)
    end

    page = graphql("{ equipment(first: 100) { nodes { name } pageInfo { hasNextPage } } }", as: @member.user, organization: @member.organization)

    assert_equal 50, page["data"]["equipment"]["nodes"].size
    assert page["data"]["equipment"]["pageInfo"]["hasNextPage"]
  end

  test "very large page requests are rejected by the complexity limit" do
    body = graphql("{ equipment(first: 500) { nodes { id name category location description active } } }",
                   as: @member.user, organization: @member.organization)

    assert_match(/exceeds max complexity/, body["errors"].first["message"])
  end

  test "categories list only active equipment" do
    body = graphql("{ equipmentCategories }", as: @member.user, organization: @member.organization)

    assert_equal %w[Cutting Woodworking], body["data"]["equipmentCategories"]
  end

  test "equipment schedule returns confirmed reservations in the window, in order" do
    later = create_reservation(@member, @laser, starts_at: NOW + 4.hours)
    earlier = create_reservation(@staff, @laser, starts_at: NOW + 1.hour)
    create_reservation(@member, @laser, starts_at: NOW + 2.hours, status: "cancelled")
    create_reservation(@member, @laser, starts_at: NOW + 2.days)

    body = graphql(<<~GQL, variables: { id: @laser.id }, as: @member.user, organization: @member.organization)
      query($id: ID!) { equipmentItem(id: $id) { reservations(from: "2031-03-10T00:00:00Z", to: "2031-03-11T00:00:00Z") { id isMine member { name } } } }
    GQL

    reservations = body["data"]["equipmentItem"]["reservations"]

    assert_equal [earlier.id, later.id].map(&:to_s), reservations.pluck("id")
    assert_equal [false, true], reservations.pluck("isMine")
  end

  test "schedule windows must be ordered and at most seven days" do
    query = "query($id: ID!, $from: ISO8601DateTime!, $to: ISO8601DateTime!) { equipmentItem(id: $id) { reservations(from: $from, to: $to) { id } } }"
    backwards = graphql(query, variables: { id: @laser.id, from: "2031-03-11T00:00:00Z", to: "2031-03-10T00:00:00Z" },
                               as: @member.user, organization: @member.organization)
    too_wide = graphql(query, variables: { id: @laser.id, from: "2031-03-01T00:00:00Z", to: "2031-03-20T00:00:00Z" },
                              as: @member.user, organization: @member.organization)

    assert_equal "`to` must be after `from`", backwards["errors"].first["message"]
    assert_equal "The window can be at most 7 days", too_wide["errors"].first["message"]
  end

  test "member emails are visible to managers and to the member, hidden from peers" do
    create_reservation(@staff, @laser, starts_at: NOW + 1.hour)
    query = <<~GQL
      query($id: ID!) { equipmentItem(id: $id) { reservations(from: "2031-03-10T00:00:00Z", to: "2031-03-11T00:00:00Z") { member { email } } } }
    GQL

    as_peer = graphql(query, variables: { id: @laser.id }, as: @member.user, organization: @member.organization)
    as_self = graphql(query, variables: { id: @laser.id }, as: @staff.user, organization: @staff.organization)

    assert_nil as_peer["data"]["equipmentItem"]["reservations"].first["member"]["email"]
    assert_equal @staff.user.email, as_self["data"]["equipmentItem"]["reservations"].first["member"]["email"]
  end

  test "deeply nested queries are rejected by the depth limit" do
    nested = "{ viewer { memberships { organization { id } } } }"
    window = 'reservations(from: "2031-03-10T00:00:00Z", to: "2031-03-11T00:00:00Z")'
    deep = "{ myReservations { nodes #{"{ equipment { #{window} " * 6}{ id }#{' } }' * 6} } }"

    assert_nil graphql(nested, as: @member.user)["errors"]
    assert_match(/exceeds max depth/, graphql(deep, as: @member.user, organization: @member.organization)["errors"].first["message"])
  end
end
