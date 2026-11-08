module Types
  class MemberType < BaseObject
    description "Another user, as seen from inside the current organization"

    field :id, ID, null: false
    field :name, String, null: false
    field :email, String, description: "Visible to managers and to the member themselves"

    def email
      AccessPolicy.see_member_email?(Current.membership, object) ? object.email : nil
    end
  end
end
