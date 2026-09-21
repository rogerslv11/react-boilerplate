# frozen_string_literal: true

require 'rack/attack'

# Rate limiting rules for rack-attack. The middleware itself is mounted in
# app.rb. Throttles are conservative defaults — tune to your traffic profile.
module Rack
  class Attack
    Rack::Attack.cache.store = ActiveSupport::Cache::MemoryStore.new

    # Limit per-IP request rate (general)
    throttle('req/ip', limit: ENV.fetch('RATE_LIMIT', '100').to_i,
                       period: ENV.fetch('RATE_PERIOD', '60').to_i) do |req|
      req.ip if req.path.start_with?('/api/')
    end

    # Limit login attempts per IP to mitigate credential stuffing
    throttle('logins/ip', limit: ENV.fetch('LOGIN_RATE_LIMIT', '10').to_i,
                          period: ENV.fetch('LOGIN_RATE_PERIOD', '60').to_i) do |req|
      req.ip if req.path == '/api/v1/auth/login' && req.post?
    end

    # Block suspicious requests
    blocklist('block bad bots') do |req|
      req.user_agent&.match?(/\b(curl|wget)\b/i) && SinatraBoilerplate::Env.production?
    end

    # Custom response for throttled requests
    self.throttled_responder = lambda do |request|
      match_data = request.env['rack.attack.match_data'] || {}
      retry_after = match_data[:period] || 60

      [
        429,
        { 'Content-Type' => 'application/json', 'Retry-After' => retry_after.to_s },
        [{
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests, please slow down.',
            retry_after: retry_after
          }
        }.to_json]
      ]
    end
  end
end
