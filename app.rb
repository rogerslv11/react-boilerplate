# frozen_string_literal: true

require 'sinatra/base'
require 'json'
require 'rack'
require 'rack/attack'
require 'rack/cors'
require 'rack/protection'

require_relative 'config/application'
require_relative 'config/environment'
require_relative 'config/database'

# Middleware classes (loaded eagerly so they are available to the Application class)
require_relative 'app/middleware/request_id'
require_relative 'app/middleware/access_log'
require_relative 'app/middleware/authentication'

module SinatraBoilerplate
  # --------------------------------------------------------------------------
  # Main application class.
  # Routes are registered via `register` calls in config/routes.rb.
  # Middleware is mounted inline below.
  # --------------------------------------------------------------------------
  class Application < Sinatra::Base
    # Sinatra settings
    set :show_exceptions, false
    set :raise_errors, false
    set :dump_errors, false
    set :logging, false
    set :default_content_type, 'application/json'
    set :static, false
    set :views, nil

    # ----------------------------------------------------------------------
    # Middleware stack
    # ----------------------------------------------------------------------
    use SinatraBoilerplate::Middleware::RequestId
    use SinatraBoilerplate::Middleware::AccessLog
    use Rack::Attack
    use Rack::Cors do
      allow do
        origins ENV.fetch('CORS_ALLOWED_ORIGINS', '*').split(',').map(&:strip)
        resource '*',
                 headers: ENV.fetch('CORS_ALLOWED_HEADERS', 'Content-Type,Authorization').split(',').map(&:strip),
                 methods: ENV.fetch('CORS_ALLOWED_METHODS',
                                    'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD').split(',').map(&:strip),
                 expose: %w[X-Request-Id],
                 max_age: ENV.fetch('CORS_MAX_AGE', '86400').to_i
      end
    end
    use Rack::Protection, except: %w[HttpOrigin]
    use SinatraBoilerplate::Middleware::Authentication

    # ----------------------------------------------------------------------
    # Class-level API for module registration (avoids loading cycles).
    # ----------------------------------------------------------------------
    class << self
      def registered_modules
        @registered_modules ||= []
      end

      def register_module(mod)
        return if registered_modules.include?(mod)

        registered_modules << mod
        mod.registered(self) if mod.respond_to?(:registered)
      end
    end

    # ----------------------------------------------------------------------
    # Helpers: authentication, request parsing and authorization gates
    # exposed to every route block.
    # ----------------------------------------------------------------------
    helpers do
      def current_user
        env['current_user']
      end

      def current_token
        env['current_token']
      end

      def request_id
        env['request.id']
      end

      def requires_authentication!
        raise SinatraBoilerplate::Errors::AuthenticationError unless current_user

        current_user
      end

      def requires_admin!
        requires_authentication!
        return if current_user[:role] == 'admin'

        raise SinatraBoilerplate::Errors::AuthorizationError
      end

      def parse_json_body(request)
        return {} if request.body.nil?

        raw = request.body.read
        request.body.rewind if request.body.respond_to?(:rewind)
        return {} if raw.empty?

        JSON.parse(raw)
      rescue JSON::ParserError
        raise SinatraBoilerplate::Errors::ValidationError, 'Body must be valid JSON'
      end

      def ip_for_log
        env['HTTP_X_FORWARDED_FOR'] || env['REMOTE_ADDR']
      end
    end

    # Always reply with JSON
    before do
      content_type :json
    end

    # Apply common request-id response header
    after do
      response.headers['X-Request-Id'] = env['request.id'] if env['request.id']
    end

    # Root route - simple welcome
    get '/' do
      SinatraBoilerplate::Responses::Builder.success(
        data: {
          name: ENV.fetch('APP_NAME', 'sinatra_boilerplate'),
          version: ENV.fetch('APP_VERSION', '1.0.0'),
          environment: SinatraBoilerplate::Env.env,
          docs: '/docs',
          api: '/api/v1'
        }
      )
    end

    # 404 fallback
    not_found do
      SinatraBoilerplate::Responses::Builder.error(
        status: 404,
        code: 'NOT_FOUND',
        message: 'Route not found'
      )
    end

    # Centralized error handlers
    error SinatraBoilerplate::Errors::ApplicationError do
      err = env['sinatra.error']
      SinatraBoilerplate::Responses::Builder.error(
        status: err.status,
        code: err.code,
        message: err.message,
        details: err.details,
        request_id: env['request.id']
      )
    end

    error JSON::ParserError do
      SinatraBoilerplate::Responses::Builder.error(
        status: 400,
        code: 'INVALID_JSON',
        message: 'Request body is not valid JSON'
      )
    end

    error StandardError do
      err = env['sinatra.error']
      SinatraBoilerplate::Log.logger.error(
        "unhandled_exception class=#{err.class.name} message=#{err.message}\n" \
        "#{Array(err.backtrace).first(5).join("\n")}"
      )
      SinatraBoilerplate::Responses::Builder.error(
        status: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: SinatraBoilerplate::Env.production? ? 'Internal server error' : err.message,
        request_id: env['request.id']
      )
    end
  end
end

# Load routes and modules last so everything else is wired up
require_relative 'config/routes'
