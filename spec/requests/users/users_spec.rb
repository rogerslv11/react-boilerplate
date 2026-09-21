# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'Users endpoints', type: :request do
  let(:admin) { create(:admin, email: 'admin@test.com') }
  let(:regular) { create(:user, email: 'regular@test.com') }

  describe 'GET /api/v1/users' do
    it 'lists users for admins' do
      create_list(:user, 3)
      get '/api/v1/users', {}, auth_header_for(admin)
      expect(last_response.status).to eq(200)
      expect(response_data['items'].size).to be >= 3
      expect(response_data['pagination']).to include('page', 'per_page', 'total', 'total_pages')
    end

    it 'rejects non-admins' do
      get '/api/v1/users', {}, auth_header_for(regular)
      expect(last_response.status).to eq(403)
    end

    it 'rejects anonymous' do
      get '/api/v1/users'
      expect(last_response.status).to eq(401)
    end

    it 'supports search' do
      create(:user, name: 'Alice')
      create(:user, name: 'Bob')
      get '/api/v1/users', { q: 'Alice' }, auth_header_for(admin)
      expect(last_response.status).to eq(200)
      expect(response_data['items'].map { |u| u['name'] }).to include('Alice')
    end
  end

  describe 'GET /api/v1/users/:id' do
    it 'allows the user to view their own profile' do
      get "/api/v1/users/#{regular.id}", {}, auth_header_for(regular)
      expect(last_response.status).to eq(200)
      expect(response_data['id']).to eq(regular.id)
    end

    it 'allows admins to view any profile' do
      get "/api/v1/users/#{regular.id}", {}, auth_header_for(admin)
      expect(last_response.status).to eq(200)
    end

    it 'rejects other users viewing a profile' do
      other = create(:user, email: 'other@test.com')
      get "/api/v1/users/#{regular.id}", {}, auth_header_for(other)
      expect(last_response.status).to eq(403)
    end

    it 'returns 404 for unknown id' do
      get '/api/v1/users/00000000-0000-0000-0000-000000000000', {}, auth_header_for(admin)
      expect(last_response.status).to eq(404)
    end
  end

  describe 'POST /api/v1/users' do
    it 'allows admins to create users' do
      post '/api/v1/users',
           { name: 'New', email: 'new@test.com', password: 'newpass123' }.to_json,
           auth_header_for(admin).merge('CONTENT_TYPE' => 'application/json')

      expect(last_response.status).to eq(201)
      expect(response_data['email']).to eq('new@test.com')
    end

    it 'returns 422 on invalid payload' do
      post '/api/v1/users',
           { name: '', email: 'bad', password: '123' }.to_json,
           auth_header_for(admin).merge('CONTENT_TYPE' => 'application/json')

      expect(last_response.status).to eq(422)
    end

    it 'returns 409 on duplicate email' do
      create(:user, email: 'dup@test.com')
      post '/api/v1/users',
           { name: 'X', email: 'dup@test.com', password: 'newpass123' }.to_json,
           auth_header_for(admin).merge('CONTENT_TYPE' => 'application/json')

      expect(last_response.status).to eq(409)
    end

    it 'rejects non-admins' do
      post '/api/v1/users',
           { name: 'X', email: 'x@test.com', password: 'newpass123' }.to_json,
           auth_header_for(regular).merge('CONTENT_TYPE' => 'application/json')

      expect(last_response.status).to eq(403)
    end
  end

  describe 'PATCH /api/v1/users/:id' do
    it 'allows users to update their own profile' do
      patch "/api/v1/users/#{regular.id}",
            { name: 'Updated Name' }.to_json,
            auth_header_for(regular).merge('CONTENT_TYPE' => 'application/json')
      expect(last_response.status).to eq(200)
      expect(response_data['name']).to eq('Updated Name')
    end

    it 'prevents users from changing their role' do
      patch "/api/v1/users/#{regular.id}",
            { role: 'admin' }.to_json,
            auth_header_for(regular).merge('CONTENT_TYPE' => 'application/json')
      expect(last_response.status).to eq(403)
    end

    it 'allows admins to change role' do
      patch "/api/v1/users/#{regular.id}",
            { role: 'admin' }.to_json,
            auth_header_for(admin).merge('CONTENT_TYPE' => 'application/json')
      expect(last_response.status).to eq(200)
      expect(response_data['role']).to eq('admin')
    end
  end

  describe 'DELETE /api/v1/users/:id' do
    it 'soft-deletes a user (admin only)' do
      user = create(:user, email: 'delete@test.com')
      delete "/api/v1/users/#{user.id}", {}, auth_header_for(admin)
      expect(last_response.status).to eq(204)
      user.reload
      expect(user.deleted_at).not_to be_nil
    end

    it 'rejects non-admins' do
      user = create(:user, email: 'keep@test.com')
      delete "/api/v1/users/#{user.id}", {}, auth_header_for(regular)
      expect(last_response.status).to eq(403)
    end
  end
end
