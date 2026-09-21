# frozen_string_literal: true

require 'dotenv'

env = ENV.fetch('APP_ENV', 'development')
Dotenv.load(".env.#{env}.local", ".env.#{env}", '.env') if %w[development test].include?(env)

ENV['APP_ENV'] ||= 'development'

require_relative 'environment'
require_relative 'database'

# Application configuration
module SinatraBoilerplate
  class << self
    def app_name
      ENV.fetch('APP_NAME', 'sinatra_boilerplate')
    end

    def app_version
      ENV.fetch('APP_VERSION', '1.0.0')
    end

    def host
      ENV.fetch('APP_HOST', '0.0.0.0')
    end

    def port
      ENV.fetch('APP_PORT', '4567').to_i
    end
  end
end

# Initializers (rack-attack rules, etc.)
require_relative 'initializers/rate_limiting'
