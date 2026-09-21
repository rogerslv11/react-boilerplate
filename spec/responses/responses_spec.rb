# frozen_string_literal: true

require 'spec_helper'

RSpec.describe SinatraBoilerplate::Responses::Builder do
  describe '.success' do
    it 'wraps payload in a data envelope' do
      status, body = described_class.success(data: { id: 1 })
      parsed = JSON.parse(body)
      expect(status).to eq(200)
      expect(parsed['data']).to eq('id' => 1)
    end

    it 'supports 201 created' do
      status, _body = described_class.created(data: { id: 1 })
      expect(status).to eq(201)
    end
  end

  describe '.error' do
    it 'wraps code and message in an error envelope' do
      status, body = described_class.error(status: 404, code: 'NOT_FOUND', message: 'gone')
      parsed = JSON.parse(body)
      expect(status).to eq(404)
      expect(parsed['error']['code']).to eq('NOT_FOUND')
      expect(parsed['error']['message']).to eq('gone')
    end

    it 'omits empty details' do
      _, body = described_class.error(status: 400, code: 'X', message: 'm')
      expect(JSON.parse(body)['error']).not_to have_key('details')
    end
  end
end
