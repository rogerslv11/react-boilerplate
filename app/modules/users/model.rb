# frozen_string_literal: true

require 'active_record'
require_relative '../../../lib/core/utils/password_hasher'

module SinatraBoilerplate
  module Modules
    module Users
      # User model. Encapsulates persistence concerns for the user entity.
      # Authentication concerns (JWT, refresh tokens) live in dedicated models
      # and services.
      class Model < ActiveRecord::Base
        self.table_name = 'users'

        # Custom setter that hashes the password on assignment.
        # We persist only the hash, never the plaintext.
        attr_reader :password

        def password=(plain)
          @password = plain
          self.password_digest = Utils::PasswordHasher.hash(plain) if plain && !plain.empty?
        end

        def authenticate(plain)
          return false unless active?
          return false if deleted_at

          Utils::PasswordHasher.verify(plain, password_digest)
        end

        def admin?
          role.to_s == 'admin'
        end

        def soft_delete!
          update!(deleted_at: Time.current, active: false)
        end

        def to_h
          slice(:id, :name, :email, :role, :active, :created_at, :updated_at)
        end
      end
    end
  end
end
