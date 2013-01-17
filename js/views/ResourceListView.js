define([
  'globals',
  'cache!jquery',
  'cache!underscore',
  'cache!backbone',
  'cache!utils',
  'cache!events',
  'cache!vocManager',
  'cache!templates',
  'cache!jqueryMobile',
  'cache!views/BasicView',
  'cache!views/ResourceMasonryItemView',
//  'cache!views/ResourceMasonryModItemView',
  'cache!views/ResourceListItemView',
  'cache!views/CommentListItemView'
], function(G, $, _, Backbone, U, Events, Voc, Templates, __jqm__, BasicView, ResourceMasonryItemView, ResourceListItemView, CommentListItemView) {
  return BasicView.extend({
    displayPerPage: 10, // for client-side paging
    page: null,
    changedViews: [],
    skipScrollEvent: false,
    initialize: function (options) {
      _.bindAll(this, 'render','swipe', 'getNextPage', 'refresh', 'changed', 'onScroll', 'alignBricks', 'click', 'setMode'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      Events.on('refresh', this.refresh);
      $(window).on('scroll', this.onScroll);
      Events.on('changePage', this.alignBricks);
      this.$el.on('create', this.alignBricks);
      this.collection.on('reset', this.render, this);
      this.TAG = 'ResourceListView';
      this.mode = options.mode || G.LISTMODES.DEFAULT;
      return this;
    },
    setMode: function(mode) {
      if (!G.LISTMODES[mode])
        throw new Error('this view doesn\'t have a mode ' + mode);
      
      this.mode = mode;
    },
    events: {
      'click': 'click'
    },
    refresh: function(rl, modified) {
      if (rl && rl != this.collection)
        return this;
  
//      if (this.$el.hasClass('ui-listview')) {
      //Element is already initialized
//      var lis = this.$('li').detach();
//      var frag = document.createDocumentFragment();
      
      rl = this.collection;
      var resources = rl.models;
      var vocModel = this.vocModel;
      var isModification = U.isAssignableFrom(vocModel, 'Modification', Voc.typeToModel);
      var meta = vocModel.properties;
      var canceled = _.contains(_.values(vocModel.interfaces), 'Cancellable') && (meta.cancelled || meta.canceled).shortName;

      var viewMode = vocModel.viewMode;
      var isList = (typeof viewMode != 'undefined'  &&  viewMode == 'List');
      var isMasonry = false; //!isList  &&  U.isMasonry(vocModel);
      
//      var isMasonry = !isList  &&  U.isA(vocModel, 'ImageResource')  &&  (U.getCloneOf(meta, 'ImageResource.mediumImage').length > 0 || U.getCloneOf(meta, 'ImageResource.bigMediumImage').length > 0  ||  U.getCloneOf(meta, 'ImageResource.bigImage').length > 0);
//      if (!isMasonry  &&  !isModification  &&  U.isA(vocModel, 'Reference') &&  U.isA(vocModel, 'ImageResource'))
//        isMasonry = true;
      var isComment = !isModification  &&  !isMasonry &&  U.isAssignableFrom(vocModel, 'Comment', Voc.typeToModel);
//      if (!isComment  &&  !isMasonry  &&  !isList) {
//        if (U.isA(vocModel, 'Intersection')) {
//          var href = window.location.href;
//          var qidx = href.indexOf('?');
//          var a = U.getCloneOf(meta, 'Intersection.a')[0];
//          var aprop;
//          if (qidx == -1) {
//            aprop = models[0].get(a);
//            isMasonry = (U.getCloneOf(meta, 'Intersection.aThumb')[0]  ||  U.getCloneOf(meta, 'Intersection.aFeatured')[0]) != null;
//          }
//          else {
//            var b = U.getCloneOf(meta, 'Intersection.b')[0];
//            var p = href.substring(qidx + 1).split('=')[0];
//            var delegateTo = (p == a) ? b : a;
//            isMasonry = (U.getCloneOf(meta, 'Intersection.bThumb')[0]  ||  U.getCloneOf(meta, 'Intersection.bFeatured')[0]) != null;
//          }
//        }
//      }
      var lis = isModification || isMasonry ? this.$('.nab') : this.$('li');
      var hasImgs = U.hasImages(rl);
      var curNum = lis.length;
      var num = Math.min(resources.length, (this.page + 1) * this.displayPerPage);
      
      var i = 0;
      var nextPage = false;
      var frag;
      if (typeof modified == 'undefined'  ||  modified.length == 0) {
        i = curNum;
        if (curNum == num)
          return this;
        if (curNum > 0)
          nextPage = true;
      }

      if (!nextPage) {
        lis = lis.detach();
        frag = document.createDocumentFragment();
      }
      
      for (; i < num; i++) {
        var res = resources[i];
        if (canceled && res.get(canceled))
          continue;
        
        var uri = res.get('_uri');
        if (i >= lis.length || _.contains(modified, uri)) {
          var liView;
          if (isMasonry) 
            liView = new ResourceMasonryItemView({model:res, className: 'pin', tagName: 'li', parentView: this});
          else if (isModification)
            liView = new ResourceMasonryItemView({model:res, className: 'nab nabBoard', parentView: this});
          else if (isComment)
            liView = new CommentListItemView({model:res, parentView: this});
          else
            liView = hasImgs ? new ResourceListItemView({model:res, hasImages: 'y', parentView: this}) : new ResourceListItemView({model:res, parentView: this});
          if (nextPage)  
            this.$el.append(liView.render().el);
          else
            frag.appendChild(liView.render().el);
        }
        else if (!nextPage)
          frag.appendChild(lis[i]);
      }

      if (!nextPage) {
        this.$el.html(frag);
      }
      
//      this.$el.html(frag);
//      this.renderMany(this.model.models.slice(0, lis.length));

      if (this.initializedListView) {
        if (isModification  ||  isMasonry)
          this.$el.trigger('create');
        else
          this.$el.listview('refresh');
      }
      else {
        this.initializedListView = true;
      }
    
      return this;
      
//      else {
//        //Element has not been initiliazed
//        this.$el.listview().listview('refresh');
//        this.initializedListView = true;
//      }

    },
    
    getNextPage: function() {
//      var before = this.model.models.length;
//
//      console.log("called getNextPage");
//      
//      // there is nothing to fetch, we've got them all
//      if (before < this.model.perPage)
//        return;
      
      var self = this;
      var rl = this.collection;
      var before = rl.models.length;
//      var before = this.model.offset;
      this.loadingNextPage = true;
      this.page++;
      var requested = (this.page + 1) * this.displayPerPage;
      var after = function() {
//        var numShowing = (self.page + 1) * self.displayPerPage;
        if (requested <= rl.models.length) {
          self.refresh();
        }
        
        $.mobile.loading('hide');
        self.loadingNextPage = false;
      };
      
      var error = function() { after(); };      
      if (before >= requested) {
//        this.refresh(rl);
        after();
        return;
      }

      rl.getNextPage({
        success: after,
        error: error
      });      
    },
    
//    tap: Events.defaultTapHandler,
    click: Events.defaultClickHandler,
    swipe: function(e) {
      console.log("swipe");
    },
    
    changed: function(view) {
      this.changedViews.push(view);
    },
    
    render: function(e) {
      G.log(this.TAG, "render");
      this.numDisplayed = 0;
//      this.renderMany(this.model.models);
      this.refresh();
  //    e && this.refresh(e);
  
      this.rendered = true;
      return this;
    },
  
    // endless page function
    onScroll: function() {
      if (!this.visible)
        return;

      var $wnd = $(window);
      if (this.skipScrollEvent) // wait for a new data portion
        return;

      if ($.mobile.activePage.height() > $wnd.scrollTop() + $wnd.height() * 3.5)
        return;

      // order is important, because view.getNextPage() may return immediately if we have some cached rows
      if ($wnd.scrollTop() > 5) // initial next page retriving not by a user 
        this.skipScrollEvent = true; 
      $.mobile.loading('show');
      var self = this;
      setTimeout(function() { self.getNextPage(); }, 10);
    },
    
    _resumeScrollEventProcessing: function () {
      this.skipScrollEvent = false;
      $.mobile.loading('hide');
    },

    // masonry bricks alignment
    alignBricks: function() {
      // if masonry and bricks have zero dimension then impossible to align them
      if (!this.$el.hasClass("masonry") || this.$el.width() == 0)
        return;

      var self = this;
      var needToReload = false;
      // all bricks in masonry
      var $allBricks = $(this.$el.children());
      // new, unaligned bricks - items without 'masonry-brick' class
      var $newBricks = $allBricks.filter(function(idx, node) {
                  var $next = $(node).next();
                  var hasClass = $(node).hasClass("masonry-brick");
                  // if current node does not have "masonry-brick" class but the next note has
                  // then need to reload/reset bricks
                  if ($next.exist() &&
                      !hasClass && 
                      $next.hasClass("masonry-brick"))
                    needToReload = true;
                  
                  return !hasClass;
                });

      // if image(s) has width and height parameters then possible to align masonry
      // before inner images downloading complete. Detect it through image in 1st 'brick' 
      var img = $('img', $allBricks[0]);
      var hasImgSize = (img.exist() && img.width.length > 0 && img.height.length > 0) ? true : false;
      
      // 1. need to reload. happens on content refreshing from server
      if (needToReload) {
        if (hasImgSize) {
          this.$el.masonry( 'reload' );
          this._resumeScrollEventProcessing();
        }
        else  
          this.$el.imagesLoaded( function(){ self.$el.masonry( 'reload' ); self._resumeScrollEventProcessing(); });
        return
      }
      
      //  2. initial bricks alignment because there are no items with 'masonry-brick' class   
      if ($allBricks.length != 0 && $allBricks.length == $newBricks.length) {
        if (hasImgSize) {
          this.$el.masonry();
          this._resumeScrollEventProcessing();
        }
        else  
          this.$el.imagesLoaded( function(){ self.$el.masonry(); self._resumeScrollEventProcessing(); });
        return;
      }
      
      // 3. nothing to align
      if ($newBricks.length == 0)
        return; // nothing to align
     
      // 4. align new bricks, on next page, only
      // filter unaligned "bricks" which do not have calculated, absolute position 
      if (hasImgSize) {
        this.$el.masonry('appended', $newBricks);
        this._resumeScrollEventProcessing();
      }
      else  
        this.$el.imagesLoaded( function(){ self.$el.masonry('appended', $newBricks); self._resumeScrollEventProcessing(); });
    }
  }, {
    displayName: 'EditView'
  });
});
