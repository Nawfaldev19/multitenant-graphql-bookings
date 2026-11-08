require "test_helper"

class AuthenticationTest < ActionDispatch::IntegrationTest
  include GraphqlHelpers

  SIGN_IN = <<~GQL.freeze
    mutation($email: String!, $password: String!) {
      signIn(email: $email, password: $password) { token viewer { email } errors { field message } }
    }
  GQL

  VIEWER = "{ viewer { name memberships { role organization { name } } } }".freeze

  setup do
    SignInThrottle.reset!
    @user = create_user(name: "Rosa Quill")
    add_member(create_organization(name: "Quill Hall"), @user, role: "staff")
  end

  test "signs in with a normalized email and the token works" do
    payload = graphql(SIGN_IN, variables: { email: "  #{@user.email.upcase}", password: TestData::PASSWORD })["data"]["signIn"]

    assert_empty payload["errors"]
    viewer = graphql(VIEWER, token: payload["token"])["data"]["viewer"]

    assert_equal "Rosa Quill", viewer["name"]
    assert_equal [{ "role" => "STAFF", "organization" => { "name" => "Quill Hall" } }], viewer["memberships"]
  end

  test "wrong password and unknown email give the same generic error" do
    wrong = graphql(SIGN_IN, variables: { email: @user.email, password: "incorrect-password" })["data"]["signIn"]
    unknown = graphql(SIGN_IN, variables: { email: "nobody@example.com", password: "incorrect-password" })["data"]["signIn"]

    assert_nil wrong["token"]
    assert_equal wrong["errors"], unknown["errors"]
    assert_equal "Email or password is incorrect", wrong["errors"].first["message"]
  end

  def sign_in(email, password, ip: "203.0.113.7")
    post "/graphql", params: { query: SIGN_IN, variables: { email: email, password: password } }.to_json,
                     headers: { "Content-Type" => "application/json", "REMOTE_ADDR" => ip }
    response.parsed_body["data"]["signIn"]
  end

  test "repeated wrong passwords for one email lock it out, even with the right password" do
    SignInThrottle::MAX_FAILURES_PER_EMAIL.times { sign_in(@user.email, "incorrect-password") }

    blocked = sign_in(@user.email, TestData::PASSWORD)

    assert_nil blocked["token"]
    assert_equal [Mutations::SignIn::THROTTLED], blocked["errors"].pluck("message")
    # Another address from the same client is unaffected.
    other = create_user

    assert_empty sign_in(other.email, TestData::PASSWORD)["errors"]
  end

  test "one client guessing across many emails is stopped by the per-IP limit" do
    SignInThrottle::MAX_FAILURES_PER_IP.times { |n| sign_in("guess-#{n}@example.com", "incorrect-password") }

    assert_equal [Mutations::SignIn::THROTTLED], sign_in(@user.email, TestData::PASSWORD)["errors"].pluck("message")
    assert_empty sign_in(@user.email, TestData::PASSWORD, ip: "198.51.100.4")["errors"]
  end

  test "the lockout lifts once the window passes, and successful sign-ins never count" do
    3.times { assert_empty sign_in(@user.email, TestData::PASSWORD)["errors"] }
    SignInThrottle::MAX_FAILURES_PER_EMAIL.times { sign_in(@user.email, "incorrect-password") }

    travel SignInThrottle::WINDOW + 1.second do
      assert_empty sign_in(@user.email, TestData::PASSWORD)["errors"]
    end
  end

  test "viewer is null when signed out, and tenant fields demand sign-in" do
    assert_nil graphql(VIEWER)["data"]["viewer"]
    assert_equal ["UNAUTHENTICATED"], error_codes(graphql("{ currentOrganization { name } }"))
  end

  test "an expired token is treated as signed out" do
    token = AuthToken.issue(@user)

    travel AuthToken::LIFETIME + 1.minute do
      assert_equal ["UNAUTHENTICATED"], error_codes(graphql("{ equipment { nodes { id } } }", token: token))
    end
  end

  test "a malformed authorization header is ignored" do
    post "/graphql", params: { query: VIEWER }.to_json,
                     headers: { "Content-Type" => "application/json", "Authorization" => "Token abc" }

    assert_nil response.parsed_body["data"]["viewer"]
  end
end
