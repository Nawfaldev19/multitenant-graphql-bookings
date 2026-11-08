class CreateAuditEvents < ActiveRecord::Migration[8.0]
  def change
    create_table :audit_events do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :actor, null: false, foreign_key: { to_table: :users }
      t.string :action, null: false
      t.string :subject_type, null: false
      t.bigint :subject_id, null: false
      t.json :metadata, null: false, default: {}
      t.datetime :created_at, null: false
    end
    add_index :audit_events, %i[organization_id created_at]
  end
end
