class Membership < ApplicationRecord
  ROLES = %w[owner staff member].freeze

  belongs_to :organization
  belongs_to :user

  enum :role, ROLES.index_by(&:itself), validate: true

  validates :user_id, uniqueness: { scope: :organization_id }

  def manager?
    owner? || staff?
  end
end
