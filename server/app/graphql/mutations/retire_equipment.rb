module Mutations
  class RetireEquipment < BaseMutation
    description "Managers only. Retired equipment stays visible in history but cannot be booked."

    argument :id, ID

    field :equipment, Types::EquipmentType

    def resolve(id:)
      require_manager!
      equipment = Equipment.find(id)
      # Same row lock as ReservationBooking, so a retirement and a booking of the
      # same item are ordered, and two retirements write one audit event.
      result = Equipment.transaction do
        equipment.lock!
        next ServiceResult.failure([{ field: nil, message: "Already retired" }]) unless equipment.active?

        equipment.update!(active: false)
        AuditLog.record!(action: "equipment.retired", subject: equipment, metadata: { name: equipment.name })
        ServiceResult.success(equipment)
      end
      respond(result, :equipment)
    end
  end
end
