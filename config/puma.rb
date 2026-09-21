# frozen_string_literal: true

# Puma configuration. The defaults are sized for a single-host deployment.
# Adjust workers/threads based on actual load and CPU cores.

workers Integer(ENV.fetch('WEB_CONCURRENCY', '0'))
threads_count = Integer(ENV.fetch('MAX_THREADS', '5'))
threads threads_count, threads_count

port ENV.fetch('APP_PORT', '4567').to_i
bind "tcp://#{ENV.fetch('APP_HOST', '0.0.0.0')}:#{ENV.fetch('APP_PORT', '4567')}"

environment ENV.fetch('APP_ENV', 'development')

# Enable redirect of stdout/stderr to log files when configured
if ENV.fetch('RAILS_LOG_TO_STDOUT', 'false') != 'true'
  stdout_redirect "#{ENV.fetch('LOG_DIR', './log')}/puma.out.log",
                  "#{ENV.fetch('LOG_DIR', './log')}/puma.err.log",
                  true
end

pidfile 'tmp/pids/server.pid' if ENV.fetch('APP_ENV', 'development') != 'test'

plugin :tmp_restart

# Tag the worker process for easier identification in ps/top
tag 'sinatra-boilerplate'
