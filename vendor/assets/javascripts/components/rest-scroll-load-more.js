
  RestScrollLoadMoreComponent = Ember.Component.extend({
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
