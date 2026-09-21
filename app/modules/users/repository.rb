# frozen_string_literal: true

require_relative 'model'

module SinatraBoilerplate
  module Modules
    module Users
      # Encapsulates persistence queries for User. Keeps controllers/services
      # unaware of how data is fetched, easing tests and future migrations.
      class Repository
        DEFAULT_SORT = { created_at: :desc }.freeze

        def initialize(model = Model)
          @model = model
        end

        def find(id)
          @model.where(deleted_at: nil).find_by(id: id)
        end

        def find_by_email(email)
          return nil if email.nil?

          @model.where(deleted_at: nil).find_by('LOWER(email) = ?', email.to_s.downcase)
        end

        def find_by_email_for_auth(email)
          # Includes soft-deleted users so login can return a meaningful message
          # without leaking the existence of deleted accounts.
          @model.find_by('LOWER(email) = ?', email.to_s.downcase)
        end

        def list(filters: {}, page: 1, per_page: 20, sort: nil, order: nil)
          scope = @model.where(deleted_at: nil)

          if (q = filters[:q]) && !q.to_s.empty?
            sanitized = "%#{q.to_s.downcase}%"
            scope = scope.where('LOWER(name) LIKE ? OR LOWER(email) LIKE ?', sanitized, sanitized)
          end

          scope = scope.where(role: filters[:role]) if filters[:role]
          scope = scope.where(active: filters[:active]) unless filters[:active].nil?

          sort_attr = sort || DEFAULT_SORT.keys.first
          order_dir = (order || DEFAULT_SORT[sort_attr]).to_sym == :asc ? :asc : :desc
          scope.order(sort_attr => order_dir)
        end

        def create(attrs)
          @model.create!(attrs)
        end

        def update(user, attrs)
          user.update!(attrs)
          user
        end

        def soft_delete(user)
          user.soft_delete!
        end
      end
    end
  end
end
