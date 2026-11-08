class CreateReservations < ActiveRecord::Migration[8.0]
  def change
    create_table :reservations do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :equipment, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.datetime :starts_at, null: false
      t.datetime :ends_at, null: false
      t.string :status, null: false, default: "confirmed"
      t.string :note, null: false, default: ""
      t.datetime :cancelled_at
      t.timestamps
    end
    # Supports the overlap query: active reservations of one item ordered by time.
    add_index :reservations, %i[equipment_id status starts_at]
    add_index :reservations, %i[organization_id user_id starts_at]
    add_check_constraint :reservations, "ends_at > starts_at", name: "reservations_end_after_start"
  end
end
