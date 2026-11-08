# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2026_10_01_090300) do
  create_table "audit_events", force: :cascade do |t|
    t.integer "organization_id", null: false
    t.integer "actor_id", null: false
    t.string "action", null: false
    t.string "subject_type", null: false
    t.bigint "subject_id", null: false
    t.json "metadata", default: {}, null: false
    t.datetime "created_at", null: false
    t.index ["actor_id"], name: "index_audit_events_on_actor_id"
    t.index ["organization_id", "created_at"], name: "index_audit_events_on_organization_id_and_created_at"
    t.index ["organization_id"], name: "index_audit_events_on_organization_id"
  end

  create_table "equipment", force: :cascade do |t|
    t.integer "organization_id", null: false
    t.string "name", null: false
    t.string "category", null: false
    t.string "location", default: "", null: false
    t.text "description", default: "", null: false
    t.boolean "active", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "category"], name: "index_equipment_on_organization_id_and_category"
    t.index ["organization_id", "name"], name: "index_equipment_on_organization_id_and_name", unique: true
    t.index ["organization_id"], name: "index_equipment_on_organization_id"
  end

  create_table "memberships", force: :cascade do |t|
    t.integer "organization_id", null: false
    t.integer "user_id", null: false
    t.string "role", default: "member", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id"], name: "index_memberships_on_organization_id"
    t.index ["user_id", "organization_id"], name: "index_memberships_on_user_id_and_organization_id", unique: true
    t.index ["user_id"], name: "index_memberships_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.string "name", null: false
    t.string "slug", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["slug"], name: "index_organizations_on_slug", unique: true
  end

  create_table "reservations", force: :cascade do |t|
    t.integer "organization_id", null: false
    t.integer "equipment_id", null: false
    t.integer "user_id", null: false
    t.datetime "starts_at", null: false
    t.datetime "ends_at", null: false
    t.string "status", default: "confirmed", null: false
    t.string "note", default: "", null: false
    t.datetime "cancelled_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["equipment_id", "status", "starts_at"], name: "index_reservations_on_equipment_id_and_status_and_starts_at"
    t.index ["equipment_id"], name: "index_reservations_on_equipment_id"
    t.index ["organization_id", "user_id", "starts_at"], name: "idx_on_organization_id_user_id_starts_at_3201b108c4"
    t.index ["organization_id"], name: "index_reservations_on_organization_id"
    t.index ["user_id"], name: "index_reservations_on_user_id"
    t.check_constraint "ends_at > starts_at", name: "reservations_end_after_start"
  end

  create_table "users", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  add_foreign_key "audit_events", "organizations"
  add_foreign_key "audit_events", "users", column: "actor_id"
  add_foreign_key "equipment", "organizations"
  add_foreign_key "memberships", "organizations"
  add_foreign_key "memberships", "users"
  add_foreign_key "reservations", "equipment"
  add_foreign_key "reservations", "organizations"
  add_foreign_key "reservations", "users"
end
