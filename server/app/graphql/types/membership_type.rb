module Types
  class MembershipType < BaseObject
    field :id, ID, null: false
    field :role, RoleEnum, null: false
    field :organization, OrganizationType, null: false
  end
end
