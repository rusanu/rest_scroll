
RestScrollRouteMixin = Ember.Mixin.create({
    resource: undefined,
    loadedItems: undefined,
    getItems: function() {
      
      var loadedItems = this.get('loadedItems');
      // Ember.Logger.debug('getItems: ', loadedItems);
      if (loadedItems)
        return loadedItems;

      loadedItems = Em.ArrayProxy.extend(
        RestScrollArrayProxyMixin, {
        orderBy: {},
        filters: [],
        loading: false, 
        hasMore: true,
        resourceName: this.get('resource'),
        store: this.get('store'),
        content: Em.A()}).create();

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
