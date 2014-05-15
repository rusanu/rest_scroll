(function(window, Ember, $) {
  var RestScroll = {};
  RestScroll.RouteMixin = Ember.Mixin.create({
    resource: null,
    order_by: {
      id: 'asc'
    },
    lastItem: null,
    loadedItems: null,
    getItems: function() {
      var loadedItems = this.get('loadedItems');
      Ember.Logger.debug('getItems: ', loadedItems);
      if (loadedItems)
        return loadedItems;
      this.set('lastItem', null);
      return this.loadMore();
    },
    loadMore: function() {
      var res = this.get('resource');
      var lastItem = this.get('lastItem');
      var params = {}
      params.order_by = this.get('order_by');
      if (lastItem) {
        params.key = {};
        for(field in params.order_by) {
          var value = lastItem.get(field);
          switch(Ember.typeOf(value)) {
          case 'date':
            params.key[field] = moment(value).toISOString();
            break;
          default:
            params.key[field] = value;
            break;
          }
        }
        params.key['id'] = lastItem.get('id');
      }
      var _this = this;
      Ember.Logger.debug('loadMore: resource: ', res, 
        ' lastItem:', this.get('lastItem'),
        ' params:', params);
      return this.get('store').find(res, {rest_scroll: params}).then(
        function(items) {
            var content = items.get('content');
            Ember.Logger.debug('loadMore: then: ', items, ' content:', content);
            if (content.length > 0) {
              var lastItem = content[content.length - 1];
              _this.set('lastItem', lastItem);
              Ember.Logger.debug('lastItem: set:', lastItem);
            }
            return content;
        });
    },
    actions: {
      getMore: function() {
        Ember.Logger.debug("getMore:", this);
        var _this = this;
        this.loadMore().then(
          function(items) {
            var c = _this.controllerFor(_this.routeName);
            c.gotMore(items);
          });
      },
      orderBy: function(field) {
        Ember.Logger.debug('route: orderBy: ', field);
        var orderBy = {}
        orderBy[field] = 'asc';
        this.set('order_by', orderBy);
        this.set('lastItem', null);
        var _this = this;
        this.loadMore().then(function(items) {
          Ember.Logger.debug('route:orderBy:then: ', items);
          var controller = _this.controllerFor(_this.routeName);
          controller.set('content', items);
        });
      },
      willTransition: function(transition) {
        Ember.Logger.debug("willTransition: ", transition);
        var controller = this.controllerFor(this.routeName);
        var loadedItems = controller.get('content');
        this.set('loadedItems', loadedItems);
        return true;
      }
    }
  });

  RestScroll.ControllerMixin = Ember.Mixin.create({
    loadingMore: false,
    hasMore: true,
    actions: {
      getMore: function() {
        Ember.Logger.debug("controller: getMore");
        if (this.get('loadingMore')) return;
        this.set('loadingMore', true);
        this.get('target').send('getMore');
      },
      orderBy: function(field) {
        Ember.Logger.debug("controller: orderBy: ", field);
        this.get('target').send('orderBy', field);
        this.set('hasMore', true);
      }
    },
    gotMore: function(items) {
        Ember.Logger.debug("controller: gotMore");
        this.set('loadingMore', false);
        if (items.length) {
          this.pushObjects(items);
          this.set('hasMore', true);
        }
        else {
          this.set('hasMore', false);
        }
      }
    
  });

  RestScroll.ToggleSortView = Ember.View.extend({
    layout: Ember.Handlebars.compile(
      "{{yield}} <a href=\"#\" {{action orderBy target=\"view\"}}><span class=\"glyphicon glyphicon-sort\"></span></a>"),
    actions:  {
      orderBy: function() {
        Ember.Logger.debug("ToggleSortView: orderBy: ", this.get('fieldName'));
        var controller = this.get("controller");
        controller.send('orderBy', this.get('fieldName'));
      }
    }
  });

  RestScroll.LoadMoreView = Ember.View.extend({
    didInsertElement: function() {
      var _controller = this.get('controller');
      Ember.Logger.debug("LoadMoreView: didInsertElement");
      this.$().bind('inview', 
        function(event, isInView, visibleX, visibleY) {
          Ember.Logger.debug("inview: ", isInView, ' hasMore:', _controller.get('hasMore'));
          if (isInView && _controller.get('hasMore')) {
            _controller.send('getMore');
          }
        });
    }
  });

  window.RestScroll = RestScroll;
})(this, Ember, jQuery);
