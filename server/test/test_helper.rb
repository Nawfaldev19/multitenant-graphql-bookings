ENV["RAILS_ENV"] ||= "test"

require "simplecov"
SimpleCov.start "rails" do
  enable_coverage :branch
  skip %w[/vendor/ /test/ /config/ /db/]
  minimum_coverage line: 95, branch: 85
end

require_relative "../config/environment"
require "rails/test_help"
require_relative "support/test_data"
require_relative "support/graphql_helpers"

module ActiveSupport
  class TestCase
    include TestData
    include ActiveSupport::Testing::TimeHelpers

    # A fixed "now": Monday 10 March 2031, 08:00 UTC. Keeps time rules deterministic.
    NOW = Time.utc(2031, 3, 10, 8, 0)
  end
end
