require "test_helper"

class RequestHandlingTest < ActionDispatch::IntegrationTest
  include GraphqlHelpers

  test "status endpoint responds" do
    get "/up"

    assert_response :ok
    assert_equal({ "status" => "ok" }, response.parsed_body)
  end

  test "variables may arrive as a JSON string" do
    post "/graphql", params: { query: "query($s: String) { equipment(search: $s) { nodes { id } } }", variables: '{"s":"saw"}' }

    assert_response :ok
    # The variable was parsed and used: the request reached the resolver, which demands sign-in.
    assert_equal ["UNAUTHENTICATED"], error_codes(response.parsed_body)
  end

  test "malformed variables JSON is a 400 with a coded error" do
    post "/graphql", params: { query: "{ viewer { id } }", variables: "{not json" }

    assert_response :bad_request
    assert_equal "BAD_REQUEST", response.parsed_body["errors"].first.dig("extensions", "code")
  end

  test "variables of the wrong type are a 400" do
    post "/graphql", params: { query: "{ viewer { id } }", variables: %w[a b] }.to_json, headers: { "Content-Type" => "application/json" }

    assert_response :bad_request
  end

  test "a resolver that forgets its tenant guard fails closed with a coded error" do
    leaky_query = Class.new(Types::BaseObject) do
      graphql_name "LeakyQuery"
      field :equipment_count, Integer, null: false
      def equipment_count = Equipment.count
    end
    leaky_schema = Class.new(EquipmentBookingsSchema) { query leaky_query }

    result = leaky_schema.execute("{ equipmentCount }").to_h

    assert_nil result["data"]
    assert_equal ["TENANT_REQUIRED"], error_codes(result)
  end
end
