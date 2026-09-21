# frozen_string_literal: true

require_relative 'app'

# This file is used by Rack-based servers (Puma) to start the application.
# Don't change this file directly. Run with: bundle exec puma -C config/puma.rb
#
# NOTE: Sinatra::Base#new! returns an instance without the middleware stack,
#       while .new returns an instance wrapped with the configured middleware.
#       Always use .new in config.ru.
run SinatraBoilerplate::Application.new
