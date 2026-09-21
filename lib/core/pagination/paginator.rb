# frozen_string_literal: true

require_relative 'page'

module SinatraBoilerplate
  module Pagination
    # Paginator takes an ActiveRecord::Relation (or any enumerable) and
    # applies a stable, configurable page/per-page contract.
    class Paginator
      DEFAULT_PER_PAGE = 20
      MAX_PER_PAGE = 100

      attr_reader :relation, :page, :per_page

      def self.paginate(relation, page: 1, per_page: DEFAULT_PER_PAGE)
        new(relation, page: page, per_page: per_page).paginate
      end

      def initialize(relation, page: 1, per_page: DEFAULT_PER_PAGE)
        @relation = relation
        @page = [page.to_i, 1].max
        @per_page = [[per_page.to_i, 1].max, MAX_PER_PAGE].min
      end

      def paginate
        items = relation.offset(offset).limit(per_page).to_a
        total = relation.count
        Page.new(items: items, page: page, per_page: per_page, total: total)
      end

      def offset
        (page - 1) * per_page
      end
    end
  end
end
