# RestScroll

End-to-end scrolling for an Ember app backed by Rails.

## Installation

Add this line to your application's Gemfile:

    gem 'rest_scroll'

And then execute:

    $ bundle

Or install it yourself as:

    $ gem install rest_scroll

## Usage

In your Rails controller:

```(ruby)  
  def index
    respod_with Post.rest_scoll(params[:rest_scroll])
  end
```

In application.js
```(ruby)
/= require ember_rest_scroll
```

In your Ember route:

```(javascript)
App.PostsRoute = Ember.Route.extend(
   RestScroll.RouteMixin,
   {
     resource: 'post',
     model: function() {
       return this.getItems();
     }
   });
```

In your Ember controller:

```(javascript)
App.PostsController = Ember.ArrayController.extend(
  RestScroll.ControllerMixin,
  {
  });
```

To add a sorting header in your view:

```(handlebars)
<table>
<thead>
<tr>
{{#toggle-sort tagName='th' fieldName='postTime'}}Post Time{{/toggle-sort}} 
{{#toggle-sort tagName='th' fieldName='author'}}Author{{/toggle-sort}}
...
 
```

To add a Get More button with infinite scroll, add this in the Ember view at the bottom of the page (eg. after the table):

```(handlebars)
{{#if content.loading}}
  <span class="text-muted">Loading more...</span>
{{else}}   
  {{#view RestScroll.LoadMoreView}}
    <a href="#" {{action 'getMore'}}>Get More...</a>   
  {{/view}}   
  {{#if content.error}}   
    <span class="text-danger">{{content.error}}</span>
  {{/if}} 
{{/if}} 
```

TODO

## Contributing

1. Fork it
2. Create your feature branch (`git checkout -b my-new-feature`)
3. Commit your changes (`git commit -am 'Add some feature'`)
4. Push to the branch (`git push origin my-new-feature`)
5. Create new Pull Request
