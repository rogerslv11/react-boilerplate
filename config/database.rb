# frozen_string_literal: true

require 'active_record'
require 'erb'
require 'yaml'

module SinatraBoilerplate
  module Database
    class << self
      def config
        @config ||= build_config
      end

      def connect!
        ActiveRecord::Base.establish_connection(config)
        ActiveRecord::Base.logger = Log.logger if ENV.fetch('APP_DEBUG_SQL', 'false') == 'true'
      end

      def disconnect!
        ActiveRecord::Base.connection.disconnect! if connected?
      end

      def connected?
        ActiveRecord::Base.connection.execute('SELECT 1')
        true
      rescue StandardError
        false
      end

      def db_config
        ActiveRecord::Base.configurations[ENV.fetch('APP_ENV', 'development').to_sym]
      end

      private

      def build_config
        database = if ENV.fetch('APP_ENV',
                                'development') == 'test'
                     ENV.fetch('DATABASE_NAME_TEST')
                   else
                     ENV.fetch('DATABASE_NAME')
                   end
        {
          adapter: 'postgresql',
          encoding: 'unicode',
          host: ENV.fetch('DATABASE_HOST', 'localhost'),
          port: ENV.fetch('DATABASE_PORT', '5432').to_i,
          database: database,
          username: ENV.fetch('DATABASE_USER', 'postgres'),
          password: ENV.fetch('DATABASE_PASSWORD', 'postgres'),
          pool: ENV.fetch('DATABASE_POOL', '10').to_i,
          timeout: ENV.fetch('DATABASE_TIMEOUT', '5000').to_i,
          reconnect: true
        }
      end
    end
  end
end

# Establish connection eagerly when this file is required.
SinatraBoilerplate::Database.connect!
