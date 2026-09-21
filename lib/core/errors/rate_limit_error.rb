# frozen_string_literal: true

require_relative 'application_error'

module SinatraBoilerplate
  module Errors
    class RateLimitError < ApplicationError
      def initialize(message = 'Too many requests')
        super(message, 429, 'RATE_LIMITED', {})
      end
    end
  end
end
