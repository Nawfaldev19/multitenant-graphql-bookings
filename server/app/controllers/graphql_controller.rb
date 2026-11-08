# Single GraphQL endpoint. Authentication and tenant resolution happen here,
# once per request, before any resolver runs.
class GraphqlController < ApplicationController
  def execute
    started = Process.clock_gettime(Process::CLOCK_MONOTONIC)
    Current.request_id = request.request_id
    Current.user = AuthToken.authenticate(bearer_token)
    Current.membership = membership_for_requested_organization

    context = { remote_ip: request.remote_ip }
    result = EquipmentBookingsSchema.execute(params[:query], variables: variables_param, operation_name: params[:operationName], context: context)
    log_operation(result, started)
    render json: result
  end

  private

  def bearer_token
    request.authorization.to_s[/\ABearer (\S+)\z/, 1]
  end

  # A membership is only resolved for an organization the user belongs to, so a
  # forged X-Organization-Id header simply yields no tenant.
  def membership_for_requested_organization
    organization_id = request.headers["X-Organization-Id"]
    return if Current.user.nil? || organization_id.blank?

    Current.user.memberships.includes(:organization).find_by(organization_id: organization_id)
  end

  def variables_param
    raw = params[:variables]
    case raw
    when String then raw.present? ? JSON.parse(raw) : {}
    when ActionController::Parameters then raw.to_unsafe_h
    when nil then {}
    else raise ActionController::BadRequest, "variables must be an object"
    end
  end

  def log_operation(result, started)
    Rails.logger.info(
      event: "graphql.execute",
      operation: params[:operationName],
      user_id: Current.user&.id,
      organization_id: Current.organization&.id,
      error_count: result["errors"]&.size.to_i,
      duration_ms: ((Process.clock_gettime(Process::CLOCK_MONOTONIC) - started) * 1000).round(1)
    )
  end
end
