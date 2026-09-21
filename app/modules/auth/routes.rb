# frozen_string_literal: true

require_relative '../../controllers/auth_controller'
require_relative 'contracts/auth_contracts'
require_relative '../../../lib/core/errors/validation_error'
require_relative '../../../lib/core/errors/authentication_error'

module SinatraBoilerplate
  module Modules
    module Auth
      module Routes
        def self.registered(app)
          controller = SinatraBoilerplate::Controllers::AuthController.new

          # POST /api/v1/auth/register
          app.post '/api/v1/auth/register' do
            payload = parse_json_body(request)
            validate_auth_contract!(Contracts::RegisterContract, payload)

            controller.register(
              payload,
              request_meta: { ip_address: ip_for_log, user_agent: request.user_agent }
            )
          end

          # POST /api/v1/auth/login
          app.post '/api/v1/auth/login' do
            payload = parse_json_body(request)
            validate_auth_contract!(Contracts::LoginContract, payload)

            controller.login(
              payload,
              request_meta: { ip_address: ip_for_log, user_agent: request.user_agent }
            )
          end

          # POST /api/v1/auth/refresh
          app.post '/api/v1/auth/refresh' do
            payload = parse_json_body(request)
            validate_auth_contract!(Contracts::RefreshContract, payload)

            controller.refresh(
              payload,
              request_meta: { ip_address: ip_for_log, user_agent: request.user_agent }
            )
          end

          # POST /api/v1/auth/logout
          app.post '/api/v1/auth/logout' do
            payload = parse_json_body(request)
            validate_auth_contract!(Contracts::RefreshContract, payload)

            controller.logout(payload)
          end

          # GET /api/v1/auth/me  (requires authentication)
          app.get '/api/v1/auth/me' do
            requires_authentication!

            controller.me(current_user)
          end

          # POST /api/v1/auth/logout-all  (requires authentication)
          app.post '/api/v1/auth/logout-all' do
            requires_authentication!
            user = SinatraBoilerplate::Modules::Users::Repository.new.find(current_user[:id])
            SinatraBoilerplate::Modules::Auth::Service.new.logout_all(user)
            SinatraBoilerplate::Responses::Builder.success(data: { revoked: true })
          end

          # Local helper accessible inside route blocks
          app.helpers do
            def validate_auth_contract!(contract_class, payload)
              result = contract_class.new.call(payload)
              return if result.success?

              raise SinatraBoilerplate::Errors::ValidationError.new(
                'Validation failed',
                result.errors(full: true).to_h
              )
            end
          end
        end
      end
    end
  end
end
