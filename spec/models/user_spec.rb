# frozen_string_literal: true

require 'spec_helper'

RSpec.describe SinatraBoilerplate::Modules::Users::Model do
  let(:user) { build(:user) }

  it 'hashes the password on assignment' do
    user.password = 'newpassword1'
    expect(user.password_digest).to start_with('$2')
  end

  it 'authenticates with the correct password' do
    user.password = 'secret123'
    user.save!
    expect(user.authenticate('secret123')).to be true
    expect(user.authenticate('wrong')).to be false
  end

  it 'rejects authentication when not active' do
    user.password = 'secret123'
    user.active = false
    user.save!
    expect(user.authenticate('secret123')).to be false
  end

  it 'rejects authentication when soft-deleted' do
    user.password = 'secret123'
    user.save!
    user.update!(deleted_at: Time.current)
    expect(user.authenticate('secret123')).to be false
  end

  it 'soft-deletes' do
    user.save!
    user.soft_delete!
    expect(user.deleted_at).not_to be_nil
    expect(user.active).to be false
  end

  it 'reports admin?' do
    user.role = 'admin'
    expect(user.admin?).to be true
    user.role = 'user'
    expect(user.admin?).to be false
  end
end
