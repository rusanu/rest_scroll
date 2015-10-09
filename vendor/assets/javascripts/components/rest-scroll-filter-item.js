
  Bugcollect.RestScrollFilterItemComponent = Ember.Component.extend({
    tagName: 'span',
    classNames: ['label', 'label-default'],
    actions: {
      removeFilter: function() {
        this.get('target').send('removeFilter', this.get('item.filterIndex'));
      }
    }
  });
