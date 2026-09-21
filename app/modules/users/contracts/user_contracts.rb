# frozen_string_literal: true

require 'dry/validation'

module SinatraBoilerplate
  module Modules
    module Users
      module Contracts
        # Common user params shared by create/update contracts.
        class BaseContract < Dry::Validation::Contract
          EMAIL_REGEX = /\A[^@\s]+@[^@\s]+\.[^@\s]+\z/

          params do
            required(:name).filled(:string, max_size?: 120)
            required(:email).filled(:string, max_size?: 180)
          end

          rule(:email) do
            key.failure('must be a valid email address') unless EMAIL_REGEX.match?(value.to_s)
            key.failure('must be lowercase') if value.to_s != value.to_s.downcase
          end
        end

        class CreateContract < BaseContract
          params do
            required(:name).filled(:string, max_size?: 120)
            required(:email).filled(:string, max_size?: 180)
            required(:password).filled(:string, min_size?: 8, max_size?: 128)
            optional(:role).filled(:string, included_in?: %w[user admin])
          end

          rule(:password) do
            unless value.match?(/\A(?=.*[A-Za-z])(?=.*\d)/)
              key.failure('must contain at least one letter and one number')
            end
          end
        end

        class UpdateContract < Dry::Validation::Contract
          params do
            optional(:name).filled(:string, max_size?: 120)
            optional(:email).filled(:string, max_size?: 180)
            optional(:password).filled(:string, min_size?: 8, max_size?: 128)
            optional(:role).filled(:string, included_in?: %w[user admin])
            optional(:active).filled(:bool)
          end

          rule(:email) do
            next if value.nil? || value.empty?

            key.failure('must be a valid email address') unless BaseContract::EMAIL_REGEX.match?(value.to_s)
            key.failure('must be lowercase') if value.to_s != value.to_s.downcase
          end

          rule(:password) do
            next if value.nil? || value.empty?

            unless value.match?(/\A(?=.*[A-Za-z])(?=.*\d)/)
              key.failure('must contain at least one letter and one number')
            end
          end
        end

        class ListContract < Dry::Validation::Contract
          params do
            optional(:page).filled(:integer, gteq?: 1)
            optional(:per_page).filled(:integer, gteq?: 1, lteq?: 100)
            optional(:q).filled(:string, max_size?: 120)
            optional(:role).filled(:string, included_in?: %w[user admin])
            optional(:active).filled(:bool)
            optional(:sort).filled(:string, included_in?: %w[name email created_at updated_at])
            optional(:order).filled(:string, included_in?: %w[asc desc])
          end
        end
      end
    end
  end
end
