# frozen_string_literal: true

module SinatraBoilerplate
  module Errors
    # Base class for all domain-level exceptions. These are caught by the
    # centralized error handler in app.rb and converted to JSON responses.
    class ApplicationError < StandardError
      attr_reader :status, :code, :details

      def initialize(message = nil, status = 500, code = 'INTERNAL_SERVER_ERROR', details = {})
        super(message)
        @status = status
        @code = code
        @details = details
      end
    end
  end
end
