# frozen_string_literal: true

module SinatraBoilerplate
  module Modules
    module Users
      module Serializers
        # UserSerializer converts a User model to a JSON-friendly hash.
        # Sensitive fields (password_digest) are NEVER serialized.
        module UserSerializer
          module_function

          def one(user)
            return nil unless user

            {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              active: user.active,
              created_at: user.created_at&.iso8601,
              updated_at: user.updated_at&.iso8601
            }
          end

          def many(users)
            users.map { |u| one(u) }
          end
        end
      end
    end
  end
end
