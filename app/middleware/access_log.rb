# frozen_string_literal: true

require_relative '../../lib/core/utils/logger'

module SinatraBoilerplate
  module Middleware
    # AccessLog records structured access logs without printing to stdout by
    # default. It relies on the request id assigned by RequestId middleware.
    class AccessLog
      def initialize(app)
        @app = app
      end

      def call(env)
        started_at = Time.now
        status, headers, body = @app.call(env)
        elapsed = ((Time.now - started_at) * 1000).round(2)

        Utils::Logger.info(
          'request',
          method: env['REQUEST_METHOD'],
          path: env['PATH_INFO'],
          status: status,
          duration_ms: elapsed,
          request_id: env['request.id'],
          ip: env['HTTP_X_FORWARDED_FOR'] || env['REMOTE_ADDR']
        )

        [status, headers, body]
      rescue StandardError => e
        elapsed = ((Time.now - started_at) * 1000).round(2)
        Utils::Logger.error(
          'request_failed',
          method: env['REQUEST_METHOD'],
          path: env['PATH_INFO'],
          duration_ms: elapsed,
          request_id: env['request.id'],
          error_class: e.class.name,
          error_message: e.message
        )
        raise
      end
    end
  end
end
