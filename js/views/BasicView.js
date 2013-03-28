//'use strict';
define([
  'globals',
  'jquery',
  'backbone',
  'utils',
  'templates',
  'events'
], function(G, $, Backbone, U, Templates, Events) {
  var basicOptions = ['source', 'parentView', 'returnUri'];
  var BasicView = Backbone.View.extend({
    initialize: function(options) {
      options = options || {};
      this._loadingDfd = new $.Deferred();
      this._loadingDfd.promise().done(function() {
        this.rendered = true;
      }.bind(this));
      
      this._templates = [];
      this._templateMap = {};
      _.extend(this, _.pick(options, basicOptions));
      var res = this.data = this.model;
      if (this.model instanceof Backbone.Collection) {
        this.collection = res;
        this.vocModel = res.model;
      }
      else {
        this.resource = res;        
        this.collection = res.collection;
        this.vocModel = res.constructor;
        res.on('modelChanged', function() {
          this.vocModel = res.vocModel;
        }.bind(this));
      }
      
      this.router = G.Router || Backbone.history;
      Events.on('templateUpdate', function(template) {
        var dClUri = template.get('modelDavClassUri');
        if (!dClUri)
          return;
        
        var type = U.getTypeUri(dClUri);
        if (U.getTypes(this.vocModel).indexOf(type) == -1)
          return;
        
        var templateName = template.get('templateName');
        this.makeTemplate(templateName, this._templateMap[templateName]);
        this.refresh();
      }.bind(this));

      var render = this.render;
      var refresh = this.refresh;
      this.render = function() {
        if (!this.isPanel && !this.isActive()) {
         // to avoid rendering views 10 times in the background. Render when it's about to be visible
          this.dirty = arguments; 
          return false;
        }
        else {
          if (!this.TAG)
            debugger;
          
          G.log(this.TAG, 'render', 'view is active, rendering');
          return render.apply(this, arguments);
        }
      }.bind(this);
      
      this.on('active', function(active) {
        this.active = active;
        _.each(this.children, function(child) {
          child.trigger('active', active);
        });
        
        if (active && this.dirty) {
          var method = this.rendered ? refresh : render;
          method.apply(this, this.dirty);
        }        
      }.bind(this));
      
      return this;
    }
  }, {
    displayName: 'BasicView'
  });
  
  _.extend(BasicView.prototype, {
    refresh: function() {
      // override this
    },
    
    _getLoadingDeferreds: function() {
      return [this._loadingDfd].concat(_.pluck(this.getDescendants(), '_loadingDfd'));
    },
    
    isDoneLoading: function() {
      return _.all(this._getLoadingDeferreds(), function(c) {
        return c.isResolved() || c.isRejected();
      });
    },
    
    whenDoneLoading: function(callback) {
      $.when.apply($, this._getLoadingDeferreds()).then(callback);
    },
    
    finish: function() {
      this._loadingDfd.resolve();
    },
    
    getTemplate: function(templateName, type) {
      return Templates.get(templateName, type);
    },

    getOriginalTemplate: function(templateName) {
      return Templates.getOriginalTemplate(templateName);
    },

    makeTemplate: function(templateName, localName, type, dontFallBackToDefault) {
//      localName = localName || templateName;
      var template = this[localName] = U.template(templateName, type, this);
      if (!template) {
        if (!dontFallBackToDefault && type)
          return this.makeTemplate(templateName, localName);
        else
          return template;
      }
        
      U.pushUniq(this._templates, templateName);
      this._templateMap[templateName] = localName;
      return template;
    },  
    
    addChild: function(name, view) {
      this.children = this.children || {};
      this[name] = this.children[name] = view;
      view.parentView = view.parentView || this;
      return view;
    },
    
    getChildViews: function() {
      return this.children;
    },
    
    getDescendants: function() {
      if (!this.children)
        return [];
      else {
        var childViews = _.values(this.children);
        return _.union([], childViews, _.union.apply(_, _.map(childViews, function(child) {return child.getDescendants()})));
      }
    },
    
    isActive: function() {
      if (this.active)
        return true;
      
      var view = this.parentView;
      while (view) {
        if (view.active)
          return true;
        
        view = view.parentView;
      }
      
      return false;
    },
  
    isChildOf: function(view) {
      var parent = this.parentView;
      while (parent) {
        if (view === parent)
          return true;
        
        parent = parent.parentView;
      }
      
      return false;
    },
    
  //  assign: function (view, selector) {
  //    view.setElement(this.$(selector)).render();
  //  }
  
    assign: function (selector, view, renderOptions) {
      var selectors;
      if (_.isObject(selector)) {
        selectors = selector;
      }
      else {
        selectors = {};
        selectors[selector] = view;
      }
      
      if (!selectors) 
        return;
      
      _.each(selectors, function (view, selector) {
          view.setElement(this.$(selector)).render(renderOptions);
      }, this);
    },
    
    finalize: function () {
    },
    
    restyle: function() {
      this.$el.find('ul[data-role]').listview();
      this.$el.find('div[data-role="fieldcontain"]').fieldcontain();
      this.$el.find('button[data-role="button"]').button();
      this.$el.find('input,textarea').textinput();
//      this.$el.page();
    },
    
    showLoadingIndicator: function(timeout) {
      $.mobile.loading('show');
      // in case if fetch failed to invoke a callback
      // then hide loading indicator after 3 sec.
      if (timeout) {
        return timeoutId = setTimeout(function() {
          this.hideLoadingIndicator(timeoutId);
        }.bind(this), timeout);
      }
    },
    
    hideLoadingIndicator: function(timeoutId) {
      if (typeof timeoutId !== 'undefined')
        clearTimeout(timeoutId);
      
      $.mobile.loading('hide');
    }
  });

  return BasicView; 
});