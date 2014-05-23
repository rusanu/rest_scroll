require "rest_scroll/version"
require "rest_scroll/engine"

module RestScroll

  STRING_SYNTAX = {
    /^(\s+)?(?<not>NOT\s+)?LIKE\s+(?<pattern>[^\s%_][^\%\_]+)/i =>
      lambda {|model, field, match| model.where("#{match[:not]} #{field} LIKE ?", "%#{match[:pattern]}%")},
    /^(\s+)?(?<not>NOT\s+)?LIKE\s+(?<pattern>[^\s].+)/i =>
      lambda {|model, field, match| model.where("#{match[:not]} #{field} LIKE ?", match[:pattern])},
    /^(\s+)?(?<not>NOT\s+)?(RLIKE|REGEXP)\s+(?<pattern>[^\s].+)/i =>
      lambda {|model, field, match| model.where("#{match[:not]} #{field} REGEXP ?", match[:pattern])},
    /^(\s+)?(?<not>NOT\s+)?BETWEEN\s+(?<min>\S.+\S|\S+)\s+AND\s+(?<max>\S.+\S|\S+)(\s+)?/i =>
      lambda {|model, field, match| model.where("#{match[:not]} #{field} BETWEEN ? AND ?", match[:min], match[:max])},
    /^(\s+)?(?<op>\<=|\<\>|\>=|\<|=|\>)(\s+)?(?<value>\S.+\S|\S+)(\s+)?/i =>
      lambda {|model, field, match| model.where("#{field} #{match[:op]} ?", match[:value])},
    /^(\s+)?(?<not>NOT\s+)?(\s+)?MATCH\s+(?<expr>\S.+\S|\S+)(\s+)?/i => 
      lambda {|model, field, match| model.where("#{match[:not]} MATCH(#{field}) AGAINST (?)", match[:expr])},
    /^(\s+)?(?<not>NOT\s+)?(\s+)?(?<expr>\S.+\S|\S+)(\s+)?/i =>
      lambda {|model, field, match| model.where("#{match[:not]} (LOCATE(?, #{field}) > 0)", match[:expr])}
    }

  INTEGER_SYNTAX = {
     /^(\s+)?((?<not>NOT)\s+)?(?<value>\d+)(\s+)?/i => 
       lambda {|model, field, match| model.where("#{match[:not]} #{field} = ?", match[:value].to_i)},
     /^(\s+)?((?<not>NOT)\s+)?BETWEEN(\s)+(?<min>\d+)\s+AND\s+(?<max>\d+)(\s+)?/i =>
       lambda {|model, field, match| model.where("#{match[:not]} #{field} BETWEEN ? and ?", match[:min].to_i, match[:max].to_i)},
     /^(\s+)?(?<op>\<|\>|=|\<=|\>=|\<\>)(\s+)?(?<value>\d+)(\s+)?/i =>
       lambda {|model, field, match| model.where("#{field} #{match[:op]} ?", match[:value].to_i)}
    }

  DATE_SYNTAX = {
     /^(\s+)?((?<not>NOT)(\s+)?)?(?<value>(?<year>\d\d\d\d)[\/\\\-]?(?<month>\d\d)?[\/\\\-]?(?<day>\d\d)?([T\s](?<hour>\d?\d)(\:(?<min>\d\d)(:(?<sec>\d\d))?)?)?)/i =>
       lambda {|model, field, match|
         from, to = RestScroll.parse_datetime(match)
         model.where("#{match[:not]} #{field} BETWEEN ? AND ?", from, to)},
  
     /^(\s+)?(?<op>\<|\>|=|\<=|\>=|\<\>)(\s+)?(?<value>(?<year>\d\d\d\d)[\/\\\-]?(?<month>\d\d)?[\/\\\-]?(?<day>\d\d)?([T\s](?<hour>\d?\d)(\:(?<min>\d\d)(:(?<sec>\d\d))?)?)?)/i =>
       lambda {|model, field, match|
         value,ignored = RestScroll.parse_datetime(match)
         model.where("#{field} #{match[:op]} ?", value)},
    }

  def self.parse_datetime(match)
   to = nil
   from = nil
   if match[:month].nil?
     from = Time.gm(match[:year].to_i)
     to = from + 1.year
   elsif match[:day].nil?
     from = Time.gm(
        match[:year].to_i, 
        match[:month].to_i)
     to = from + 1.month
   elsif match[:hour].nil?
     from = Time.gm(
        match[:year].to_i,
        match[:month].to_i,
        match[:day].to_i)
     to = from + 1.day
   elsif match[:min].nil?
     from = Time.gm(
        match[:year].to_i,
        match[:month].to_i,
        match[:day].to_i,
        match[:hour].to_i)
     to = from + 1.hour
   elsif match[:sec].nil?
     from = Time.gm(
        match[:year].to_i,
        match[:month].to_i,
        match[:day].to_i,
        match[:hour].to_i,
        match[:min].to_i)
     to = from + 1.minute
   else
     from = Time.gm(
        match[:year].to_i,
        match[:month].to_i,
        match[:day].to_i,
        match[:hour].to_i,
        match[:min].to_i,
        match[:sec].to_i)
     to = from + 1.second
   end
  return from, to
  end

  def self.build_scope(klass, model, params)
    model = model.order(params[:order_by])
    #Rails.logger.debug "order by:#{params[:order_by]} limit:#{params[:limit]} key:#{params[:key]}"
    model = model.limit(params[:limit]) unless params[:limit].nil?

    unless params[:filters].nil?
      params[:filters].each do |f|
        f.each do |k,v|
          #Rails.logger.debug "p: #{params[:filters]} f: #{f} k,v: #{k} #{v} klass: #{klass} h: #{klass.columns_hash[k.to_s].type}"
          syntax = {}
          case klass.columns_hash[k].type
          when :datetime
            syntax = DATE_SYNTAX
          when :integer
            syntax = INTEGER_SYNTAX
          else
            syntax = STRING_SYNTAX
          end
          syntax.each do |rk,rv|
            m = rk.match(v)
            if (m)
              model = rv.call(model, k, m)
              break
            end
          end
        end
      end
    end

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

      case klass.columns_hash[k.to_s].type
      when :datetime
        keys[k] = Time.parse(params[:key][k])
      when :integer
        keys[k] = params[:key][k].to_i
      else
        keys[k] = params[:key][k]
      end

      if where.blank?
        where += "(#{k} #{op} :#{k})"
        orc += "(#{k} = :#{k})"
      else
        where += " OR (#{orc} AND (#{k} #{op} :#{k}))"
        orc += "AND (#{k} = :#{k})"
      end
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

          unless params[:filters].nil?
            h = []
            params[:filters].each do |i,f|
              f.each do |k,v|
                k = k.to_s.underscore
                h << {k => v}
              end
            end
            params[:filters] = h
          end
          
          opts.merge! params
        end
        return RestScroll::build_scope(self, all, opts)
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
