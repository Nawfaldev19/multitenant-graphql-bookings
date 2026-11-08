module Types
  class UserErrorType < BaseObject
    description "A validation problem the user can fix. `field` is null for whole-form problems."

    field :field, String
    field :message, String, null: false
  end
end
