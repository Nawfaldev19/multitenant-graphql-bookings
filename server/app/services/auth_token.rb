# Signed, expiring bearer tokens. The payload is the user id; the signature and
# expiry are checked by ActiveSupport::MessageVerifier, keyed from secret_key_base.
module AuthToken
  PURPOSE = :api_session
  LIFETIME = 12.hours

  def self.issue(user, expires_in: LIFETIME)
    verifier.generate(user.id, purpose: PURPOSE, expires_in: expires_in)
  end

  # Returns the user, or nil for a missing, tampered, or expired token.
  def self.authenticate(token)
    return nil if token.blank?

    user_id = verifier.verified(token, purpose: PURPOSE)
    user_id && User.find_by(id: user_id)
  end

  def self.verifier
    Rails.application.message_verifier(:auth_token)
  end
end
