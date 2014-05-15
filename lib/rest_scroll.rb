require "rest_scroll/version"
require "rest_scroll/engine"

module RestScroll

  def self.build_scope(model, params)
    model = model.order(params[:order_by])
    Rails.logger.info "order by:#{params[:order_by]} limit:#{params[:limit]} key:#{params[:key]}"
    model = model.limit(params[:limit]) unless params[:limit].nil?
    return model if params[:key].nil?

    where = ""
    orc = ""
    keys = {}
    
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
      next if params[:key][k].blank?

      if where.blank?
        where += "(#{k} #{op} :#{k})"
        orc += "(#{k} = :#{k})"
      else
        where += " OR (#{orc} AND (#{k} #{op} :#{k}))"
        orc += "AND (#{k} = :#{k})"
      end
      keys[k] = params[:key][k]
    end
    Rails.logger.info "where: #{where} keys: #{keys}"
    model = model.where(where, keys)
    return model
  end

  module ModelExtensions
    extend ActiveSupport::Concern

    module ClassMethods
      

      def rest_scroll(params)
        opts = {:order_by => {:id => :asc}, :limit => 10}
        unless params.nil?
          params = params.symbolize_keys

          unless params[:order_by].nil?
            h = {}
            params[:order_by].each do |k,v|
              k = k.to_s.underscore.to_sym
              v = v.to_sym
              h[k] = v
            end
            h.reverse_merge! :id => :asc
            params[:order_by] = h
          end

          unless params[:key].nil?
            h = {}
            params[:key].each do |k,v|
              k = k.to_s.underscore.to_sym
              h[k] = v
            end
            params[:key] = h
          end
          
          opts.merge! params
        end
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
