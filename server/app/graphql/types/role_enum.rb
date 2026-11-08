module Types
  class RoleEnum < BaseEnum
    description "A member's role inside one organization"

    value "OWNER", "Full control, including staff management", value: "owner"
    value "STAFF", "Manages equipment and any reservation", value: "staff"
    value "MEMBER", "Books equipment and manages their own reservations", value: "member"
  end
end
