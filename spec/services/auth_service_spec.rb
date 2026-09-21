# frozen_string_literal: true

require 'spec_helper'

RSpec.describe SinatraBoilerplate::Modules::Auth::Service do
  let(:service) { described_class.new }

  describe '#register' do
    it 'creates a user and returns a token pair' do
      result = service.register(
        name: 'New User',
        email: 'svc@example.com',
        password: 'password123'
      )

      expect(result[:access_token]).to be_a(String)
      expect(result[:refresh_token]).to be_a(String)
      expect(result[:user].email).to eq('svc@example.com')
    end

    it 'raises on duplicate email' do
      create(:user, email: 'dup@example.com')
      expect do
        service.register(name: 'X', email: 'dup@example.com', password: 'password123')
      end.to raise_error(SinatraBoilerplate::Errors::ConflictError)
    end
  end

  describe '#login' do
    it 'returns a token pair on valid credentials' do
      create(:user, email: 'login@example.com', password: 'login12345')
      result = service.login(email: 'login@example.com', password: 'login12345')
      expect(result[:access_token]).to be_a(String)
    end

    it 'raises AuthenticationError on wrong password' do
      create(:user, email: 'login@example.com', password: 'login12345')
      expect do
        service.login(email: 'login@example.com', password: 'wrong')
      end.to raise_error(SinatraBoilerplate::Errors::AuthenticationError)
    end
  end

  describe '#refresh' do
    it 'rotates the refresh token' do
      create(:user, email: 'rot@example.com', password: 'rot1234567')
      login = service.login(email: 'rot@example.com', password: 'rot1234567')
      old = login[:refresh_token]

      result = service.refresh(old)
      expect(result[:refresh_token]).not_to eq(old)
    end
  end

  describe '#logout_all' do
    it 'revokes all tokens for a user' do
      user = create(:user, email: 'all@example.com')
      service.logout_all(user)
      expect(SinatraBoilerplate::Modules::Auth::RefreshToken.where(user_id: user.id).count).to eq(0)
    end
  end
end
