# frozen_string_literal: true

require 'jwt'
require_relative '../errors/authentication_error'

module SinatraBoilerplate
  module Utils
    # Encodes and decodes JWT tokens. Centralizing JWT logic here keeps
    # algorithms, issuers, audiences and TTLs consistent.
    class JwtEncoder
      ALGORITHM = ENV.fetch('JWT_ALGORITHM', 'HS256').freeze

      class << self
        def encode(payload, ttl: ENV.fetch('JWT_ACCESS_TTL', '3600').to_i)
          now = Time.now.to_i
          full_payload = payload.merge(
            iat: now,
            exp: now + ttl,
            jti: SecureRandom.uuid,
            iss: ENV.fetch('JWT_ISSUER', 'sinatra_boilerplate'),
            aud: ENV.fetch('JWT_AUDIENCE', 'sinatra_boilerplate_api')
          )
          JWT.encode(full_payload, secret, ALGORITHM)
        end

        def decode(token, verify_aud: true)
          options = {
            algorithm: ALGORITHM,
            verify_iss: true,
            iss: ENV.fetch('JWT_ISSUER', 'sinatra_boilerplate'),
            verify_iat: true
          }
          options[:aud] = ENV.fetch('JWT_AUDIENCE', 'sinatra_boilerplate_api') if verify_aud
          options[:verify_aud] = verify_aud

          decoded_token, _header = JWT.decode(token, secret, true, options)
          decoded_token
        rescue JWT::ExpiredSignature
          raise SinatraBoilerplate::Errors::AuthenticationError, 'Token expired', code: 'TOKEN_EXPIRED'
        rescue JWT::DecodeError, JWT::InvalidIssuerError, JWT::InvalidAudError => e
          raise SinatraBoilerplate::Errors::AuthenticationError, "Invalid token: #{e.message}"
        end

        private

        def secret
          ENV.fetch('JWT_SECRET') do
            raise 'JWT_SECRET is not set. Configure it in .env before running the app.'
          end
        end
      end
    end
  end
end
