

RestScrollArrayProxyMixin = Ember.Mixin.create({
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
      return this.get('store').query(res, {rest_scroll: params}).then(
        function(items) {
          _this.set('loading', false);
          var content = items.get('content');
          // Ember.Logger.debug('loadMore: then: ', items, ' content:', content);
          if (content.length) {
            // Must map the content to get the record, ember-data return an array of InternalModel
            //
            content = content.map(function(r)
            {
              return r.record;
            });
            _this.pushObjects(content);
            _this.set('hasMore', true);
          }
          else {
            _this.set('hasMore', false);
          }
          return _this;
        },
        function(error) {
          Ember.Logger.error(error);
          _this.set('loading', false);
          if (error.status)
          {
            _this.set('error', "Error: %@(%@): %@".fmt(error.status, error.statusText, error.responseText));
          }
          else
          {
            _this.set('error', error.toString());
          }
          _this.set('hasMore', false);
          if (Ember.onerror)
            Ember.onerror(error);
          return _this;
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
