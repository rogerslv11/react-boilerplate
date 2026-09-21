# frozen_string_literal: true

require_relative 'application_error'

module SinatraBoilerplate
  module Errors
    class AuthenticationError < ApplicationError
      def initialize(message = 'Authentication required', code = 'AUTHENTICATION_FAILED')
        super(message, 401, code, {})
      end
    end
  end
end
