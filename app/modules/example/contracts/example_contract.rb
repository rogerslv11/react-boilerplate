# frozen_string_literal: true

require 'dry/validation'

module SinatraBoilerplate
  module Modules
    module Example
      module Contracts
        class EchoContract < Dry::Validation::Contract
          params do
            required(:message).filled(:string, min_size?: 1, max_size?: 240)
          end
        end
      end
    end
  end
end
