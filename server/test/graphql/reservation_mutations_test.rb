require "test_helper"

class ReservationMutationsTest < ActionDispatch::IntegrationTest
  include GraphqlHelpers

  CREATE = <<~GQL.freeze
    mutation($equipmentId: ID!, $startsAt: ISO8601DateTime!, $endsAt: ISO8601DateTime!, $note: String) {
      createReservation(equipmentId: $equipmentId, startsAt: $startsAt, endsAt: $endsAt, note: $note) {
        reservation { id status note isMine canCancel equipment { name } }
        errors { field message }
      }
    }
  GQL

  CANCEL = <<~GQL.freeze
    mutation($id: ID!) { cancelReservation(id: $id) { reservation { status canCancel } errors { message } } }
  GQL

  setup do
    travel_to NOW
    @member = add_member(create_organization)
    @peer = add_member(@member.organization)
    @staff = add_member(@member.organization, role: "staff")
    @item = create_equipment(@staff, name: "Kiln")
  end

  def create_as(membership, starts_at:, ends_at:, note: nil)
    graphql(CREATE, variables: { equipmentId: @item.id, startsAt: starts_at.iso8601, endsAt: ends_at.iso8601, note: note },
                    as: membership.user, organization: membership.organization)["data"]["createReservation"]
  end

  test "creates a reservation" do
    payload = create_as(@member, starts_at: NOW + 1.hour, ends_at: NOW + 2.hours, note: "Glaze firing")

    assert_empty payload["errors"]
    assert_equal({ "status" => "CONFIRMED", "note" => "Glaze firing", "isMine" => true, "canCancel" => true, "equipment" => { "name" => "Kiln" } },
                 payload["reservation"].except("id"))
  end

  test "reports conflicts as field errors, not exceptions" do
    create_as(@member, starts_at: NOW + 1.hour, ends_at: NOW + 2.hours)

    payload = create_as(@peer, starts_at: NOW + 90.minutes, ends_at: NOW + 3.hours)

    assert_nil payload["reservation"]
    assert_equal [{ "field" => "startsAt", "message" => "This time overlaps an existing reservation" }], payload["errors"]
  end

  test "rejects malformed timestamps at the schema layer" do
    body = graphql(CREATE, variables: { equipmentId: @item.id, startsAt: "tomorrow", endsAt: "later" },
                           as: @member.user, organization: @member.organization)

    assert_match(/Variable \$startsAt of type ISO8601DateTime! was provided invalid value/, body["errors"].first["message"])
  end

  test "owner can cancel; peer cannot; staff can" do
    id = create_as(@member, starts_at: NOW + 1.hour, ends_at: NOW + 2.hours)["reservation"]["id"]

    peer = graphql(CANCEL, variables: { id: id }, as: @peer.user, organization: @peer.organization)["data"]["cancelReservation"]

    assert_equal ["You can only cancel your own reservations"], peer["errors"].pluck("message")

    staff = graphql(CANCEL, variables: { id: id }, as: @staff.user, organization: @staff.organization)["data"]["cancelReservation"]

    assert_equal({ "status" => "CANCELLED", "canCancel" => false }, staff["reservation"])
  end

  test "my reservations hides past and cancelled-by-time entries unless asked" do
    create_reservation(@member, @item, starts_at: NOW + 1.hour)
    travel 3.hours
    create_reservation(@member, @item, starts_at: Time.current.utc.beginning_of_hour + 2.hours)
    create_reservation(@peer, @item, starts_at: Time.current.utc.beginning_of_hour + 5.hours)

    upcoming = graphql("{ myReservations { nodes { id } } }", as: @member.user, organization: @member.organization)
    everything = graphql("{ myReservations(includePast: true) { nodes { id } } }", as: @member.user, organization: @member.organization)

    assert_equal 1, upcoming["data"]["myReservations"]["nodes"].size
    assert_equal 2, everything["data"]["myReservations"]["nodes"].size
  end

  test "a full page of reservations with every field the client shows fits the complexity budget" do
    query = "{ myReservations(includePast: true, first: 50) { nodes { id startsAt endsAt note status canCancel cancelledAt isMine " \
            "equipment { id name category location } member { id name email } } pageInfo { hasNextPage endCursor } } }"

    body = graphql(query, as: @member.user, organization: @member.organization)

    assert_nil body["errors"]
  end

  test "listing reservations does not issue a query per row (dataloader)" do
    other_items = Array.new(5) { create_equipment(@staff) }
    other_items.each_with_index { |item, index| create_reservation(@member, item, starts_at: NOW + (index + 1).hours) }
    query = "{ myReservations { nodes { equipment { name } member { name } } } }"

    count = count_queries { graphql(query, as: @member.user, organization: @member.organization) }

    # session lookup + membership + organization + reservations page + count-free pagination + one equipment batch + one user batch
    assert_operator count, :<=, 8, "expected a constant number of queries, got #{count}"
  end

  private

  def count_queries(&)
    count = 0
    counter = ->(*, payload) { count += 1 unless payload[:name] == "SCHEMA" || payload[:sql].start_with?("PRAGMA") }
    ActiveSupport::Notifications.subscribed(counter, "sql.active_record", &)
    count
  end
end
