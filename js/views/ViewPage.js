define([
  'globals',
  'jquery',
  'underscore',
  'backbone',
  'utils',
  'events',
  'templates',
  'vocManager',
  'views/BasicView',
  'views/Header',
  'views/BackButton',
  'views/LoginButtons',
  'views/AroundMeButton',
  'views/MenuButton',
  'views/PublishButton',
  'views/MenuPanel',
  'views/ResourceView',
  'views/ResourceImageView',
  'views/ControlPanel'
], function(G, $, _, Backbone, U, Events, Templates, Voc, BasicView, Header, BackButton, LoginButtons, AroundMeButton, MenuButton, PublishButton, MenuPanel, ResourceView, ResourceImageView, ControlPanel) {
  return BasicView.extend({
    tagName: 'a',
    clicked: false,
    initialize: function(options) {
      _.bindAll(this, 'render', 'click', 'home', 'swipeleft', 'swiperight', 'edit');
      this.constructor.__super__.initialize.apply(this, arguments);
  //    this.model.on('change', this.render, this);
      this.template = _.template(Templates.get('resource'));
      this.TAG = "ViewPage";
      this.router = G.Router || Backbone.History;
      this.viewId = options.viewId;
      Events.on("mapReady", this.showMapButton);
    },
    events: {
      'click #edit': 'edit',
      'click': 'click',
      'click #homeBtn': 'home',
      'swiperight': 'swiperight',
      'swipeleft': 'swipeleft'
    },
    swipeleft: function(e) {
      // open backlinks
      G.log(this.TAG, 'events', 'swipeleft');
    },
    swiperight: function(e) {
      // open menu
      G.log(this.TAG, 'events', 'swiperight');
//      G.Router.navigate('menu/' + U.encode(window.location.hash.slice(6)), {trigger: true, replace: false});
//      var menuPanel = new MenuPanel({viewId: this.cid, model: this.model});
//      menuPanel.render();
    },
    home: function() {
//      this.router.navigate(G.homePage, {trigger: true, replace: false});
      var here = window.location.href;
      window.location.href = here.slice(0, here.indexOf('#'));
      return this;
    },
    edit: function(e) {
      e.preventDefault();
      this.router.navigate('edit/' + U.encode(this.resource.get('_uri')), {trigger: true, replace: false});
      return this;
    },
//    tap: function() {
//      G.log(this.TAG, 'events');
//      return Events.defaultTapHandler.apply(this, arguments);
//    },
//    click: Events.defaultClickHandler,  
    click: function(e) {
      clicked = true;
      Events.defaultClickHandler(e);  
    },

    render:function (eventName) {
      G.log(this.TAG, "render");
      var res = this.resource;
      var json = res.attributes;
      json.viewId = this.cid;
      this.$el.html(this.template(json));
      
      var isGeo = (res.isA("Locatable") && res.get('latitude')) || 
                  (res.isA("Shape") && res.get('shapeJson'));
      this.buttons = {
          left: [BackButton],
          right: isGeo ? [AroundMeButton, MenuButton] : [MenuButton], // no need MapItButton? nope
          log: [LoginButtons]
      };
      if (!G.currentUser.guest  &&  U.isAssignableFrom(res.vocModel, "App", Voc.typeToModel)) {
        var user = G.currentUser._uri;
        var appOwner = res.get('creator');
        if (user == appOwner  &&  (!res.get('lastDeployed')  ||  res.get('modified') > res.get('lastDeployed')))
          this.hasPublish = true;
      }
      
      this.header = new Header({
        model: res, 
//        pageTitle: this.pageTitle || res.get('davDisplayName'), 
        buttons: this.buttons,
        viewId: this.cid,
        doPublish: this.hasPublish,
        el: $('#headerDiv', this.el)
      }).render();
      
      this.header.$el.trigger('create');      
      this.imageView = new ResourceImageView({el: $('div#resourceImage', this.el), model: res});
      this.imageView.render();
      this.view = new ResourceView({el: $('ul#resourceView', this.el), model: res});
      this.view.render();
      this.cp = new ControlPanel({el: $('ul#cpView', this.el), model: res});
      this.cp.render();
      if (G.currentUser.guest) {
        this.$('#edit').hide();
      }
      
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      this.rendered = true;
      return this;
    }
  }, {
    displayName: 'ViewPage'
  });
});
