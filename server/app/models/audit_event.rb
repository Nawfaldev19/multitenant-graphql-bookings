class AuditEvent < ApplicationRecord
  include TenantScoped

  belongs_to :actor, class_name: "User"

  validates :action, :subject_type, :subject_id, presence: true

  scope :newest_first, -> { order(created_at: :desc, id: :desc) }

  def readonly?
    persisted?
  end
end
