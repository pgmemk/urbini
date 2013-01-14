define([
  'globals',
  'cache!jquery', 
  'cache!jqueryMobile',
  'cache!underscore', 
  'cache!backbone', 
  'cache!utils', 
  'cache!events', 
  'cache!error', 
  'cache!models/Resource', 
  'cache!collections/ResourceList', 
  'cache!vocManager',
  'cache!views/HomePage', 
  'cache!views/ListPage', 
  'cache!views/ViewPage'
//  , 
//  'cache!views/EditPage' 
], function(G, $, __jqm__, _, Backbone, U, Events, Error, Resource, ResourceList, Voc, HomePage, ListPage, ViewPage) {
//  var ListPage, ViewPage, MenuPage, EditPage; //, LoginView;
  var MenuPage, EditPage;
  var Router = Backbone.Router.extend({
//    ":type"           : "list", // e.g. app/ichangeme#<resourceType>
//    ":type/:backlink" : "list", // e.g. app/ichangeme#<resourceUri>/<backlinkProperty>
//    "view/*path"      : "view"  // e.g. app/ichangeme#view/<resourceUri>
    routes:{
      ""                : "home",
      ":type"           : "list", 
      "view/*path"      : "view",  
      "menu/*path"      : "menu", 
      "edit/*path"      : "edit", 
      "make/*path"      : "make", 
      "chooser/*path"   : "choose", 
      ":type/:backlink" : "list"
//      "login/*path"     : "login" 
    },

    CollectionViews: {},
    MkResourceViews: {},
    MenuViews: {},
    Views: {},
    EditViews: {},
    Models: {},
    Collections: {},
    Paginator: {},
    backClicked: false,
    forceRefresh: false,
    errMsg: null,
    homePage: null,
    info: null,
    viewsStack: [],
    urlsStack: [],
//    LoginView: null,
    initialize: function () {
      this.firstPage = true;
      homePage = new HomePage({el: $('div#homePage')});
      var self = this;
      Events.on('back', function() {
        self.backClicked = true;
      });
    },
    navigate: function(fragment, options) {
      this.forceRefresh = options.trigger;
      this.removeFromView = options.removeFromView;
      this.previousView = this.currentView;
      this.previousViewsCache = this.viewsCache;
      if (options) {
        this.errMsg = options.errMsg;
        this.info = options.info;
      }
      
      var ret = Backbone.Router.prototype.navigate.apply(this, arguments);
      this.forceRefresh = false;
      this.removeFromView = false;
      return ret;
    },
    
    route: function() {
      return Backbone.Router.prototype.route.apply(this, arguments);
    },
    
//    navigateDone: function() {
//      this.navigating = false;
//      this.backClicked = false;
//    },
//    wasBackClicked: function() {
//      return !this.navigating && !this.firstPage;
//    },
//    route: function() {
//      var async = Backbone.Router.prototype.route.apply(this, arguments);
//      // Our route functions return true if they performed an asynchronous page change
//      if (async === true)
//        this.navigateDone();
//      
//      return this;
//    },
    
    home: function() {
      if (this.backClicked) {
        this.currentView = this.viewsStack.pop();
        if (!this.currentView) {
          homePage.render();
          this.currentView = homePage;
          var idx = window.location.href.indexOf('#');
          this.currentUrl = (idx == -1) ? window.location.href : window.location.href.substring(0, idx);
        }
        else {
          this.currentUrl = this.urlsStack.pop();
//          if (!this.viewsStack.length)
//            this.currentView = $.mobile.firstPage;
        }
        $('div.ui-page-active #headerUl .ui-btn-active').removeClass('ui-btn-active');
        $.mobile.changePage(this.currentView.$el, {changeHash:false, transition: 'slide', reverse: true});
      }
      else {
        this.currentUrl = window.location.href;
        homePage.render();
        this.currentView = homePage;
      }
    },
    
    choose: function(path) {
      this.list.call(this, path, G.LISTMODES.CHOOSER);
    },
    
    /**
     * return true if page change will be asynchronous, false or undefined otherwise
     */
    list: function(oParams, mode) {
//      this.backClicked = this.wasBackClicked();
      if (!ListPage)
        return this.loadView('ListPage', this.list, arguments);
      
      var self = this;
      var params = oParams.split("?");
      var typeUri = U.getTypeUri(decodeURIComponent(params[0]), Voc);
      var className = U.getClassName(typeUri);
      var query = params.length > 1 ? params[1] : undefined;
      if (query) {
        var q = query.split("&");
        for (var i = 0; i < q.length; i++) {
          if (q[i] == "$page") {
            this.page = parseInt(q[i].split("=")[1]); // page is special because we need it for lookup in db
            q.remove(i);
            query = q.length ? q.join("&") : null;
            break;
          }
        }
      }
      
      var page = this.page = this.page || 1;
      var force = this.forceRefresh;
      
      if (!this.isModelLoaded(typeUri, 'list', arguments))
        return;
      
//      var t = className;  
//      var key = query ? t + '?' + query : t;
      var key = query || typeUri;
      this.Collections[typeUri] = this.Collections[typeUri] || {};
      this.viewsCache = this.CollectionViews[typeUri] = this.CollectionViews[typeUri] || {};
      var c = this.Collections[typeUri][key];
      if (c && !c._lastFetchedOn)
        c = null;
      
      var cView = this.CollectionViews[typeUri][key];
      if (c && cView) {
        this.currentModel = c;
        cView.setMode(mode || G.LISTMODES.LIST);
        this.changePage(cView, {page: page});
//        c.fetch({page: page});
        setTimeout(function() {c.fetch({page: page})}, 100);
        return this;
      }      
      
      var model = Voc.shortNameToModel[className] || Voc.typeToModel[typeUri];
      if (!model)
        return this;
      
      var list = this.currentModel = new ResourceList(null, {model: model, _query: query, _rType: className, _rUri: oParams });    
      var listView = new ListPage({model: list});
      
      this.Collections[typeUri][key] = list;
      this.CollectionViews[typeUri][key] = listView;
      listView.setMode(mode || G.LISTMODES.LIST);
      
      list.fetch({
//        update: true,
        sync: true,
        _rUri: oParams,
        success: function() {
          self.changePage(listView);
          Voc.fetchModelsForReferredResources(list);
          Voc.fetchModelsForLinkedResources(list.model);
//          self.loadExtras(oParams);
        }
      });
      
      return this;
    },
    
    menu: function() {
      if (!MenuPage)
        return this.loadView('MenuPage', this.menu, arguments);
      
      var c = this.currentModel;
      var id = c.id || c.url;
      this.viewsCache = this.MenuViews;
      var menuPage = this.MenuViews[id];
      if (!menuPage)
        menuPage = this.MenuViews[id] = new MenuPage({model: this.currentModel});
      
      this.changePage(menuPage);
    },

    loadView: function(view, caller, args) {
      var self = this;
      if (!eval(view)) {
        require(['cache!views/' + view], function(v) {
          eval(view + '=v;');
          caller.apply(self, args);
        });
      }
    },
    
    make: function(path) {
      if (!EditPage)
        return this.loadView('EditPage', this.make, arguments);
      
      var parts = path.split('?');
      var type = decodeURIComponent(parts[0]);
      if (!type.startsWith('http'))
        type = G.defaultVocPath + type;
      
      if (!this.isModelLoaded(type, 'make', arguments))
        return;
      
      var params = U.getHashParams();
      var makeId = params.makeId;
      var mPage = this.MkResourceViews[makeId];
      if (mPage && !mPage.model.get('_uri')) {
        // all good, continue making ur mkresource
      }
      else {
        mPage = this.MkResourceViews[makeId] = new EditPage({model: new Voc.typeToModel[type](), action: 'make', makeId: makeId});
      }
      
      this.viewsCache = this.MkResourceViews;
      this.currentModel = mPage.resource;
      mPage.set({action: 'make'});
      this.changePage(mPage);
    },

    edit: function(path) {
      if (!EditPage)
        return this.loadView('EditPage', this.edit, arguments);
      else
        this.view.call(this, path, true);
    },
    
    view: function (path, edit) {
      if (!edit && !ViewPage)
        return this.loadView('ViewPage', this.view, arguments);
      
      var views = this.viewsCache = this[edit ? 'EditViews' : 'Views'];
      var viewPageCl = edit ? EditPage : ViewPage;

      var params = U.getHashParams();
      var qIdx = path.indexOf("?");
      var uri, query;
      if (qIdx == -1) {
        uri = path;
        query = '';
      }
      else {
        uri = path.slice(0, qIdx);
        query = path.slice(qIdx + 1);
      }
      
      if (uri == 'profile') {
        var p = _.size(params) ? path.slice(qIdx + 1) : '';
        if (!G.currentUser.guest) {
          var other = U.slice.call(arguments, 1);
          other = other.length ? other : undefined;
          this.view(U.encode(G.currentUser._uri) + "?" + p, other);
        }
        else
          window.location.replace(G.serverName + "/register/user-login.html?errMsg=Please+login&returnUri=" + U.encode(window.location.href) + "&" + p);
        
        return;
      }
      
      uri = U.getLongUri(decodeURIComponent(uri), Voc);
      var typeUri = U.getTypeUri(uri, Voc);
      if (!this.isModelLoaded(typeUri, 'view', arguments))
        return;
      
      var className = U.getClassName(typeUri);
      var typeCl = Voc.shortNameToModel[className] || Voc.typeToModel[typeUri];
      if (!typeCl)
        return this;

//      if (!uri || !Voc.shortNameToModel[className]) {
//        Voc.loadStoredModels({models: [typeUri || className]});
//          
//        if (!uri || !Voc.shortNameToModel[className]) {
//          Voc.fetchModels(typeUri, 
//            {success: function() {
//              self.view.apply(self, [path]);
//            },
//            sync: true}
//          );
//          
//          return;
//        }
//      }
      
      var res = this.Models[uri];
      if (res && !res.loaded)
        res = null;
      
      var self = this;
      var collection;
      if (!res) {
        var collections = this.Collections[typeUri];
        if (collections) {
          var result = this.searchCollections(collections, uri);
          if (result) {
            collection = result.collection;
            res = this.Models[uri] = result.model;
          }
        }
      }
      
      if (res) {
        this.currentModel = res;
        this.Models[uri] = res;
        var v = views[uri] = views[uri] || new viewPageCl({model: res});
        this.changePage(v);
//        res.fetch({
//          success: function() {Voc.fetchModelsForLinkedResources(res)}
//        });
        setTimeout(res.fetch, 100);
        
        return this;
      }
      
//      if (this.Collections[typeUri]) {
//        var res = this.Models[uri] = this.Collections[typeUri].get(uri);
//        if (res) {
//          this.currentModel = res;
//          var v = views[uri] = new viewPageCl({model: res});
//          this.changePage(v);
//          return this;
//        }
//      }
//  
//      var typeCl = Voc.shortNameToModel[className];
//      if (!typeCl)
//        return this;
      
      var res = this.Models[uri] = this.currentModel = new typeCl({_uri: uri, _query: query});
      var v = views[uri] = new viewPageCl({model: res});
      var paintMap;
      var success = function(data) {
        self.changePage(v);
        Voc.fetchModelsForLinkedResources(res);
  //      self.loadExtras(oParams);
      }
      
      res.fetch({sync:true, success: success});
      return true;
    },
    
    /**
     * search a collection map for a collection with a given model
     * @return {collection: collection, model: model}, where collection is the first one found containing a model where model.get('_uri') == uri, or null otherwise
     * @param uri: uri of a model
     */
    searchCollections: function(collections, uri) {
      for (var query in collections) {
        var m = collections[query].get(uri);
        if (m) 
          return {collection: collections[query], model: m};
      }
      
      return null;
    },
/*    
    login: function() {
      console.log("#login page");
      if (!LoginView) {
        var args = arguments;
        var self = this;
        require(['cache!views/LoginButtons'], function(LV) {
          LoginView = LV;
          self.login.apply(self, args);
        })
        return;
      }
      if (!this.LoginView)
        this.LoginView = new LoginView();
      this.LoginView.showPopup();
    },
*/
    
    
//    loadExtras: function(params) {
//      if (params.length == 0)
//        return;
//      
//      paramToVal = {};
//      params = _.each(params.slice(1), 
//        function(nameVal) {
//          nameVal = nameVal.split("=");
//          paramToVal[nameVal[0]] = nameVal[1];
//        }
//      );
//      
//      params = paramToVal;
//      if (params["-map"] != 'y')
//        return;
//      
//      console.log("painting map");
//    },
    
    isModelLoaded: function(type, method, args) {
      var m = Voc.typeToModel[type];
      if (m)
        return m;

      var self = this;
      Voc.loadStoredModels({models: [type]});
      var allGood = Voc.fetchModels(null, { 
         success: function() {
           self[method].apply(self, args);
         },
         sync: true,
         skipSuccessIfUpToDate: true
      });
      
      return allGood;
    },
    
    checkErr: function() {
      var q = U.getQueryParams();
      var msg = q['-errMsg'] || q['-info'] || this.errMsg || this.info;
      if (msg)
        Error.errDialog({msg: msg});
      
      this.errMsg = null, this.info = null;
    },
    changePage: function(view) {
      try {
        this.changePage1(view);
//        this.navigateDone();
        return this;
      } finally {
        this.checkErr();
        if (this.removeFromView) {
          this.previousView && this.previousView.remove();
          var cache = this.previousViewsCache;
          if (cache) {
            var c = U.filterObj(cache, function(key, val) {return val === this.previousView});
            if (_.size(c))
              delete cache[U.getFirstProperty(cache)];
          }
          
          delete this.previousView;
        }
          
      }
    },
    changePage1: function(view) {
      if (view == this.currentView) {
        console.log("Not replacing view with itself");
        return;
      }
      
      var lostHistory = false;
      if (this.backClicked) {
        if (this.currentView instanceof Backbone.View  &&  this.currentView.clicked)
          this.currentView.clicked = false;
        this.currentView = this.viewsStack.pop();
        this.currentUrl = this.urlsStack.pop();
        if (this.currentView)
          view = this.currentView;
        else
          lostHistory = true;
      }
      
      var transition = "slide";
      if (!this.backClicked || lostHistory) {
        if (this.currentView instanceof Backbone.View  &&  this.currentView.clicked)
          this.currentView.clicked = false;
        // Check if browser's Back button was clicked
        else if (this.backClicked  &&  this.viewsStack.length != 0) {
          var url = this.urlsStack[this.viewsStack.length - 1];
          if (url == window.location.href) {
            this.currentView = this.viewsStack.pop();
            this.currentUrl = this.urlsStack.pop();
            view = this.currentView;
            this.backClicked = true;
          }
        }
        if (!this.backClicked  ||  lostHistory) {
          if (!view.rendered) {
            view.$el.attr('data-role', 'page'); //.attr('data-fullscreen', 'true');
            view.render();
          }
      
//          transition = "slide"; //$.mobile.defaultPageTransition;
          if (this.currentView  &&  this.currentUrl.indexOf('#menu') == -1) {
            this.viewsStack.push(this.currentView);
            this.urlsStack.push(this.currentUrl);
          }
          this.currentView = view;
          this.currentUrl = window.location.href;
        }
      }

      if (this.firstPage) {
        transition = 'none';
        this.firstPage = false;
      }
      
      // hot to transition
      var isReverse = false;
      if (this.backClicked == true) {
        this.backClicked = false;
        isReverse = true;
      }

      // back button: remove highlighting after active page was changed
      $('div.ui-page-active #headerUl .ui-btn-active').removeClass('ui-btn-active');

      // perform transition
      $.mobile.changePage(view.$el, {changeHash:false, transition: transition, reverse: isReverse || (MenuPage && view instanceof MenuPage)});
      Events.trigger('changePage', view);
//      if (this.backClicked)
//        $(window).resize();
//      if (this.backClicked == true) 
//        previousView.remove();
      return view;
    }
  });
  
  return Router;
});
