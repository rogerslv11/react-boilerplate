# frozen_string_literal: true

FactoryBot.define do
  factory :user, class: 'SinatraBoilerplate::Modules::Users::Model' do
    sequence(:name) { |n| "User #{n}" }
    sequence(:email) { |n| "user#{n}@example.com" }
    password { 'password123' }
    role { 'user' }
    active { true }
    deleted_at { nil }
  end

  factory :admin, parent: :user do
    role { 'admin' }
  end
end
