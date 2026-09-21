# frozen_string_literal: true

require 'json'
require 'logger'
require 'time'
require 'securerandom'

# Core autoload setup
module SinatraBoilerplate
  ROOT = File.expand_path('..', __dir__).freeze

  module Env
    module_function

    def fetch(key, default = nil)
      value = ENV[key]
      value.nil? || value.empty? ? default : value
    end

    def fetch!(key)
      ENV.fetch(key)
    end

    def env
      ENV.fetch('APP_ENV', 'development')
    end

    def production?
      env == 'production'
    end

    def development?
      env == 'development'
    end

    def test?
      env == 'test'
    end

    def to_bool(value)
      %w[1 true yes on].include?(value.to_s.downcase)
    end
  end

  module Log
    class << self
      def logger
        @logger ||= build_logger
      end

      def build_logger
        logger = Logger.new($stdout)
        logger.level = Logger.const_get(ENV.fetch('APP_LOG_LEVEL', 'info').upcase)
        logger.formatter = proc do |severity, time, _progname, msg|
          payload = {
            timestamp: time.utc.iso8601(3),
            level: severity,
            message: msg
          }
          "#{payload.to_json}\n"
        end
        logger
      end
    end
  end
end

# Autoload core utilities (errors, responses, pagination)
module SinatraBoilerplate
  module Errors; end
  module Responses; end
  module Pagination; end
  module Utils; end
end

require_relative '../lib/core/errors/application_error'
require_relative '../lib/core/errors/validation_error'
require_relative '../lib/core/errors/authentication_error'
require_relative '../lib/core/errors/authorization_error'
require_relative '../lib/core/errors/not_found_error'
require_relative '../lib/core/errors/conflict_error'
require_relative '../lib/core/errors/rate_limit_error'
require_relative '../lib/core/responses/builder'
require_relative '../lib/core/pagination/paginator'
require_relative '../lib/core/pagination/page'
require_relative '../lib/core/utils/jwt_encoder'
require_relative '../lib/core/utils/password_hasher'
require_relative '../lib/core/utils/request_id'
