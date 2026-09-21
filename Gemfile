# frozen_string_literal: true

source 'https://rubygems.org'

ruby '>= 3.2'

# ----------------------------------------------------------------------------
# Web stack
# ----------------------------------------------------------------------------
gem 'puma', '~> 8.0'
gem 'rack', '~> 3.2'
gem 'rack-attack', '~> 6.7'
gem 'rack-cors', '~> 2.0'
gem 'rack-protection', '~> 4.2'
gem 'rackup', '~> 2.3'
gem 'sinatra', '~> 4.2'

# ----------------------------------------------------------------------------
# Persistence
# ----------------------------------------------------------------------------
gem 'activerecord', '~> 8.1'
gem 'activesupport', '~> 8.1'
gem 'pg', '~> 1.5'

# ----------------------------------------------------------------------------
# Validation / Contracts
# ----------------------------------------------------------------------------
gem 'dry-core', '~> 1.1'
gem 'dry-monads', '~> 1.11'
gem 'dry-schema', '~> 1.16'
gem 'dry-validation', '~> 1.11'

# ----------------------------------------------------------------------------
# Auth & Security
# ----------------------------------------------------------------------------
gem 'bcrypt', '~> 3.1'
gem 'jwt', '~> 2.9'

# ----------------------------------------------------------------------------
# Configuration
# ----------------------------------------------------------------------------
gem 'dotenv', '~> 3.1'
gem 'rake', '~> 13.3'

# ----------------------------------------------------------------------------
# Background jobs & cache (optional but prepared)
# ----------------------------------------------------------------------------
gem 'connection_pool', '~> 2.5'
gem 'redis', '~> 5.4'

group :development, :test do
  gem 'database_cleaner-active_record', '~> 2.2'
  gem 'factory_bot', '~> 6.5'
  gem 'faker', '~> 3.5'
  gem 'pry', '~> 0.14'
  gem 'rack-test', '~> 2.2'
  gem 'rerun', '~> 0.14', require: false
  gem 'rspec', '~> 3.13'
  gem 'rubocop', '~> 1.91'
  gem 'rubocop-performance', '~> 1.25', require: false
  gem 'rubocop-rspec', '~> 3.6', require: false
end
