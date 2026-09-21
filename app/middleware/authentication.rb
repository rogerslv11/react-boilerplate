# frozen_string_literal: true

require 'json'

require_relative '../../lib/core/errors/authentication_error'
require_relative '../../lib/core/errors/authorization_error'
require_relative '../../lib/core/utils/jwt_encoder'

module SinatraBoilerplate
  module Middleware
    # Authentication middleware parses the Authorization header, verifies the
    # JWT and stores the decoded claims in env['current_user']. Routes can be
    # protected with the `requires_authentication!` and `requires_role!` helpers
    # defined in routes.rb of each module.
    class Authentication
      PROTECTED_PREFIXES = ['/api/v1'].freeze

      def initialize(app)
        @app = app
      end

      def call(env)
        env['current_user'] = nil
        env['current_token'] = nil

        if protected_path?(env['PATH_INFO']) && bearer_token?(env)
          begin
            token = extract_bearer_token(env)
            payload = Utils::JwtEncoder.decode(token)
            env['current_token'] = payload
            env['current_user'] = build_user_context(payload)
          rescue Errors::AuthenticationError
            # Do not raise here. Routes opt-in to authentication via
            # `requires_authentication!`. We simply leave current_user = nil
            # so unauthorized requests are rejected at the route level.
            env['current_user'] = nil
            env['current_token'] = nil
          end
        end

        @app.call(env)
      end

      private

      def protected_path?(path)
        return false if path.nil?

        PROTECTED_PREFIXES.any? { |prefix| path.start_with?(prefix) }
      end

      def bearer_token?(env)
        !extract_bearer_token(env).nil?
      end

      def extract_bearer_token(env)
        header = env['HTTP_AUTHORIZATION']
        return nil if header.nil? || header.empty?

        match = header.match(/\ABearer\s+(.+)\z/i)
        match ? match[1].strip : nil
      end

      def build_user_context(payload)
        {
          id: payload['sub'],
          email: payload['email'],
          role: payload['role'] || 'user',
          jti: payload['jti']
        }
      end
    end
  end
end
