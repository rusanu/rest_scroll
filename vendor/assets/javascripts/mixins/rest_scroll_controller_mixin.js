
RestScrollControllerMixin = Ember.Mixin.create({
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
