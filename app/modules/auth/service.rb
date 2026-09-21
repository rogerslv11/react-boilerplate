# frozen_string_literal: true

require_relative '../../../lib/core/errors/authentication_error'
require_relative '../../../lib/core/errors/conflict_error'
require_relative '../../../lib/core/errors/validation_error'
require_relative '../../../lib/core/utils/jwt_encoder'
require_relative 'refresh_token_repository'
require_relative '../users/repository'

module SinatraBoilerplate
  module Modules
    module Auth
      # AuthService centralizes authentication flows. It coordinates
      # user lookup, password verification, JWT issuance and refresh token
      # rotation.
      class Service
        def initialize(
          users: Users::Repository.new,
          tokens: RefreshTokenRepository.new
        )
          @users = users
          @tokens = tokens
        end

        def register(params)
          params = symbolize(params)
          user = @users.find_by_email(params[:email])

          if user && !user.deleted_at
            raise Errors::ConflictError.new('Email is already taken', { email: ['already taken'] })
          end

          ActiveRecord::Base.transaction do
            user ||= UserFactory.create(params)

            if user.deleted_at
              user.update!(
                name: params[:name],
                password: params[:password],
                deleted_at: nil,
                active: true
              )
            end

            tokens = build_token_pair(user)
            tokens[:user] = user
            tokens
          end
        end

        def login(params)
          params = symbolize(params)
          user = @users.find_by_email_for_auth(params[:email])

          raise Errors::AuthenticationError, 'Invalid credentials' unless user&.authenticate(params[:password])

          raise Errors::AuthenticationError, 'Account is disabled' if user.deleted_at || !user.active

          result = build_token_pair(user)
          result[:user] = user
          result
        end

        def refresh(raw_token)
          token = @tokens.find_active(raw_token)
          raise Errors::AuthenticationError.new('Refresh token invalid', 'REFRESH_TOKEN_INVALID') unless token

          # Rotate: revoke the presented token, issue a fresh pair.
          new_raw, _new_record = @tokens.issue_for(token.user)
          token.revoke!(replaced_by: new_raw[0..6])

          build_token_pair(token.user, refresh_token: new_raw)
        end

        def logout(raw_token)
          token = @tokens.find(raw_token)
          token&.revoke!
          true
        end

        def logout_all(user)
          @tokens.revoke_all_for(user)
          true
        end

        private

        def symbolize(params)
          return params if params.is_a?(Hash)

          {}
        end

        def build_token_pair(user, refresh_token: nil)
          access = Utils::JwtEncoder.encode(
            {
              sub: user.id,
              email: user.email,
              role: user.role
            }
          )

          refresh_token ||= begin
            raw, _record = @tokens.issue_for(user)
            raw
          end

          {
            access_token: access,
            refresh_token: refresh_token,
            token_type: 'Bearer',
            expires_in: ENV.fetch('JWT_ACCESS_TTL', '3600').to_i
          }
        end
      end

      # Helper to construct a User with a virtual password attribute.
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
