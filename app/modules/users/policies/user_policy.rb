# frozen_string_literal: true

module SinatraBoilerplate
  module Modules
    module Users
      module Policies
        # Policy helper to centralize authorization decisions for users.
        # The Service class also enforces these rules directly. Having a
        # dedicated policy module makes the rules explicit and reusable in
        # tests and other modules.
        module UserPolicy
          module_function

          def can_read?(current_user, target_user)
            return true if current_user[:role] == 'admin'
            return true if current_user[:id] == target_user.id.to_s

            false
          end

          def can_create?(current_user)
            current_user[:role] == 'admin'
          end

          def can_update?(current_user, target_user, params)
            return true if current_user[:role] == 'admin'
            return false unless current_user[:id] == target_user.id.to_s

            (params.keys.map(&:to_sym) & %i[role active]).empty?
          end

          def can_delete?(current_user, _target_user)
            current_user[:role] == 'admin'
          end
        end
      end
    end
  end
end
