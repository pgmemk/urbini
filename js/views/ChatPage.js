//'use strict';
define([
  'globals',
  'jquery', 
  'underscore', 
  'utils',
  'events',
  'views/BasicView',
  'views/ChatView',
  'views/Header'
], function(G, $, _, U, Events, BasicView, ChatView, Header) {
  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      options = options || {};
      this.autoVideo = options.autoVideo;
      this.hasVideo = this.autoVideo || options.video;
      this.readyDfd = $.Deferred();
      this.ready = this.readyDfd.promise();
      var req = ['lib/socket.io', 'lib/DataChannel'];
//      var req = ['lib/socket.io', 'lib/RTCMultiConnection'];
      if (this.hasVideo)
        req.push('lib/simplewebrtc');
      
      U.require(req).done(function(io, DC, simpleWebRTC) {
        WebRTC = window.WebRTC || simpleWebRTC;
        this.readyDfd.resolve();
      }.bind(this));
      
      this.headerButtons = {
        back: true,
        menu: true,
        login: G.currentUser.guest
      };

      var headerOptions = {
        viewId: this.cid,
        parentView: this,
        buttons: this.headerButtons
      };
      
      var pageTitle = options.title;
      if (pageTitle)
        headerOptions.pageTitle = pageTitle;
      
      this.addChild('header', new Header(headerOptions));
  
      var params = U.getHashParams();
      this.video = params['-video'] === 'y';
      this.autoVideo = params['-autoVideo'] === 'y';
      
      var type = this.vocModel ? this.vocModel.type : null;
      this.makeTemplate('chatPageTemplate', 'template', type);
      this.addChild('chatView', new ChatView(_.pick(this, 'video', 'autoVideo', 'model')));
      this.autoFinish = false;
    },
    
    render: function() {
      var args = arguments;
      this.ready.done(function() {
        this.renderHelper.apply(this, arguments);
        this.finish();
      }.bind(this));
    },
    
    renderHelper: function(options) {
      this.$el.html(this.template({
        viewId: this.cid
      }));
      
      this.assign({
        'div#headerDiv' : this.header,
        'div#chatDiv': this.chatView
      });
      
      if (!this.$el.parentNode) 
        $('body').append(this.$el);
      
      this.$el.trigger('create');
    }
  }, {
    displayName: 'ChatPage'
  });
});