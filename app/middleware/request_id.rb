# frozen_string_literal: true

require_relative '../../lib/core/utils/request_id'

module SinatraBoilerplate
  module Middleware
    # RequestId middleware extracts X-Request-Id from incoming headers or
    # generates a new UUID. The id is exposed in env['request.id'] and in the
    # X-Request-Id response header.
    class RequestId
      def initialize(app)
        @app = app
      end

      def call(env)
        env['request.id'] = Utils::RequestId.extract(env)
        status, headers, body = @app.call(env)
        headers[Utils::RequestId::RESPONSE_HEADER] = env['request.id']
        [status, headers, body]
      end
    end
  end
end
