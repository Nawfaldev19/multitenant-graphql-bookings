require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "normalizes email before uniqueness checks" do
    User.create!(name: "First", email: "maker@example.com", password: TestData::PASSWORD)
    duplicate = User.new(name: "Second", email: "  MAKER@Example.com ", password: TestData::PASSWORD)

    assert_equal "maker@example.com", duplicate.email
    assert_not duplicate.valid?
  end

  test "requires a password of at least 12 characters" do
    user = User.new(name: "Short", email: "short@example.com", password: "too-short")

    assert_not user.valid?
    assert_includes user.errors[:password], "is too short (minimum is 12 characters)"
  end

  test "rejects malformed emails" do
    assert_not User.new(name: "Bad", email: "not-an-email", password: TestData::PASSWORD).valid?
  end
end
