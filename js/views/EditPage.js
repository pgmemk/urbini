//'use strict';
define([
  'globals',
  'jquery',
  'underscore',
  'utils',
  'events',
  'vocManager',
  'cache',
  'collections/ResourceList',
  'views/BasicView',
  'views/Header',
  'views/EditView',
  'views/ResourceImageView',
  'views/ResourceListView',
  'views/ControlPanel'
], function(G, $, _, U, Events, Voc, C, ResourceList, BasicView, Header, EditView, ResourceImageView, ResourceListView, ControlPanel) {
  var editParams = ['action', 'viewId'];//, 'backlinkResource'];
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'edit', 'home', 'swipeleft', 'swiperight', 'set', 'resetForm');
      this.constructor.__super__.initialize.apply(this, arguments);
  //    this.resource.on('change', this.render, this);
      this.makeTemplate('resourceEdit', 'template', this.vocModel.type);
      this.editOptions = _.extend({action: 'edit'}, _.pick(options, editParams));
      _.extend(this, this.editOptions);
      Events.on("mapReady", this.showMapButton);

      var res = this.resource;
  //    var json = res.toJSON();
  //    json.viewId = this.cid;
      var settings = {viewId: this.cid}
      if (U.isAssignableFrom(res, "AppInstall")) {
        settings.submit = 'Allow';
        settings.noCancel = true;
      }
      
      this.$el.html(this.template(settings));
      
      var isGeo = this.isGeo();
      this.buttons = {
        back: true,
        menu: true,
        rightMenu: !G.currentUser.guest,
        login: G.currentUser.guest
      };
    
      this.addChild('header', new Header({
        model: res, 
//        pageTitle: this.pageTitle || res.get('davDisplayName'), 
        buttons: this.buttons,
        viewId: this.cid,
        parentView: this,
        isEdit: true
      }));
      
      var reqParams = U.getParamMap(window.location.href);
      var editCols =  reqParams['$editCols'];
      if (!editCols) {
        this.addChild('imageView', new ResourceImageView({model: res}));
      }
      
      this.addChild('editView', new EditView(_.extend({model: res /*, backlinkResource: this.backlinkResource*/}, this.editOptions)));
      if (this.editParams)
        this.editView.set(this.editParams);
    },
    set: function(params) {
      _.extend(this, params);
      if (this.editView)
        this.editView.set(params);
      else
        this.editParams = params;
    },
    events: {
      'click #edit': 'edit',
//      'click': 'click',
      'click #homeBtn': 'home',
      'swiperight': 'swiperight',
      'swipeleft': 'swipeleft'
    },
    resetForm: function() {
      this.editView && this.editView.resetForm();
    },
    swipeleft: function(e) {
      // open backlinks
      G.log(this.TAG, 'events', 'swipeleft');
    },
    swiperight: function(e) {
      // open menu
      G.log(this.TAG, 'events', 'swiperight');
    },
    home: function() {
//      this.router.navigate('', {trigger: true, replace: false});
      var here = window.location.href;
      window.location.href = here.slice(0, here.indexOf('#'));
      return this;
    },
    edit: function(e) {
      Events.stopEvent(e);
      this.router.navigate(U.makeMobileUrl('edit', this.resource), {trigger: true, replace: true});
      return this;
    },

    render: function() {
      var views = {
        '#resourceEditView': this.editView,
        '#headerDiv'       : this.header
      };
      
      if (this.imageView)
        views['div#resourceImage'] = this.imageView;

      this.assign(views);      

      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      if (G.theme.backgroundImage) 
        this.$('#resourceEditView').css('background-image', 'url(' + G.theme.backgroundImage +')');

      // Comments inline
      var isComment = U.isAssignableFrom(this.vocModel, U.getLongUri1("model/portal/Comment"));
      if (!isComment) 
        return this;
      
      var self = this;
      var ranges = [];
      ranges.push(this.vocModel.type);
      var inlineLists = {};
      Voc.getModels(ranges).done(function() {
        var params = U.getParamMap(window.location.href);
        var type = self.vocModel.type;
        var listModel = U.getModel(type);
        var inlineList = C.getResourceList(self.vocModel, U.getQueryString(params, true));
        if (!inlineList) {
          inlineList = new ResourceList(null, {model: self.vocModel, params: params});
          inlineList.fetch({
            success: function() {
//              var currentlyInlined =  res.inlineLists || {};
//              if (inlineList.size() && !res._settingInlineList) && !currentlyInlined[name]) {
//                res.setInlineList(name, inlineList);
//              }
            self.addChild('commentsView', new ResourceListView({model: inlineList, parentView: self, el: $('#comments', self.el)[0]}));
            self.assign('#comments', self.commentsView);
              
//              _.each(['updated', 'added', 'reset'], function(event) {
//                self.stopListening(inlineList, event);
//                self.listenTo(inlineList, event, function(resources) {
//                  resources = U.isCollection(resources) ? resources.models : U.isModel(resources) ? [resources] : resources;
//                  var options = {};
//                  options[event] = true;
//                  var commonParams = {
//                      model: rl,
//                      parentView: this
//                    };
//
//                  self.refresh(resources, options);
//                });
//              });
            }
          });
        }
      // end Comments
      });
      
      return this;
    }
  }, {
    displayName: 'EditPage'
  });
});
