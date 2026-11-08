# Small builders instead of fixtures: each test states exactly the data it needs.
module TestData
  PASSWORD = "correct-horse-battery".freeze

  def create_user(name: "Test Member")
    User.create!(name: name, email: "user-#{SecureRandom.hex(4)}@example.com", password: PASSWORD)
  end

  def create_organization(name: "Test Space")
    Organization.create!(name: name, slug: "space-#{SecureRandom.hex(4)}")
  end

  def add_member(organization, user = create_user, role: "member")
    Membership.create!(organization: organization, user: user, role: role)
  end

  def as_member(membership, &)
    Current.set(user: membership.user, membership: membership, &)
  end

  def create_equipment(membership, **attributes)
    as_member(membership) do
      Equipment.create!({ name: "Item #{SecureRandom.hex(3)}", category: "Cutting" }.merge(attributes))
    end
  end

  def create_reservation(membership, equipment, starts_at:, ends_at: starts_at + 1.hour, status: "confirmed")
    as_member(membership) do
      Reservation.create!(equipment: equipment, user: membership.user, starts_at: starts_at, ends_at: ends_at, status: status)
    end
  end
end
