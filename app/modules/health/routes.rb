# frozen_string_literal: true

module SinatraBoilerplate
  module Modules
    module Health
      # Health check endpoints. They verify the application can connect to
      # PostgreSQL and respond with a simple status payload.
      module Routes
        def self.registered(app)
          app.get '/health' do
            database_ok = SinatraBoilerplate::Database.connected?

            status_code = database_ok ? 200 : 503
            SinatraBoilerplate::Responses::Builder.success(
              status: status_code,
              data: {
                status: status_code == 200 ? 'ok' : 'degraded',
                version: ENV.fetch('APP_VERSION', '1.0.0'),
                environment: SinatraBoilerplate::Env.env,
                uptime_seconds: (Time.now - STARTED_AT).round,
                checks: {
                  database: database_ok ? 'ok' : 'down'
                }
              }
            )
          end

          app.get '/health/live' do
            SinatraBoilerplate::Responses::Builder.success(data: { status: 'ok' })
          end

          app.get '/health/ready' do
            if SinatraBoilerplate::Database.connected?
              SinatraBoilerplate::Responses::Builder.success(data: { status: 'ready' })
            else
              SinatraBoilerplate::Responses::Builder.error(
                status: 503,
                code: 'NOT_READY',
                message: 'database_unreachable'
              )
            end
          end
        end
      end

      STARTED_AT = Time.now
    end
  end
end