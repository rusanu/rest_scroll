(function(window, Ember, $) {
  var RestScroll = {};

  RestScroll.ArrayProxyMixin = Ember.Mixin.create({
   loadMore: function() {
      var res = this.get('resourceName');
      var lastItem = this.get('lastObject');
      var params = {}
      params.order_by = this.get('orderBy');
      params.filters = this.get('filters');
      if (lastItem) {
        params.key = {};
        for(field in params.order_by) {
          var value = lastItem.get(field);
          switch(Ember.typeOf(value)) {
          case 'date':
            params.key[field] = moment(value).toJSON();
            break;
          default:
            params.key[field] = value;
            break;
          }
        }
        params.key['id'] = lastItem.get('id');
      }
      var _this = this;
      this.set('loading', true);
      this.set('error', undefined);
      // Ember.Logger.debug('APM:loadMore: resource: ', res, 
      //  ' lastItem:', this.get('lastObject'),
      //  ' params:', params);
      return this.get('store').find(res, {rest_scroll: params}).then(
        function(items) {
          _this.set('loading', false);
          var content = items.get('content');
          // Ember.Logger.debug('loadMore: then: ', items, ' content:', content);
          if (content.length) {
            _this.pushObjects(content);
            _this.set('hasMore', true);
          }
          else {
            _this.set('hasMore', false);
          }
          return _this;
        },
        function(error) {
          _this.set('loading', false);
          _this.set('error', "Error: %@(%@): %@".fmt(error.status, error.statusText, error.responseText));
          _this.set('hasMore', false);
        }
      );
    },
    addOrderBy: function(field, asc) {
      // Ember.Logger.debug('APM: addOrderBy: ', field, asc);
      var orderBy = this.get('orderBy');
      orderBy[field] = asc;
      return this.refreshOrderBy(orderBy);
    },
    removeOrderBy: function(field) {
      // Ember.Logger.debug('APM: removeOrderBy: ', field);
      var orderBy = this.get('orderBy');
      delete orderBy[field];
      return this.refreshOrderBy(orderBy);
    },
    refreshOrderBy: function(orderBy) {
      this.set('orderBy', orderBy);
      Ember.propertyDidChange(this, 'orderBy');
      this.set('content', Em.A());
      return this.loadMore();
    },
    addFilter: function(field, value) {
      var filters = this.get('filters');
      var newFilter = {}
      newFilter[field] = value;
      filters.push(newFilter);
      this.refreshFilters(filters);
    },
    removeFilter: function(index) {
      var filters = this.get('filters');
      filters.splice(index, 1);
      this.refreshFilters(filters);
    },
    refreshFilters: function(filters) {
      this.set('filters', filters);
      Ember.propertyDidChange(this, 'filters');
      this.set('content', Em.A());
      return this.loadMore();
    }

  });

  RestScroll.RouteMixin = Ember.Mixin.create({
    resource: undefined,
    loadedItems: undefined,
    getItems: function() {
      
      var loadedItems = this.get('loadedItems');
      // Ember.Logger.debug('getItems: ', loadedItems);
      if (loadedItems)
        return loadedItems;

      loadedItems = Em.ArrayProxy.createWithMixins(
        RestScroll.ArrayProxyMixin, {
        orderBy: {},
        filters: [],
        loading: false, 
        hasMore: true,
        resourceName: this.get('resource'),
        store: this.get('store'),
        content: Em.A()});

      return loadedItems.loadMore();
    },
    actions: {
      willTransition: function(transition) {
        // Ember.Logger.debug("willTransition: ", transition);
        var controller = this.controllerFor(this.routeName);
        var loadedItems = controller.get('content');
        this.set('loadedItems', loadedItems);
        return true;
      }
    }
  });

  RestScroll.ControllerMixin = Ember.Mixin.create({
    actions: {
      getMore: function() {
        // Ember.Logger.debug("controller: getMore");
        if (this.get('content.loading')) return;
        this.get('content').loadMore();
      },
      addOrderBy: function(field, asc) {
        // Ember.Logger.debug("controller: addOrderBy: ", field, asc);
        this.get('content').addOrderBy(field, asc);
      },
      removeOrderBy: function(field) {
        // Ember.Logger.debug("controller: removeOrderBy: ", field);
        this.get('content').removeOrderBy(field);
      },
      addFilter: function(fieldName, value) {
        this.get('content').addFilter(fieldName, value);
      },
      removeFilter: function(index) {
        this.get('content').removeFilter(index);
      }
    },
  });

  RestScroll.ToggleSortView = Ember.View.extend({
    layout: Ember.Handlebars.compile(
      "{{yield}} \
      {{#if view.canFilter}} \
        {{scroll-filter class=\"pull-rigth\" tagName=\"span\" fieldName=view.fieldName}} \
      {{/if}} \
      <a href=\"#\" {{action toggleSort target=\"view\" class=\"pull-right\"}}> \
        <span  {{bind-attr class=\":glyphicon view.icon\"}}></span> \
      </a>"),

    getAsc: function () {
      var orderBy = this.get('controller.content.orderBy');
      var fieldName = this.get('fieldName');
      var asc = orderBy[fieldName];
      // Ember.Logger.debug('getAsc: ', orderBy, fieldName, asc);
      return asc;
    },

    icon: function() {
      // Ember.Logger.debug('icon: ', this.get('fieldName'));
      var asc = this.getAsc();
      switch(asc) {
      case undefined: return "glyphicon-sort";
      case 'asc': return "glyphicon-sort-by-attributes";
      case 'desc': return "glyphicon-sort-by-attributes-alt";
      }
    }.property('controller.content.orderBy'),

    actions:  {
      toggleSort: function() {
        // Ember.Logger.debug("ToggleSortView: toggleSort: ", this.get('fieldName'), ' ascending:', this.get('ascending'));
        var asc = this.getAsc();
        var action = 'addOrderBy';
        switch(asc) {
        case undefined:
          asc = 'asc';
          break;
        case 'asc':
          asc = 'desc';
          break;
        case 'desc':
          action = 'removeOrderBy';
          break;
        }
        this.get('controller').send(action, this.get('fieldName'), asc);
      }
    }
  });

  Ember.Handlebars.helper('toggle-sort', RestScroll.ToggleSortView);

  Handlebars.registerHelper("debug", function(optionalValue) {
    Ember.Logger.debug(this, optionalValue, this.get(optionalValue));
  });

  RestScroll.FilterItemView = Ember.View.extend({
    tagName: 'span',
    classNames: ['label', 'label-default'],
    template: Ember.Handlebars.compile(
        "{{view.content.filterText}} \
          <a href=\"#\" {{action removeFilter target=\"view\"}}> \
            <span class=\"glyphicon glyphicon-remove\"></span> \
          </a>"),
    actions: {
      removeFilter: function() {
        this.get('controller').send('removeFilter', this.get('content.filterIndex'));
      }
    }
  });

  RestScroll.FiltersCollectionView = Ember.CollectionView.extend({
 //   tagName: 'ul',
    itemViewClass: 'RestScroll.FilterItemView',
  });

  RestScroll.ScrollFilterView = Ember.View.extend({

    showFilter: false,

    fieldFilters: function() {
      var fieldName = this.get('fieldName');
      // Ember.Logger.debug('fieldFilters:', fieldName);
      var filters = this.get('controller.content.filters');
      var fieldFilters = [];
      var index;
      for(index = 0; index < filters.length; ++index) {
        item = filters[index];
        if (item[fieldName]) {
          fieldFilters.push(Ember.Object.create({
            filterIndex: index,
            filterText: item[fieldName]
          }));
        }
      }
      return fieldFilters;
    }.property('controller.content.filters').cacheable(),

    template: Ember.Handlebars.compile(
      "{{#if view.showFilter}} \
         {{input action=\"addFilter\" targetObject=view placeholder=\"Add filter\"}} \
         <a href=\"#\" {{action cancelFilter target=\"view\"}}> \
           <span class=\"glyphicon glyphicon-remove\"></span> \
         </a> \
       {{else}} \
         <a href=\"#\" {{action showFilter target=\"view\"}}> \
           <span class=\"glyphicon glyphicon-filter\"></span> \
         </a> \
       {{/if}} \
       {{view RestScroll.FiltersCollectionView contentBinding=\"view.fieldFilters\"}} \
       "),
    actions: {
      showFilter: function() {
        this.set('showFilter', true);
      },
      addFilter: function(value) {
        //Ember.Logger.debug("addFilter: ", this.get('fieldName'), "value: ", value);
        this.get('controller').send('addFilter', this.get('fieldName'), value);
        this.set('showFilter', false);
      },
      cancelFilter: function() {
        this.set('showFilter', false);
      }
    }
  });

  Ember.Handlebars.helper('scroll-filter', RestScroll.ScrollFilterView);

  RestScroll.LoadMoreView = Ember.View.extend({
    didInsertElement: function() {
      var _controller = this.get('controller');
      // Ember.Logger.debug("LoadMoreView: didInsertElement");
      this.$().bind('inview', 
        function(event, isInView, visibleX, visibleY) {
          // Ember.Logger.debug("inview: ", isInView, ' hasMore:', _controller.get('content.hasMore'));
          if (isInView && _controller.get('content.hasMore')) {
            _controller.send('getMore');
          }
        });
    }
  });

  window.RestScroll = RestScroll;
})(this, Ember, jQuery);
