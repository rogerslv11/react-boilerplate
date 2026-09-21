# frozen_string_literal: true

require_relative '../users/model'

module SinatraBoilerplate
  module Modules
    module Auth
      # RefreshToken persists refresh tokens. The actual token (a UUID string)
      # is never stored: only its SHA-256 hash is kept. This is the standard
      # way to handle refresh tokens safely — if the database leaks, attackers
      # can't reuse tokens without also obtaining the plaintext.
      class RefreshToken < ActiveRecord::Base
        self.table_name = 'refresh_tokens'

        belongs_to :user, class_name: 'SinatraBoilerplate::Modules::Users::Model'

        before_validation :default_expiration

        validates :token_hash, presence: true, uniqueness: true
        validates :expires_at, presence: true

        scope :active, -> { where(revoked_at: nil).where('expires_at > ?', Time.current) }

        def revoked?
          revoked_at.present?
        end

        def expired?
          expires_at <= Time.current
        end

        def revoke!(replaced_by: nil)
          update!(revoked_at: Time.current, replaced_by: replaced_by)
        end

        def self.hash_token(raw_token)
          require 'digest'
          Digest::SHA256.hexdigest(raw_token)
        end

        private

        def default_expiration
          self.expires_at ||= Time.current + ENV.fetch('JWT_REFRESH_TTL', '2592000').to_i.seconds
        end
      end
    end
  end
end
