// Router
var documentReadyCount = 0;
var AppRouter = Backbone.Router.extend({

  routes:{
      ":type":"list",
      "view/*path":"view",
      "map/:type":"map"
  },
  l: {},
  v: {},
  resources: {},
  lists: {},
  backClicked: false,       
  initialize: function () {
    this.firstPage = true;
    $(document).on('click', 'a.back', function(event) {
      event.preventDefault();
      AppRouter.backClicked = true;
      window.history.back();
    });
  },

  map: function (type) {
    var self = this;
    this.mapModel = new Lablz.MapModel({url: Lablz.apiUrl + type});
    this.mapView = new Lablz.MapView({model: this.mapModel});
    this.mapModel.fetch({
      success: function() {
        self.changePage(self.mapView);
      }
    });    
  },

  list: function (type) {
//    Lablz.Navigation.push();
//    Lablz.Navigation.detectBackButton();
    if (this.lists[type] && this.l[type]) {
      this.lists[type].asyncFetch();
      this.changePage(this.l[type]);
      return this;
    }
    
    var model = Lablz.shortNameToModel[type];
    if (!model)
      return this;
    
    var params = type.split('&');
    var self = this;
    var list = this.lists[type] = new Lablz.ResourceList(null, {model: model});
    var listView = this.l[type] = new Lablz.ListPage({model: list});
    list.fetch({
      add: true, 
      success: function() {
        self.changePage(listView);
//          self.loadExtras(params);
      }
    });
    
    return this;
  },

  view: function (uri) {
//    Lablz.Navigation.push();
//    Lablz.Navigation.detectBackButton();
    uri = Utils.getLongUri(uri);
    var type = Utils.getType(uri);
    var res = this.resources[uri];
    if (!res) {
      var l = this.lists[type];
      res = l && l.get(uri);
    }
    
    if (res) {
      res.asyncFetch();
      this.resources[uri] = res;
      this.v[uri] = this.v[uri] || new Lablz.ViewPage({model: res});
      this.changePage(this.v[uri]);
      return this;
    }
    
    var self = this;
    if (this.lists[type]) {
      var res = this.resources[uri] = this.lists[type].get(uri);
      if (res) {
        this.v[uri] = new Lablz.ViewPage({model: res});
        this.changePage(this.v[uri]);
        return this;
      }
    }

    var typeCl = Lablz.shortNameToModel[type];
    if (!typeCl)
      return this;
    
    var res = this.resources[uri] = new typeCl({_uri: uri});
    var view = this.v[uri] = new Lablz.ViewPage({model: res});
    var paintMap;
    var success = function(data) {
      self.changePage(view);
//      self.loadExtras(params);
    }
    
		res.fetch({success: success});
		return this;
  },
  
  loadExtras: function(params) {
    if (params.length == 0)
      return;
    
    paramToVal = {};
    params = _.each(params.slice(1), 
      function(nameVal) {
        nameVal = nameVal.split("=");
        paramToVal[nameVal[0]] = nameVal[1];
      }
    );
    
    params = paramToVal;
    if (params["-map"] != 'y')
      return;
    
    console.log("painting map");
  },
  
  changePage: function(view) {
//    var backBtn = Lablz.Navigation.back;
//    Lablz.Navigation.reset();

//    console.log("change page: " + view.$el.tagName + view.$el.id);
    if (view == this.currentView) {
      console.log("Not replacing view with itself");
      return;
    }
    
//    if (this.currentView)
//      this.currentView.close();
  
//    $(selector).empty().append(view.render().el);
    view.$el.attr('data-role', 'page');
    if (!view.rendered) {
      view.render();
      $('body').append(view.$el);
    }

    this.currentView = view;
    if (this.firstPage) {
      transition = 'none';
      this.firstPage = false;
    }
    
    // hot to transition
    var isReverse = false;
    var transition = "slide"; //$.mobile.defaultPageTransition;
    if (AppRouter.backClicked == true) {
      AppRouter.backClicked = false;
      isReverse = true;
    }
    
    // perform transition
    $.mobile.changePage(view.$el, {changeHash:false, transition: transition, reverse: isReverse});
    return view;
  }
});

function init(success, error) {
  Lablz.initModels();
  var storeNames = [];
  for (var name in Lablz.shortNameToModel) {
    if (storeNames.push(name));
  }
  
//  var type = window.location.hash.substring(1);
//  if (type.indexOf("view") == 0) {
//    var firstSlash = type.indexOf("/");
//    var secondSlash = type.indexOf("/", firstSlash + 1);
//    type = type.slice(firstSlash + 1, secondSlash);
//  }
//  else {
//    var nonLetterIdx = type.search(/[^a-zA-Z]/);
//    type = nonLetterIdx == -1 ? type : type.slice(0, nonLetterIdx);
//  }
  
  Lablz.indexedDB.open(storeNames, null, success, error);
}

//window.addEventListener("DOMContentLoaded", init, false);
if (typeof jq != 'undefined')
  Backbone.setDomLibrary(jq);

$(document).ready(function () {
  console.log('document ready: ' + documentReadyCount++);
  tpl.loadTemplates();
  init(
      function() {
        //console.log('document ready: ' + documentReadyCount);
        app = new AppRouter();
        Backbone.history.start();
      },
      
      function(err) {
        console.log("failed to init app: " + err);
      }
  );
});

//    $.mobile.pushStateEnabled = false;
//});