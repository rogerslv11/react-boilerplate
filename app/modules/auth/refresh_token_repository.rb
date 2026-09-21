# frozen_string_literal: true

require 'digest'

require_relative '../../../lib/core/errors/authentication_error'
require_relative '../../../lib/core/utils/jwt_encoder'
require_relative 'refresh_token'

module SinatraBoilerplate
  module Modules
    module Auth
      # Repository for refresh tokens. Stores SHA-256 hashes only.
      class RefreshTokenRepository
        def initialize(model = RefreshToken)
          @model = model
        end

        def issue_for(user, ip_address: nil, user_agent: nil)
          raw = SecureRandom.urlsafe_base64(48)
          token = @model.create!(
            user: user,
            token_hash: @model.hash_token(raw),
            user_agent: user_agent,
            ip_address: ip_address
          )
          [raw, token]
        end

        def find_active(raw)
          return nil if raw.nil? || raw.empty?

          @model.active.find_by(token_hash: @model.hash_token(raw))
        end

        def find(raw)
          return nil if raw.nil? || raw.empty?

          @model.find_by(token_hash: @model.hash_token(raw))
        end

        def revoke(raw_token, replaced_by: nil)
          token = find(raw_token)
          return nil unless token

          token.revoke!(replaced_by: replaced_by)
          token
        end

        def revoke_all_for(user)
          @model.where(user_id: user.id, revoked_at: nil).update_all(revoked_at: Time.current)
        end
      end
    end
  end
end
