
  Bugcollect.RestScrollFilterComponent = Ember.Component.extend({

    showFilter: false,
  
    fieldFilters: function() {
      var fieldName = this.get('fieldName');
      var filters = this.get('target.content.filters');
      var fieldFilters = Ember.A();
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
      // Ember.Logger.debug('fieldFilters:', fieldName, fieldFilters, filters);
      return fieldFilters;
    }.property('target.content.filters'),

    actions: {
      showFilter: function() {
        this.set('showFilter', true);
      },
      addFilter: function(value) {
        //Ember.Logger.debug("addFilter: ", this.get('fieldName'), "value: ", value);
        this.get('target').send('addFilter', this.get('fieldName'), value);
        this.set('showFilter', false);
      },
      cancelFilter: function() {
        this.set('showFilter', false);
      }
    }
  });
