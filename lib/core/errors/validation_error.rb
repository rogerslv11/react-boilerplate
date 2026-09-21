# frozen_string_literal: true

require_relative 'application_error'

module SinatraBoilerplate
  module Errors
    class ValidationError < ApplicationError
      def initialize(message = 'Validation failed', details = {})
        super(message, 422, 'VALIDATION_ERROR', details)
      end
    end
  end
end
