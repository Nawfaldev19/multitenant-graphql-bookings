module Types
  class AuditEventType < BaseObject
    field :id, ID, null: false
    field :action, String, null: false
    field :subject_type, String, null: false
    field :subject_id, ID, null: false
    field :metadata, GraphQL::Types::JSON, null: false
    field :created_at, GraphQL::Types::ISO8601DateTime, null: false
    field :actor, MemberType, null: false

    def actor
      dataloader.with(Sources::RecordById, User).load(object.actor_id)
    end
  end
end
