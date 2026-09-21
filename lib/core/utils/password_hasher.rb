# frozen_string_literal: true

require 'bcrypt'

module SinatraBoilerplate
  module Utils
    # PasswordHasher encapsulates BCrypt usage so we can swap algorithms later
    # without changing models/services.
    class PasswordHasher
      COST = ENV.fetch('BCRYPT_COST', '12').to_i

      class << self
        def hash(plain)
          BCrypt::Password.create(plain, cost: COST).to_s
        end

        def verify(plain, hashed)
          return false if plain.nil? || hashed.nil? || hashed.empty?

          BCrypt::Password.new(hashed) == plain
        rescue BCrypt::Errors::InvalidHash
          false
        end
      end
    end
  end
end
