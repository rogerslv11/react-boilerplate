# frozen_string_literal: true

# Route registration entrypoint.
# Modules are loaded and registered in a single place to avoid loading cycles
# and to give a clear overview of what is exposed by the API.

require_relative '../app/modules/health/routes'
require_relative '../app/modules/example/routes'
require_relative '../app/modules/auth/routes'
require_relative '../app/modules/users/routes'

SinatraBoilerplate::Application.register_module(SinatraBoilerplate::Modules::Health::Routes)
SinatraBoilerplate::Application.register_module(SinatraBoilerplate::Modules::Example::Routes)
SinatraBoilerplate::Application.register_module(SinatraBoilerplate::Modules::Auth::Routes)
SinatraBoilerplate::Application.register_module(SinatraBoilerplate::Modules::Users::Routes)
