# Authorization rules, kept in one place so every resolver asks the same question
# the same way. Each method takes the acting membership.
module AccessPolicy
  module_function

  def manage_equipment?(membership)
    membership.manager?
  end

  def view_audit_log?(membership)
    membership.manager?
  end

  def cancel_reservation?(membership, reservation)
    membership.manager? || reservation.user_id == membership.user_id
  end

  def see_member_email?(membership, user)
    membership.manager? || membership.user_id == user.id
  end
end
