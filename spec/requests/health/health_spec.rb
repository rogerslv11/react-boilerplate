# frozen_string_literal: true

require 'spec_helper'

RSpec.describe 'Health endpoints', type: :request do
  describe 'GET /' do
    it 'returns application banner' do
      get '/'
      expect(last_response.status).to eq(200)
      expect(response_data).to include('name', 'version', 'environment', 'docs', 'api')
    end
  end

  describe 'GET /health' do
    it 'reports ok when database is reachable' do
      get '/health'
      expect(last_response.status).to eq(200)
      expect(response_data['status']).to eq('ok')
      expect(response_data['checks']['database']).to eq('ok')
    end
  end

  describe 'GET /health/live' do
    it 'always returns 200' do
      get '/health/live'
      expect(last_response.status).to eq(200)
      expect(response_data['status']).to eq('ok')
    end
  end

  describe 'GET /health/ready' do
    it 'returns 200 when database is reachable' do
      get '/health/ready'
      expect(last_response.status).to eq(200)
    end
  end
end
