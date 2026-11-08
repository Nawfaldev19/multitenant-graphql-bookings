require "test_helper"

class TenantScopedTest < ActiveSupport::TestCase
  setup do
    @alpha = add_member(create_organization(name: "Alpha"), role: "owner")
    @beta = add_member(create_organization(name: "Beta"), role: "owner")
    @alpha_item = create_equipment(@alpha, name: "Alpha lathe")
    @beta_item = create_equipment(@beta, name: "Beta lathe")
  end

  test "querying without a tenant raises instead of returning every tenant's rows" do
    error = assert_raises(TenantScoped::MissingTenantError) { Equipment.all.to_a }
    assert_match "Equipment was queried without a current organization", error.message
  end

  test "queries only see the current tenant" do
    as_member(@alpha) do
      assert_equal [@alpha_item], Equipment.all.to_a
      assert_raises(ActiveRecord::RecordNotFound) { Equipment.find(@beta_item.id) }
    end
  end

  test "association reads through another tenant's parent are still filtered" do
    create_reservation(@beta, @beta_item, starts_at: NOW + 1.hour)

    as_member(@alpha) do
      assert_empty Reservation.where(equipment_id: @beta_item.id)
    end
  end

  test "new records are assigned to the current tenant" do
    item = as_member(@alpha) { Equipment.create!(name: "Drill press", category: "Woodworking") }

    assert_equal @alpha.organization_id, item.organization_id
  end

  test "a record cannot be written into another tenant" do
    as_member(@alpha) do
      item = Equipment.new(name: "Sneaky", category: "Cutting", organization: @beta.organization)

      assert_not item.valid?
      assert_includes item.errors[:organization], "does not match the current organization"
    end
  end

  test "updates cannot reach another tenant's rows" do
    as_member(@alpha) do
      assert_equal 0, Equipment.where(id: @beta_item.id).update_all(name: "Hijacked")
    end
    assert_equal "Beta lathe", as_member(@beta) { @beta_item.reload.name }
  end

  test "across_tenants is explicit and restores the previous state, even after an error" do
    assert_equal(2, TenantScoped.across_tenants { Equipment.count })
    assert_raises(RuntimeError) { TenantScoped.across_tenants { raise "boom" } }
    assert_not TenantScoped.bypassed?
  end

  test "a reservation cannot point at equipment from another tenant" do
    as_member(@alpha) do
      reservation = Reservation.new(equipment: @beta_item, user: @alpha.user, starts_at: NOW + 1.hour, ends_at: NOW + 2.hours)

      assert_not reservation.valid?
      assert_includes reservation.errors[:equipment], "is not part of this organization"
    end
  end
end
