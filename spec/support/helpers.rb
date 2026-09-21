# frozen_string_literal: true

# Helpers shared by request specs
module JsonHelpers
  def json_response
    JSON.parse(last_response.body)
  end

  def response_data
    json_response['data']
  end

  def response_error
    json_response['error']
  end
end

module AuthHelpers
  def auth_header_for(user)
    token = SinatraBoilerplate::Utils::JwtEncoder.encode(
      {
        sub: user.id,
        email: user.email,
        role: user.role
      }
    )
    { 'HTTP_AUTHORIZATION' => "Bearer #{token}" }
  end
end

module RackHelpers
  def app
    SinatraBoilerplate::Application.new
  end
end

RSpec.configure do |config|
  config.include RackHelpers, type: :request
end
