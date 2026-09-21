# frozen_string_literal: true

# Seeds are idempotent and safe to re-run.
require_relative '../app/modules/users/model'

admin_email = ENV.fetch('SEED_ADMIN_EMAIL', 'admin@example.com')
admin_password = ENV.fetch('SEED_ADMIN_PASSWORD', 'admin12345678')
user_email = ENV.fetch('SEED_USER_EMAIL', 'user@example.com')
user_password = ENV.fetch('SEED_USER_PASSWORD', 'user12345678')

SinatraBoilerplate::Modules::Users::Model.find_or_create_by!(email: admin_email) do |u|
  u.name = 'Admin'
  u.password = admin_password
  u.role = 'admin'
  u.active = true
end

SinatraBoilerplate::Modules::Users::Model.find_or_create_by!(email: user_email) do |u|
  u.name = 'User'
  u.password = user_password
  u.role = 'user'
  u.active = true
end

puts "Seeded users: #{admin_email}, #{user_email}"
