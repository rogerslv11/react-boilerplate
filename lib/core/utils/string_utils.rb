# frozen_string_literal: true

module SinatraBoilerplate
  module Utils
    module StringUtils
      module_function

      def normalize_email(email)
        return nil if email.nil?

        email.to_s.downcase.strip
      end

      def camelize_keys(hash)
        case hash
        when Hash
          hash.each_with_object({}) do |(k, v), result|
            key = k.to_s.split('_').map(&:capitalize).join
            key[0] = key[0].downcase if key.length > 1
            result[key] = camelize_keys(v)
          end
        when Array
          hash.map { |item| camelize_keys(item) }
        else
          hash
        end
      end

      def present?(value)
        !value.nil? && !(value.respond_to?(:empty?) && value.empty?)
      end
    end
  end
end
