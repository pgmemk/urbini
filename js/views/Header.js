define([
  'globals',
  'cache!jquery',
  'cache!jqueryMobile', 
  'cache!underscore', 
  'cache!backbone', 
  'cache!templates',
  'cache!events', 
  'cache!utils',
  'cache!views/BasicView'
], function(G, $, __jqm__, _, Backbone, Templates, Events, U, BasicView) {
  return BasicView.extend({
    template: 'headerTemplate',
    initialize: function(options) {
      _.bindAll(this, 'render', 'makeWidget', 'makeWidgets');
      this.constructor.__super__.initialize.apply(this, arguments);
      
      var res = this.resource || this.collection;
      _.extend(this, options);
      this.template = _.template(Templates.get(this.template));
      if (typeof this.pageTitle === 'undefined') {
        var hash = window.location.hash && window.location.hash.slice(1);
        if (hash && G.tabs) {
          decHash = decodeURIComponent(hash);
          var matches = _.filter(G.tabs, function(t) {return t.mobileUrl == hash || decodeURIComponent(t.mobileUrl) == decHash});
          if (matches.length)
            this.pageTitle = matches[0].title;
        }
        
        if (!this.pageTitle) {
          if (hash) {
            var params = U.getQueryParams(hash);
            this.pageTitle = params.$title;
//            var v = hash.split('&');
//            for (var i=0; i<v.length; i++) {
//              var a = v[i].split('=');
//              if (a[0] == '$title')
//                this.pageTitle = a[1];
//            }
          }
          if (!this.pageTitle) {
            if (res instanceof Backbone.Collection) 
              this.pageTitle = U.getPlural(res);
            else {
              this.pageTitle = res.get('davDisplayName');
              if (!this.pageTitle) 
                this.pageTitle = U.getDisplayName(res);
            }
          }
        }
      }
      
      this.$el.prevObject.attr('data-title', this.pageTitle);
      return this;
    },
    makeWidget: function(options) {
      var w = options.widget;
      if (typeof w != 'function') {
        w.render({append: true});
        return;
      }
      
      var res = this.resource || this.collection;
      w = new w({model: res, el: this.$(options.id)}).render({append: true});
      w.$(options.domEl).addClass(options.css);
      w.$el.trigger('create');
      return this;
    },
    makeWidgets: function(wdgts, options) {
      for (var i = 0; i < wdgts.length; i++) {
        options.widget = wdgts[i];
        this.makeWidget(options);
      }
      
      return this;
    },
    render: function() {
      if (window.location.hash.indexOf("#menu") != -1)
        return this;
      this.$el.html(this.template());
      var l = this.buttons.left;
      l && this.makeWidgets(l, {domEl: 'li', id: '#headerUl'}); //, css: 'ui-btn-left'});
     
      var r = this.buttons.right;
      r && this.makeWidgets(r, {domEl: 'li', id: '#headerUl'}); //, css: 'ui-btn-right'});
      
      var log = this.buttons.log;
      log && this.makeWidgets(log, {domEl: 'li', id: '#headerUl'}); //, css: 'ui-btn-right'});
      return this;
    }
  });
});
