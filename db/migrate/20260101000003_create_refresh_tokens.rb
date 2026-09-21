# frozen_string_literal: true

class CreateRefreshTokens < ActiveRecord::Migration[8.0]
  def change
    create_table :refresh_tokens, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.references :user, type: :uuid, null: false,
                          foreign_key: { on_delete: :cascade }
      t.string     :token_hash, null: false, limit: 128
      t.datetime   :expires_at, null: false
      t.datetime   :revoked_at, null: true
      t.string     :replaced_by, null: true, limit: 64
      t.string     :user_agent, null: true, limit: 255
      t.string     :ip_address, null: true, limit: 64

      t.timestamps null: false
    end

    add_index :refresh_tokens, :token_hash, unique: true
    add_index :refresh_tokens, :expires_at
  end
end