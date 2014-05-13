require "rest_scroll/version"
require "rest_scroll/engine"

module RestScroll

  def self.build_scope(model, params)
    model = model.order(params[:order_by])
    Rails.logger.info "order by:#{params[:order_by]} limit:#{params[:limit]}"
    model = model.limit(params[:limit]) unless params[:limit].nil?
    return model if params[:key].nil?
    params[:order_by].each do |k,o|
      op = nil
      case o
      when :asc
        op = ">"
      when :desc
        op = "<"
      else
        raise "Invalid order clause for column #{k}: #{o}. Expected :asc or :desc"
      end
      Rails.logger.info "where #{k} #{op} #{params[:key]}"
      model = model.where("#{k} #{op} :key", {:key => params[:key]})
    end
    return model
  end

  module ModelExtensions
    extend ActiveSupport::Concern

    module ClassMethods
      def rest_scroll(params)
        opts = {:order_by => {:id => :asc}, :limit => 10}
        opts.merge! params.symbolize_keys unless params.nil?
        return RestScroll::build_scope(all, opts)
      end
    end
  end

  module ControllerExtensions

  end

end

if defined?(ActiveRecord::Base)
  ActiveRecord::Base.send(:include, RestScroll::ModelExtensions)
  ActionController::Base.extend RestScroll::ControllerExtensions
end
