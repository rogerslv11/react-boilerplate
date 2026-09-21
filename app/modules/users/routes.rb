# frozen_string_literal: true

require_relative '../../controllers/users_controller'
require_relative 'contracts/user_contracts'
require_relative '../../../lib/core/errors/validation_error'

module SinatraBoilerplate
  module Modules
    module Users
      module Routes
        module_function

        def registered(app)
          controller = SinatraBoilerplate::Controllers::UsersController.new

          # GET /api/v1/users
          app.get '/api/v1/users' do
            requires_authentication!
            requires_admin!
            controller.index(params, current_user: current_user)
          end

          # GET /api/v1/users/:id
          app.get '/api/v1/users/:id' do |id|
            requires_authentication!
            controller.show(id, current_user: current_user)
          end

          # POST /api/v1/users
          app.post '/api/v1/users' do
            requires_authentication!
            requires_admin!
            controller.create(parse_json_body(request), current_user: current_user)
          end

          # PATCH /api/v1/users/:id
          app.patch '/api/v1/users/:id' do |id|
            requires_authentication!
            controller.update(id, parse_json_body(request), current_user: current_user)
          end

          # PUT alias for PATCH (idempotent semantic)
          app.put '/api/v1/users/:id' do |id|
            requires_authentication!
            controller.update(id, parse_json_body(request), current_user: current_user)
          end

          # DELETE /api/v1/users/:id
          app.delete '/api/v1/users/:id' do |id|
            requires_authentication!
            requires_admin!
            controller.delete(id, current_user: current_user)
          end
        end
      end
    end
  end
end
