class Equipment < ApplicationRecord
  include TenantScoped

  has_many :reservations, dependent: :restrict_with_error

  validates :name, presence: true, length: { maximum: 80 }, uniqueness: { scope: :organization_id }
  validates :category, presence: true, length: { maximum: 40 }
  validates :location, length: { maximum: 80 }
  validates :description, length: { maximum: 1000 }

  scope :active, -> { where(active: true) }
  scope :in_category, ->(category) { category.present? ? where(category: category) : all }
  scope :matching, lambda { |term|
    next all if term.blank?

    pattern = "%#{sanitize_sql_like(term.strip.downcase)}%"
    where("LOWER(name) LIKE :pattern OR LOWER(description) LIKE :pattern", pattern: pattern)
  }
end
