# frozen_string_literal: true

require 'spec_helper'

RSpec.describe SinatraBoilerplate::Modules::Users::Contracts::CreateContract do
  subject(:contract) { described_class.new }

  it 'passes for a valid input' do
    result = contract.call(name: 'Alice', email: 'alice@example.com', password: 'abcdef12')
    expect(result.success?).to be true
  end

  it 'fails when name is missing' do
    result = contract.call(email: 'a@b.com', password: 'abcdef12')
    expect(result.success?).to be false
    expect(result.errors[:name]).not_to be_empty
  end

  it 'fails when email is invalid' do
    result = contract.call(name: 'Alice', email: 'not-an-email', password: 'abcdef12')
    expect(result.success?).to be false
    expect(result.errors[:email]).not_to be_empty
  end

  it 'fails when password is too short' do
    result = contract.call(name: 'Alice', email: 'a@b.com', password: 'short')
    expect(result.success?).to be false
    expect(result.errors[:password]).not_to be_empty
  end

  it 'fails when password has no digits' do
    result = contract.call(name: 'Alice', email: 'a@b.com', password: 'onlyletters')
    expect(result.success?).to be false
  end

  it 'fails when role is not in the allowed list' do
    result = contract.call(name: 'Alice', email: 'a@b.com', password: 'abcdef12', role: 'super')
    expect(result.success?).to be false
    expect(result.errors[:role]).not_to be_empty
  end
end
