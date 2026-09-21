# frozen_string_literal: true

module SinatraBoilerplate
  module Pagination
    # Lightweight value object for paginated responses.
    class Page
      attr_reader :items, :page, :per_page, :total, :total_pages

      def initialize(items:, page:, per_page:, total:)
        @items = items
        @page = page
        @per_page = per_page
        @total = total
        @total_pages = total.zero? ? 0 : (total.to_f / per_page).ceil
      end

      def to_h
        {
          items: items,
          pagination: {
            page: page,
            per_page: per_page,
            total: total,
            total_pages: total_pages
          }
        }
      end
    end
  end
end
