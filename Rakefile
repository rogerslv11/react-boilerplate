# frozen_string_literal: true

require 'active_record'
require 'active_support/core_ext/integer/time'

require_relative 'config/application'

Dir.glob('lib/tasks/**/*.rake').each { |r| load r }

# ActiveRecord migration tasks.
# We rely on ActiveRecord::Tasks::DatabaseTasks (no standalone_migrations
# dependency), which is the standard, Rake-free way to drive migrations
# in ActiveRecord 8.1+.
namespace :db do
  task :load_config do
    require_relative 'config/database'
    ActiveRecord::Tasks::DatabaseTasks.database_configuration = {
      ENV.fetch('APP_ENV', 'development').to_sym => SinatraBoilerplate::Database.config
    }
    ActiveRecord::Tasks::DatabaseTasks.root = File.expand_path('.', __dir__)
    ActiveRecord::Tasks::DatabaseTasks.db_dir = File.expand_path('db', __dir__)
    ActiveRecord::Tasks::DatabaseTasks.migrations_paths = [File.expand_path('db/migrate', __dir__)]
    ActiveRecord::Tasks::DatabaseTasks.env = ENV.fetch('APP_ENV', 'development')
    ActiveRecord::Tasks::DatabaseTasks.seed_loader = Class.new do
      def self.load_seed
        load File.expand_path('db/seeds.rb', __dir__)
      end
    end
  end

  desc 'Create the database'
  task create: :load_config do
    ActiveRecord::Tasks::DatabaseTasks.create_current
  end

  desc 'Drop the database'
  task drop: :load_config do
    ActiveRecord::Tasks::DatabaseTasks.drop_current
  end

  desc 'Run migrations'
  task migrate: :load_config do
    ActiveRecord::Tasks::DatabaseTasks.migrate
  end

  desc 'Rollback last migration'
  task rollback: :load_config do
    ActiveRecord::Tasks::DatabaseTasks.rollback
  end

  desc 'Seed the database'
  task seed: :load_config do
    require_relative 'db/seeds'
  end

  desc 'Reset the database (drop, create, migrate, seed)'
  task reset: %i[drop create migrate seed]

  desc 'Create DB, run migrations and seeds'
  task setup: %i[create migrate seed]
end

desc 'Start the server with Puma'
task :server do
  exec 'bundle exec puma -C config/puma.rb'
end

desc 'Run all RSpec tests'
task :spec do
  exec 'bundle exec rspec'
end

task default: :spec
