# frozen_string_literal: true

require_relative '../../../lib/core/errors/conflict_error'
require_relative '../../../lib/core/errors/not_found_error'
require_relative '../../../lib/core/errors/authorization_error'
require_relative 'repository'
require_relative 'contracts/user_contracts'

module SinatraBoilerplate
  module Modules
    module Users
      # UsersService contains all use cases for managing users. It owns
      # authorization-aware business logic and delegates persistence to
      # the repository.
      class Service
        FORBIDDEN_UPDATE_FIELDS = %i[role active].freeze

        def initialize(repository: Repository.new)
          @repository = repository
        end

        def list(params, current_user:)
          result = Contracts::ListContract.new.call(params)
          validate!(result)

          page = (params[:page] || 1).to_i
          per_page = (params[:per_page] || 20).to_i

          scope = @repository.list(
            filters: params,
            page: page,
            per_page: per_page,
            sort: params[:sort],
            order: params[:order]
          )

          Pagination::Paginator.paginate(scope, page: page, per_page: per_page)
        end

        def show(id, current_user:)
          user = @repository.find(id)
          raise Errors::NotFoundError.new('User not found', 'user') unless user

          authorize_read!(current_user, user)
          user
        end

        def create(params, current_user:)
          authorize_create!(current_user)

          result = Contracts::CreateContract.new.call(params)
          validate!(result)

          normalized = {
            name: params[:name].to_s.strip,
            email: params[:email].to_s.downcase.strip,
            password: params[:password]
          }
          normalized[:role] = params[:role] if params[:role] && current_user[:role] == 'admin'

          if @repository.find_by_email(normalized[:email])
            raise Errors::ConflictError.new('Email is already taken', { email: ['already taken'] })
          end

          UserFactory.create(normalized)
        end

        def update(id, params, current_user:)
          user = @repository.find(id)
          raise Errors::NotFoundError.new('User not found', 'user') unless user

          # Authorization must be evaluated BEFORE the contract so we don't
          # leak validation messages for fields the caller cannot modify.
          authorize_update!(current_user, user, params)

          result = Contracts::UpdateContract.new.call(params)
          validate!(result)

          updates = build_updates(params, user, current_user)
          @repository.update(user, updates)
        end

        def delete(id, current_user:)
          user = @repository.find(id)
          raise Errors::NotFoundError.new('User not found', 'user') unless user

          authorize_delete!(current_user, user)
          @repository.soft_delete(user)
          true
        end

        private

        def authorize_read!(current_user, user)
          return if current_user[:role] == 'admin'
          return if current_user[:id] == user.id.to_s

          raise Errors::AuthorizationError
        end

        def authorize_create!(current_user)
          return if current_user[:role] == 'admin'

          raise Errors::AuthorizationError
        end

        def authorize_update!(current_user, user, params)
          return if current_user[:role] == 'admin'

          if current_user[:id] == user.id.to_s
            attempted = params.keys.map(&:to_sym) & FORBIDDEN_UPDATE_FIELDS
            return if attempted.empty?

            raise Errors::AuthorizationError, "Field(s) #{attempted.join(', ')} cannot be modified by the current user"
          end

          raise Errors::AuthorizationError
        end

        def authorize_delete!(current_user, _user)
          return if current_user[:role] == 'admin'

          raise Errors::AuthorizationError
        end

        def build_updates(params, user, current_user)
          updates = {}
          updates[:name] = params[:name].to_s.strip if params[:name]

          if params[:email]
            new_email = params[:email].to_s.downcase.strip
            existing = @repository.find_by_email(new_email)
            if existing && existing.id != user.id
              raise Errors::ConflictError.new('Email is already taken', { email: ['already taken'] })
            end

            updates[:email] = new_email
          end

          updates[:password] = params[:password] if params[:password]
          updates[:role] = params[:role] if params[:role] && current_user[:role] == 'admin'
          updates[:active] = params[:active] if params.key?(:active) && current_user[:role] == 'admin'

          updates
        end

        def validate!(result)
          return if result.success?

          errors = result.errors(full: true).to_h
          raise Errors::ValidationError.new('Validation failed', errors)
        end
      end

      # Helper to create users with virtual password attribute.
      class UserFactory
        def self.create(params)
          params = params.transform_keys(&:to_sym)
          Users::Model.new(
            name: params[:name],
            email: params[:email],
            role: params[:role] || 'user',
            active: true
          ).tap do |u|
            u.password = params[:password]
            u.save!
          end
        end
      end
    end
  end
end
