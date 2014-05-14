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
      if (lastItem) {
        params.key = lastItem.get('id');
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
    },
    gotMore: function(items) {
        Ember.Logger.debug("controller: gotMore");
        this.set('loadingMore', false);
        if (items.length) {
          this.pushObjects(items);
        }
        else {
          this.set('hasMore', false);
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
