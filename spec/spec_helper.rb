# frozen_string_literal: true

ENV['APP_ENV'] = 'test'
ENV['RACK_ENV'] = 'test'

require_relative '../app'

require 'rspec'
require 'rack/test'
require 'factory_bot'
require 'faker'

# Require support files and factories
Dir[File.expand_path('support/**/*.rb', __dir__)].sort.each { |f| require f }
Dir[File.expand_path('factories/**/*.rb', __dir__)].sort.each { |f| require f }

# Ensure schema is loaded for the test database
ActiveRecord::Migration.verbose = false
load_schema = ActiveRecord::Tasks::DatabaseTasks.database_configuration =
  {
      test: SinatraBoilerplate::Database.config
    }

require 'database_cleaner/active_record'

RSpec.configure do |config|
  config.include Rack::Test::Methods, type: :request
  config.include FactoryBot::Syntax::Methods
  config.include JsonHelpers
  config.include AuthHelpers

  config.expect_with :rspec do |expectations|
    expectations.include_chain_clauses_in_custom_matcher_descriptions = true
  end

  config.mock_with :rspec do |mocks|
    mocks.verify_partial_doubles = true
  end

  config.shared_context_metadata_behavior = :apply_to_host_groups
  config.disable_monkey_patching!
  config.warnings = false
  config.order = :random
  Kernel.srand config.seed

  DatabaseCleaner.strategy = :truncation, { except: %w[ar_internal_metadata schema_migrations] }
  config.before(:suite) do
    DatabaseCleaner.clean_with(:truncation, except: %w[ar_internal_metadata schema_migrations])
  end
  config.around(:each) do |example|
    DatabaseCleaner.cleaning { example.run }
  end
end

# Test database setup helper. Connects to the test database and runs
# pending migrations. DatabaseCleaner handles per-test isolation.
def setup_test_database!
  ActiveRecord::Base.establish_connection(SinatraBoilerplate::Database.config)
  ActiveRecord::Migration.verbose = false
  ActiveRecord::Migrator.migrations_paths = ['db/migrate']
  ActiveRecord::MigrationContext.new('db/migrate').migrate
end

setup_test_database! unless ENV['SKIP_DB_SETUP'] == 'true'