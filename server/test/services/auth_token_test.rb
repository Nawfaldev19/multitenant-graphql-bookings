require "test_helper"

class AuthTokenTest < ActiveSupport::TestCase
  test "round-trips a user" do
    user = create_user

    assert_equal user, AuthToken.authenticate(AuthToken.issue(user))
  end

  test "rejects blank, malformed, and tampered tokens" do
    token = AuthToken.issue(create_user)

    assert_nil AuthToken.authenticate(nil)
    assert_nil AuthToken.authenticate("")
    assert_nil AuthToken.authenticate("not-a-token")
    assert_nil AuthToken.authenticate("#{token}x")
  end

  test "rejects expired tokens" do
    user = create_user
    token = AuthToken.issue(user)

    travel AuthToken::LIFETIME + 1.second do
      assert_nil AuthToken.authenticate(token)
    end
  end

  test "rejects tokens for users that no longer exist" do
    user = create_user
    token = AuthToken.issue(user)
    user.destroy!

    assert_nil AuthToken.authenticate(token)
  end

  test "rejects a token signed for a different purpose" do
    user = create_user
    other_purpose = AuthToken.verifier.generate(user.id, purpose: :password_reset)

    assert_nil AuthToken.authenticate(other_purpose)
  end
end
