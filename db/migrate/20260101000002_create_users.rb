# frozen_string_literal: true

class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users, id: :uuid, default: 'gen_random_uuid()' do |t|
      t.string  :name,       null: false, limit: 120
      t.string  :email,      null: false, limit: 180
      t.string  :password_digest, null: false
      t.string  :role,       null: false, default: 'user', limit: 40
      t.boolean :active,     null: false, default: true
      t.datetime :deleted_at, null: true

      t.timestamps null: false
    end

    add_index :users, 'LOWER(email)', unique: true, name: 'idx_users_email_unique'
    add_index :users, :role
    add_index :users, :deleted_at
  end
end