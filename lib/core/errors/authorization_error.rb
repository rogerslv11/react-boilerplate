# frozen_string_literal: true

require_relative 'application_error'

module SinatraBoilerplate
  module Errors
    class AuthorizationError < ApplicationError
      def initialize(message = 'You are not authorized to perform this action', code = 'FORBIDDEN')
        super(message, 403, code, {})
      end
    end
  end
end
