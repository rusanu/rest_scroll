(function(window, Ember, $) {
  var RestScroll = {};
  RestScroll.RouteMixin = Ember.Mixin.create({
    resource: null,
    order_by: {
      id: 'asc'
    },
    last_item: null,
    loadMore: function() {
      var res = this.get('resource');
      var lastItem = this.get('last_item');
      var params = {}
      if (lastItem) {
        params.key = lastItem.get('id');
      }
      var _this = this;
      Ember.Logger.info('loadMore: resource: ', res, 
        ' last_item:', this.get('last_item'),
        ' params:', params);
      return this.get('store').find(res, {rest_scroll: params}).then(
        function(items) {
            var content = items.get('content');
            Ember.Logger.info('loadMore: then: ', items, ' content:', content);
            if (content.length > 0) {
              var lastItem = content[content.length - 1];
              _this.set('last_item', lastItem);
              Ember.Logger.info('last_item: set:', lastItem);
            }
            return content;
        });
    },
    actions: {
      getMore: function() {
        Ember.Logger.info("getMore:", this);
        var _this = this;
        this.loadMore().then(
          function(items) {
            var c = _this.controllerFor(_this.routeName);
            c.gotMore(items);
          });
      }
    }
  });

  RestScroll.ControllerMixin = Ember.Mixin.create({
    loadingMore: false,
    actions: {
      getMore: function() {
        Ember.Logger.info("controller: getMore");
        if (this.get('loadingMore')) return;
        this.set('loadingMore', true);
        this.get('target').send('getMore');
      },
    },
    gotMore: function(items) {
        Ember.Logger.info("controller: gotMore");
        this.set('loadingMore', false);
        this.pushObjects(items);
      }
    
  });

  window.RestScroll = RestScroll;
})(this, Ember, jQuery);
