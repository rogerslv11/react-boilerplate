# frozen_string_literal: true

require_relative '../modules/users/service'
require_relative '../modules/users/serializers/user_serializer'
require_relative '../../lib/core/errors/validation_error'

module SinatraBoilerplate
  module Controllers
    # Controller for /api/v1/users. It parses params, delegates to the
    # service and serializes the response using the UserSerializer.
    class UsersController
      def initialize(service: SinatraBoilerplate::Modules::Users::Service.new)
        @service = service
      end

      def index(params, current_user:)
        page = @service.list(symbolize(params), current_user: current_user)
        SinatraBoilerplate::Responses::Builder.success(
          data: {
            items: SinatraBoilerplate::Modules::Users::Serializers::UserSerializer.many(page.items),
            pagination: {
              page: page.page,
              per_page: page.per_page,
              total: page.total,
              total_pages: page.total_pages
            }
          }
        )
      end

      def show(id, current_user:)
        user = @service.show(id, current_user: current_user)
        SinatraBoilerplate::Responses::Builder.success(
          data: SinatraBoilerplate::Modules::Users::Serializers::UserSerializer.one(user)
        )
      end

      def create(body, current_user:)
        user = @service.create(symbolize(body), current_user: current_user)
        SinatraBoilerplate::Responses::Builder.created(
          data: SinatraBoilerplate::Modules::Users::Serializers::UserSerializer.one(user)
        )
      end

      def update(id, body, current_user:)
        user = @service.update(id, symbolize(body), current_user: current_user)
        SinatraBoilerplate::Responses::Builder.success(
          data: SinatraBoilerplate::Modules::Users::Serializers::UserSerializer.one(user)
        )
      end

      def delete(id, current_user:)
        @service.delete(id, current_user: current_user)
        SinatraBoilerplate::Responses::Builder.no_content
      end

      private

      def symbolize(hash)
        return {} if hash.nil?

        hash.each_with_object({}) { |(k, v), acc| acc[k.to_sym] = v }
      end
    end
  end
end
