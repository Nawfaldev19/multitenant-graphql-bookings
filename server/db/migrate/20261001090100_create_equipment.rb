class CreateEquipment < ActiveRecord::Migration[8.0]
  def change
    create_table :equipment do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :name, null: false
      t.string :category, null: false
      t.string :location, null: false, default: ""
      t.text :description, null: false, default: ""
      t.boolean :active, null: false, default: true
      t.timestamps
    end
    add_index :equipment, %i[organization_id name], unique: true
    add_index :equipment, %i[organization_id category]
  end
end
