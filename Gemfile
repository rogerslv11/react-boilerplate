source "https://rubygems.org"

ruby ">= 3.2"

# Web stack
gem "sinatra", "~> 4.2"
gem "rackup", "~> 2.3"
gem "puma", "~> 8.0"
gem "rack", "~> 3.2"
gem "rack-cors", "~> 2.0"
gem "rack-protection", "~> 4.2"
gem "rack-attack", "~> 6.7"

# Persistence
gem "activerecord", "~> 8.1"
gem "activesupport", "~> 8.1"
gem "pg", "~> 1.5"

# Validation / Contracts
gem "dry-validation", "~> 1.11"
gem "dry-schema", "~> 1.16"
gem "dry-core", "~> 1.1"

# Auth & Security
gem "bcrypt", "~> 3.1"
gem "jwt", "~> 2.9"

# Configuration
gem "dotenv", "~> 3.1"
gem "rake", "~> 13.3"

group :development, :test do
  gem "rspec", "~> 3.13"
  gem "rack-test", "~> 2.2"
  gem "factory_bot", "~> 6.5"
  gem "rubocop", "~> 1.91"
  gem "rubocop-rspec", "~> 3.6", require: false
  gem "rubocop-performance", "~> 1.25", require: false
  gem "database_cleaner-active_record", "~> 2.2"
  gem "pry", "~> 0.14"
end