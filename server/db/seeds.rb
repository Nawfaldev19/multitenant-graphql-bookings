# Demo data. Every person and place here is fictional; emails use example.com.
# Idempotent: running it twice resets the demo to the same state.

DEMO_PASSWORD = "equipment-bookings-demo".freeze

TenantScoped.across_tenants do
  [AuditEvent, Reservation, Equipment, Membership, User, Organization].each(&:delete_all)
end

people = {
  ada: { name: "Ada Okafor", email: "ada@example.com" },
  ben: { name: "Ben Lindqvist", email: "ben@example.com" },
  cora: { name: "Cora Mbeki", email: "cora@example.com" },
  theo: { name: "Theo Marsh", email: "theo@example.com" },
  priya: { name: "Priya Raman", email: "priya@example.com" }
}.transform_values { |attrs| User.create!(**attrs, password: DEMO_PASSWORD) }

spaces = {
  riverside: {
    name: "Riverside Makers", slug: "riverside-makers",
    roles: { ada: "owner", ben: "staff", cora: "member" },
    equipment: [
      ["Laser cutter (60 W)", "Cutting", "Bay 1", "Cuts and engraves wood, acrylic, card, and leather up to 6 mm."],
      ["CNC router", "Cutting", "Bay 2", "1220 x 1220 mm bed for sheet goods. Induction required."],
      ["Wood lathe", "Woodworking", "Wood shop", "Variable speed, 300 mm swing."],
      ["FDM printer A", "3D printing", "Print corner", "PLA and PETG, 250 mm cube build volume."],
      ["FDM printer B", "3D printing", "Print corner", "PLA only. Good for quick prototypes."],
      ["Resin printer", "3D printing", "Print corner", "Fine detail parts. Gloves and ventilation provided."],
      ["Soldering station", "Electronics", "Electronics bench", "Temperature-controlled iron with fume extractor."],
      ["Sewing machine", "Textiles", "Textile table", "Straight and zigzag stitch, walking foot available."]
    ]
  },
  foundry: {
    name: "Foundry Lane Workshop", slug: "foundry-lane",
    roles: { theo: "owner", ada: "member", priya: "member" },
    equipment: [
      ["Pottery kiln", "Ceramics", "Kiln room", "Electric kiln, bisque and glaze firings."],
      ["Pottery wheel 1", "Ceramics", "Studio", "Quiet direct-drive wheel."],
      ["Metal lathe", "Metalworking", "Metal shop", "Bench lathe for small turned parts."],
      ["MIG welder", "Metalworking", "Metal shop", "Steel up to 6 mm. Induction required."],
      ["Vinyl cutter", "Cutting", "Craft room", "600 mm wide, for signs and stencils."]
    ]
  }
}

start_of_day = Time.current.utc.beginning_of_day

spaces.each_value do |space|
  organization = Organization.create!(name: space[:name], slug: space[:slug])
  memberships = space[:roles].to_h { |key, role| [key, Membership.create!(organization: organization, user: people.fetch(key), role: role)] }
  owner = memberships.values.find(&:owner?)

  Current.set(user: owner.user, membership: owner) do
    items = space[:equipment].map do |name, category, location, description|
      Equipment.create!(name: name, category: category, location: location, description: description)
    end

    # A few bookings today and tomorrow, spread across members, so the schedule is not empty.
    bookers = memberships.values.map(&:user)
    items.first(4).each_with_index do |item, index|
      [0, 1].each do |day|
        starts_at = start_of_day + day.days + (9 + (index * 2)).hours
        Reservation.create!(equipment: item, user: bookers[(index + day) % bookers.size],
                            starts_at: starts_at, ends_at: starts_at + 90.minutes, note: "Seeded booking")
      end
    end

    AuditEvent.create!(actor: owner.user, action: "organization.seeded", subject_type: "Organization",
                       subject_id: organization.id, metadata: { equipment_count: items.size })
  end
end

Rails.logger.info(event: "seed.complete", users: people.size, organizations: spaces.size)
