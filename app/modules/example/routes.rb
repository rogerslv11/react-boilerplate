# frozen_string_literal: true

require_relative '../../../lib/core/errors/validation_error'

module SinatraBoilerplate
  module Modules
    module Example
      # The Example module exists to demonstrate the canonical shape of a
      # module: routes, contracts, services and a controller. New features
      # can copy this skeleton to add business logic without coupling to
      # the rest of the application.
      module Routes
        def self.registered(app)
          app.get '/api/v1/example/echo' do
            SinatraBoilerplate::Responses::Builder.success(
              data: { message: params['message'] || 'pong' }
            )
          end

          app.post '/api/v1/example/echo' do
            payload = parse_json_body(request)
            result = Contracts::EchoContract.new.call(payload)
            unless result.success?
              raise SinatraBoilerplate::Errors::ValidationError.new(
                'Validation failed',
                details: result.errors(full: true).to_h
              )
            end

            SinatraBoilerplate::Responses::Builder.success(data: { message: result[:message] })
          end
        end
      end
    end
  end
end

require_relative 'contracts/example_contract'
