module Types
  class MutationType < BaseObject
    field :sign_in, mutation: Mutations::SignIn
    field :create_reservation, mutation: Mutations::CreateReservation
    field :cancel_reservation, mutation: Mutations::CancelReservation
    field :create_equipment, mutation: Mutations::CreateEquipment
    field :retire_equipment, mutation: Mutations::RetireEquipment
  end
end
