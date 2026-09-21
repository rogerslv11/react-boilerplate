# frozen_string_literal: true

require_relative '../modules/auth/service'

module SinatraBoilerplate
  module Controllers
    # Controller for /api/v1/auth. Coordinates login, register, refresh and
    # logout flows.
    class AuthController
      def initialize(service: SinatraBoilerplate::Modules::Auth::Service.new)
        @service = service
      end

      def register(body, request_meta: {})
        result = @service.register(symbolize(body))

        SinatraBoilerplate::Responses::Builder.created(
          data: token_payload(result)
        )
      end

      def login(body, request_meta: {})
        result = @service.login(symbolize(body))
        SinatraBoilerplate::Responses::Builder.success(data: token_payload(result))
      end

      def refresh(body, request_meta: {})
        params = symbolize(body)
        result = @service.refresh(params[:refresh_token])
        SinatraBoilerplate::Responses::Builder.success(data: token_payload(result))
      end

      def logout(body)
        params = symbolize(body)
        @service.logout(params[:refresh_token])
        SinatraBoilerplate::Responses::Builder.success(data: { revoked: true })
      end

      def me(current_user)
        user = SinatraBoilerplate::Modules::Users::Repository.new.find(current_user[:id])
        raise SinatraBoilerplate::Errors::NotFoundError.new('User not found', 'user') unless user

        SinatraBoilerplate::Responses::Builder.success(
          data: SinatraBoilerplate::Modules::Users::Serializers::UserSerializer.one(user)
        )
      end

      private

      def symbolize(hash)
        return {} if hash.nil?

        hash.each_with_object({}) { |(k, v), acc| acc[k.to_sym] = v }
      end

      def token_payload(result)
        user_data = result[:user] && SinatraBoilerplate::Modules::Users::Serializers::UserSerializer.one(result[:user])
        payload = {
          access_token: result[:access_token],
          refresh_token: result[:refresh_token],
          token_type: result[:token_type],
          expires_in: result[:expires_in]
        }
        payload[:user] = user_data if user_data
        payload
      end
    end
  end
end
