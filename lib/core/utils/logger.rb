# frozen_string_literal: true

module SinatraBoilerplate
  module Utils
    # Logger wraps the global app logger and is the single place we go through
    # to record structured events.
    class Logger
      LEVELS = {
        'debug' => ::Logger::DEBUG,
        'info' => ::Logger::INFO,
        'warn' => ::Logger::WARN,
        'error' => ::Logger::ERROR,
        'fatal' => ::Logger::FATAL
      }.freeze

      class << self
        def log
          @log ||= build
        end

        def build
          ::Logger.new($stdout).tap do |logger|
            logger.level = LEVELS.fetch(ENV.fetch('APP_LOG_LEVEL', 'info').downcase, ::Logger::INFO)
            logger.formatter = proc do |severity, time, _progname, msg|
              "#{time.utc.iso8601(3)} [#{severity}] #{msg}\n"
            end
          end
        end

        def info(message, **attrs)
          log.info(format(message, attrs))
        end

        def warn(message, **attrs)
          log.warn(format(message, attrs))
        end

        def error(message, **attrs)
          log.error(format(message, attrs))
        end

        def debug(message, **attrs)
          log.debug(format(message, attrs))
        end

        def format(message, attrs)
          payload = attrs.transform_keys(&:to_s)
          payload.empty? ? message : "#{message} #{payload.to_json}"
        end
      end
    end
  end
end
