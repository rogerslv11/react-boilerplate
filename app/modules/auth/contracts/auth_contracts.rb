# frozen_string_literal: true

require 'dry/validation'

module SinatraBoilerplate
  module Modules
    module Auth
      module Contracts
        class LoginContract < Dry::Validation::Contract
          params do
            required(:email).filled(:string, max_size?: 180)
            required(:password).filled(:string, min_size?: 1, max_size?: 128)
          end

          rule(:email) do
            key.failure('must be lowercase') if value.to_s != value.to_s.downcase
          end
        end

        class RegisterContract < Dry::Validation::Contract
          params do
            required(:name).filled(:string, max_size?: 120)
            required(:email).filled(:string, max_size?: 180)
            required(:password).filled(:string, min_size?: 8, max_size?: 128)
          end

          rule(:email) do
            key.failure('must be a valid email address') unless value.match?(/\A[^@\s]+@[^@\s]+\.[^@\s]+\z/)
            key.failure('must be lowercase') if value.to_s != value.to_s.downcase
          end

          rule(:password) do
            unless value.match?(/\A(?=.*[A-Za-z])(?=.*\d)/)
              key.failure('must contain at least one letter and one number')
            end
          end
        end

        class RefreshContract < Dry::Validation::Contract
          params do
            required(:refresh_token).filled(:string, min_size?: 16, max_size?: 256)
          end
        end
      end
    end
  end
end
