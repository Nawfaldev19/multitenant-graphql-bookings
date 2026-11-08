module Mutations
  class SignIn < BaseMutation
    description "Exchange email and password for a bearer token"

    argument :email, String
    argument :password, String

    field :token, String
    field :viewer, Types::ViewerType

    INCORRECT = "Email or password is incorrect".freeze
    THROTTLED = "Too many failed sign-in attempts. Wait a few minutes and try again.".freeze

    def resolve(email:, password:)
      ip = context[:remote_ip]
      return failure(THROTTLED) if SignInThrottle.blocked?(ip: ip, email: email)

      # authenticate_by takes the same time whether or not the email exists.
      user = User.authenticate_by(email: email, password: password)
      unless user
        SignInThrottle.record_failure(ip: ip, email: email)
        return failure(INCORRECT)
      end

      { token: AuthToken.issue(user), viewer: user, errors: [] }
    end

    private

    def failure(message)
      { token: nil, viewer: nil, errors: [{ field: nil, message: message }] }
    end
  end
end
