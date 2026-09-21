# frozen_string_literal: true

require_relative 'application_error'

module SinatraBoilerplate
  module Errors
    class ConflictError < ApplicationError
      def initialize(message = 'Conflict', details = {})
        super(message, 409, 'CONFLICT', details)
      end
    end
  end
end
