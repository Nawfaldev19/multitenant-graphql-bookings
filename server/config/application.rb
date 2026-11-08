require_relative "boot"

require "rails"
require "active_model/railtie"
require "active_record/railtie"
require "action_controller/railtie"
require "rails/test_unit/railtie"

Bundler.require(*Rails.groups)

require_relative "../lib/json_log_formatter"

module EquipmentBookings
  class Application < Rails::Application
    config.load_defaults 8.0
    config.api_only = true
    config.autoload_lib(ignore: %w[tasks json_log_formatter.rb])
    config.time_zone = "UTC"

    # Structured JSON logs. The formatter reads the request id from Current.
    config.logger = ActiveSupport::Logger.new($stdout).tap { |logger| logger.formatter = JsonLogFormatter.new }
    config.log_level = ENV.fetch("LOG_LEVEL", "info")
    config.colorize_logging = false

    # The API only ever returns JSON to fetch calls, so the strictest policy fits:
    # nothing may be loaded, framed, or sniffed as another content type, and no
    # referrer leaves with outgoing navigations.
    config.action_dispatch.default_headers = {
      "Content-Security-Policy" => "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
      "X-Content-Type-Options" => "nosniff",
      "X-Frame-Options" => "DENY",
      "Referrer-Policy" => "no-referrer"
    }

    config.cors_allowed_origins = ENV.fetch("CORS_ALLOWED_ORIGINS", "http://localhost:5173").split(",")
  end
end
