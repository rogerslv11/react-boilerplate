# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'Auth endpoints', type: :request do
  let(:existing_user) { create(:user, email: 'login@example.com', password: 'login12345') }

  describe 'POST /api/v1/auth/register' do
    it 'creates a user and returns a token pair' do
      payload = {
        name: 'New User',
        email: 'newuser@example.com',
        password: 'newuser12345'
      }

      post '/api/v1/auth/register', payload.to_json, 'CONTENT_TYPE' => 'application/json'

      expect(last_response.status).to eq(201)
      expect(response_data['access_token']).to be_a(String)
      expect(response_data['refresh_token']).to be_a(String)
      expect(response_data['user']['email']).to eq('newuser@example.com')
    end

    it 'returns 422 on invalid input' do
      post '/api/v1/auth/register',
           { name: '', email: 'bad', password: '123' }.to_json,
           'CONTENT_TYPE' => 'application/json'

      expect(last_response.status).to eq(422)
      expect(response_error['code']).to eq('VALIDATION_ERROR')
    end

    it 'returns 409 when email is taken' do
      create(:user, email: 'taken@example.com')
      post '/api/v1/auth/register',
           { name: 'X', email: 'taken@example.com', password: 'abc12345' }.to_json,
           'CONTENT_TYPE' => 'application/json'

      expect(last_response.status).to eq(409)
      expect(response_error['code']).to eq('CONFLICT')
    end
  end

  describe 'POST /api/v1/auth/login' do
    before { existing_user }

    it 'returns a token pair on valid credentials' do
      post '/api/v1/auth/login',
           { email: 'login@example.com', password: 'login12345' }.to_json,
           'CONTENT_TYPE' => 'application/json'

      expect(last_response.status).to eq(200)
      expect(response_data['access_token']).to be_a(String)
      expect(response_data['refresh_token']).to be_a(String)
    end

    it 'returns 401 on wrong password' do
      post '/api/v1/auth/login',
           { email: 'login@example.com', password: 'wrong' }.to_json,
           'CONTENT_TYPE' => 'application/json'

      expect(last_response.status).to eq(401)
      expect(response_error['code']).to eq('AUTHENTICATION_FAILED')
    end
  end

  describe 'POST /api/v1/auth/refresh' do
    before { existing_user }

    it 'rotates the refresh token and returns a new pair' do
      post '/api/v1/auth/login',
           { email: 'login@example.com', password: 'login12345' }.to_json,
           'CONTENT_TYPE' => 'application/json'
      refresh = response_data['refresh_token']
      expect(refresh).to be_a(String)

      post '/api/v1/auth/refresh',
           { refresh_token: refresh }.to_json,
           'CONTENT_TYPE' => 'application/json'

      expect(last_response.status).to eq(200)
      expect(response_data['refresh_token']).not_to eq(refresh)
    end

    it 'rejects a refresh token presented twice' do
      post '/api/v1/auth/login',
           { email: 'login@example.com', password: 'login12345' }.to_json,
           'CONTENT_TYPE' => 'application/json'
      refresh = response_data['refresh_token']

      post '/api/v1/auth/refresh',
           { refresh_token: refresh }.to_json,
           'CONTENT_TYPE' => 'application/json'
      expect(last_response.status).to eq(200)

      post '/api/v1/auth/refresh',
           { refresh_token: refresh }.to_json,
           'CONTENT_TYPE' => 'application/json'
      expect(last_response.status).to eq(401)
    end
  end

  describe 'GET /api/v1/auth/me' do
    before { existing_user }

    it 'returns the authenticated user' do
      get '/api/v1/auth/me', {}, auth_header_for(existing_user)
      expect(last_response.status).to eq(200)
      expect(response_data['email']).to eq(existing_user.email)
    end

    it 'returns 401 without a token' do
      get '/api/v1/auth/me'
      expect(last_response.status).to eq(401)
    end
  end

  describe 'POST /api/v1/auth/logout' do
    before { existing_user }

    it 'revokes the refresh token' do
      post '/api/v1/auth/login',
           { email: 'login@example.com', password: 'login12345' }.to_json,
           'CONTENT_TYPE' => 'application/json'
      refresh = response_data['refresh_token']

      post '/api/v1/auth/logout',
           { refresh_token: refresh }.to_json,
           'CONTENT_TYPE' => 'application/json'
      expect(last_response.status).to eq(200)

      post '/api/v1/auth/refresh',
           { refresh_token: refresh }.to_json,
           'CONTENT_TYPE' => 'application/json'
      expect(last_response.status).to eq(401)
    end
  end
end
