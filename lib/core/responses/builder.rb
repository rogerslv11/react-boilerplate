# frozen_string_literal: true

module SinatraBoilerplate
  module Responses
    # Builder centralizes the JSON shape of all responses, ensuring
    # consistency across the API.
    #
    # Success envelope:
    #   {
    #     "data": <payload>,
    #     "meta": { "request_id": "...", "timestamp": "..." }
    #   }
    #
    # Error envelope:
    #   {
    #     "error": {
    #       "code": "VALIDATION_ERROR",
    #       "message": "...",
    #       "details": {...},
    #       "request_id": "..."
    #     }
    #   }
    module Builder
      module_function

      def success(data: nil, status: 200, meta: {})
        body = { data: data }
        body[:meta] = default_meta.merge(meta) unless default_meta.empty? && meta.empty?
        [status, body.to_json]
      end

      def created(data: nil)
        success(data: data, status: 201)
      end

      def no_content
        [204, '']
      end

      def error(status:, code:, message:, details: nil, request_id: nil)
        payload = {
          error: {
            code: code,
            message: message,
            request_id: request_id
          }
        }
        payload[:error][:details] = details unless details.nil? || details.empty?
        [status, payload.to_json]
      end

      def default_meta
        {}
      end
    end
  end
end
