# frozen_string_literal: true

require 'securerandom'

module SinatraBoilerplate
  module Utils
    # Generates and validates UUIDs (v4) without leaking them to logs.
    class RequestId
      HEADER = 'HTTP_X_REQUEST_ID'
      RESPONSE_HEADER = 'X-Request-Id'

      class << self
        def generate
          SecureRandom.uuid
        end

        def extract(env)
          raw = env[HEADER]
          return generate if raw.nil? || raw.empty?

          sanitize(raw)
        end

        def sanitize(value)
          value.to_s.gsub(/[^A-Za-z0-9\-_.]/, '').slice(0, 128)
        end
      end
    end
  end
end
