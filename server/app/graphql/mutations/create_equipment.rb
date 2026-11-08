module Mutations
  class CreateEquipment < BaseMutation
    description "Managers only"

    argument :name, String
    argument :category, String
    argument :location, String, required: false, default_value: ""
    argument :description, String, required: false, default_value: ""

    field :equipment, Types::EquipmentType

    def resolve(**attributes)
      require_manager!
      equipment = Equipment.new(attributes.transform_values(&:strip))

      result = Equipment.transaction do
        next ServiceResult.from_model_errors(equipment) unless equipment.save

        AuditLog.record!(action: "equipment.created", subject: equipment, metadata: { name: equipment.name })
        ServiceResult.success(equipment)
      end
      respond(result, :equipment)
    end
  end
end
