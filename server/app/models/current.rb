# Request-scoped state. Rails resets these attributes after every request and job.
class Current < ActiveSupport::CurrentAttributes
  attribute :request_id, :user, :membership

  def organization
    membership&.organization
  end
end
