

Bugcollect.RestScrollToggleSortComponent = Ember.Component.extend({
  getAsc: function () {
    var orderBy = this.get('target.content.orderBy');
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
  }.property('target.content.orderBy'),

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
      this.get('target').send(action, this.get('fieldName'), asc);
    }
  }
});
