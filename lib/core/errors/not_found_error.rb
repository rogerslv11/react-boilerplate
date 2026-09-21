# frozen_string_literal: true

require_relative 'application_error'

module SinatraBoilerplate
  module Errors
    class NotFoundError < ApplicationError
      def initialize(message = 'Resource not found', resource = nil)
        details = resource ? { resource: resource } : {}
        super(message, 404, 'NOT_FOUND', details)
      end
    end
  end
end
