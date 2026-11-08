class Reservation < ApplicationRecord
  include TenantScoped

  SLOT = 15.minutes
  MAX_DURATION = 4.hours

  belongs_to :equipment
  belongs_to :user

  enum :status, { confirmed: "confirmed", cancelled: "cancelled" }, validate: true

  validates :starts_at, :ends_at, presence: true
  validates :note, length: { maximum: 280 }
  validate :equipment_belongs_to_same_organization

  # Half-open intervals: [starts_at, ends_at). Back-to-back bookings do not overlap.
  scope :overlapping, ->(starts_at, ends_at) { where(starts_at: ...ends_at).where("ends_at > ?", starts_at) }
  scope :chronological, -> { order(:starts_at, :id) }

  private

  def equipment_belongs_to_same_organization
    return if equipment.nil? || equipment.organization_id == organization_id

    errors.add(:equipment, "is not part of this organization")
  end
end
