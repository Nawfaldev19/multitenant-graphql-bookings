require "test_helper"

class SecurityHeadersTest < ActionDispatch::IntegrationTest
  include GraphqlHelpers

  EXPECTED = {
    "Content-Security-Policy" => "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    "X-Content-Type-Options" => "nosniff",
    "X-Frame-Options" => "DENY",
    "Referrer-Policy" => "no-referrer"
  }.freeze

  test "GraphQL responses carry the API security headers" do
    graphql("{ viewer { id } }")

    assert_security_headers
  end

  test "error and status responses carry them too" do
    post "/graphql", params: { query: "{ viewer { id } }", variables: "{not json" }

    assert_response :bad_request
    assert_security_headers

    get "/up"

    assert_security_headers
  end

  private

  def assert_security_headers
    EXPECTED.each { |name, value| assert_equal value, response.headers[name], "#{name} header" }
  end
end
