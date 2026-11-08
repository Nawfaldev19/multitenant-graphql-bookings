module AuditLog
  def self.record!(action:, subject:, metadata: {})
    AuditEvent.create!(
      actor: Current.user,
      action: action,
      subject_type: subject.class.name,
      subject_id: subject.id,
      metadata: metadata
    )
  end
end
