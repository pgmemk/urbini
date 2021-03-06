//'use strict';
define('views/ResourceImageView', [
  'globals',
  'underscore', 
  'utils',
  'domUtils',
  'events',
  'views/BasicView'
], function(G, _, U, DOM, Events, BasicView) {

//  $(function() {
//    var $allVideos = $("iframe[src^='http://player.vimeo.com'], iframe[src^='http://www.youtube.com'], object, embed"),
//        $fluidEl = $("figure");
//          
//    $allVideos.each(function() {
//      $(this)
//        // jQuery .data does not work on object/embed elements
//        .attr('data-aspectRatio', this.height / this.width)
//        .removeAttr('height')
//        .removeAttr('width');
//    });
//    
//    $(window).resize(function() {
//      var newWidth = $fluidEl.width();
//      $allVideos.each(function() {
//        var $el = $(this);
//        $el.width(newWidth)
//           .height(newWidth * $el.attr('data-aspectRatio'));
//      });
//    
//    }).resize();
//  });  

  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'resizeVideo'); // fixes loss of context for 'this' within methods
      BasicView.prototype.initialize.apply(this, arguments);
      options = options || {};
      this.twin = options.twin;
      
      var res = this.resource;
      this.isVideo = res.isA('VideoResource');
      this.isAudioResource = res.isA('AudioResource');
      this.isAudio = res.isAssignableFrom('Audio')  ||  this.isAudioResource;
      this.isImage = res.isA('ImageResource');
      this.resource.on('change', this.refresh, this);
      return this;
    },
    windowEvents: {
      'orientationchange': 'resizeVideo',
      'resize': 'resizeVideo'
    },
    resizeVideo: function() {
//      if (!this.isLocalVideo || !this.video)
      if (!this.video)
        return;
      
      var v = this.video,
          width = v.videoWidth || this.$video.width(),
          height = v.videoHeight || this.$video.height(),
          preventOversize = !!width;
      
      if (width && height) {
//        this._resizeVideo(width, v.videoHeight, preventOversize);
        this._resizeVideo(width, height, preventOversize);
        return;
      }
    },

//    _getMaxDimensions: function() {
//      var maxWidth = this.pageView.innerWidth() - padding;
//      var maxHeight = this.pageView.innerHeight() - padding;
//      var downscaleRatio = Math.max(width / maxWidth, height / maxHeight, preventResizeOverOneHundredPercent ? 1 : 0);      
//    },
    
    _resizeVideo: function(width, height, preventResizeOverOneHundredPercent) {
      var padding = this.padding();
      var maxWidth = Math.min(this.pageView.innerWidth() - padding, 640);
      var maxHeight = Math.min(this.pageView.innerHeight() - padding, 480);
      width = width || maxWidth;
      height = height || maxHeight;
      var downscaleRatio = Math.max(width / maxWidth, height / maxHeight, false);
      this.$video.attr('width', Math.round(width / downscaleRatio));
      this.$video.attr('height', Math.round(height / downscaleRatio));
    },
    
    refresh: function() {
      G.log(this.TAG, "info", "refresh resource");
      this.el.$empty();
      this.render();
      return this;
    },
    
    _getVideoEl: function() {
      return this.isLocalVideo ? this.$('video') : this.$('iframe');
    },
    
    renderVideo: function() {
      if (this.hash.startsWith('edit/'))
        return this;
      
      var res = this.resource,
          self = this;
      
      if (!_.has(this, '_videoUrl')) {
        this._videoUrlProp = U.getCloneOf(this.vocModel, "VideoResource.videoUrl")[0];
        this._videoUrl = res.get(this._videoUrlProp);
        this.isLocalVideo = this._videoUrl && this._videoUrl.startsWith(G.serverName);
        this.template = this.makeTemplate('videoPlayerTemplate', 'template', this.vocModel.type);
      }
      
      if (this.isLocalVideo) {
//        this.videoDfd.done(function() {
        var info = {
          src: this._videoUrl,
          preload: 'auto'
//          autoplay: 'autoplay'
        };
        
        info.poster = res.get('ImageResource.bigImage') || res.get('ImageResource.originalImage');
        this.html(this.template(info));
      }
      else {
        var videoHtml5Prop = U.getCloneOf(this.vocModel, "VideoResource.videoHtml5");
        var descProp = U.getCloneOf(this.vocModel, "VideoResource.description");
        var videoHtml5 = videoHtml5Prop && res.get(videoHtml5Prop);
        var desc = descProp && res.get(descProp);
        
        var v = videoHtml5 || desc;
        if (v) {
          var frag = document.createDocumentFragment();
          var video = '<div class="video-container" align="center">' + v + '</div>';
          U.addToFrag(frag, video);
          this.html(frag);
        }
      }
      
      this.$video = this._getVideoEl();
      this.video = this.$video[0];
      if (this.video) {
        if (this.video.tagName === 'VIDEO') {
          var checkSize = function(e) {
            if (self.video.videoWidth) {
              self.resizeVideo();
              _.each(G.media_events, function(e) {
                self.$video.off(e, checkSize);
              });
            }
          };
              
          _.each(G.media_events, function(e) {
            self.$video.one(e, checkSize);
          });
        }
        else {
          // iframe
          this.video.onload = this.resizeVideo;
        }
      }
      else
        return false;
      
      return this;
    },
    
    render: function(options) {
      this.getFetchPromise().done(this.renderHelper.bind(this, options));
    },
    
    renderHelper: function(options) {
      if (!this.isImage && !this.isVideo && !this.isAudio)
        return false;
      
      var self = this;
      var res = this.resource;
      var meta = this.vocModel.properties;
      if (!meta)
        return false;

      var self = this;
      if (this.isVideo) {
        if (this.renderVideo())
          return this;
      }
        
      // fallback to audio
      if (this.isAudio) {
        var audio = this.isAudioResource ? res.get('AudioResource.audio') : res.get('_uri');
        if (audio) {
          this.template = this.makeTemplate('audioPlayerTemplate', 'template', this.modelType);
//          return imgUri == null ? null : 'http://' + serverName + imgUri.substring(imgUri.indexOf('Image') + 5);
          this.html(this.template({
            sources: [U.getExternalFileUrl(audio)]
          }));
          
          return this;
        }
        else {
          // no audio, no player, fall back to imageresource
        }
      }

      if (!this.isImage)
        return this;
      
      // fallback to image
      var imagePropName = U.getImageProperty(this.vocModel),
          imageProp = imagePropName && meta[imagePropName],
          image = imagePropName && res.get(imagePropName);
      
      if (typeof image == 'undefined') 
        return this;
      
      var viewport = G.viewport;
      var winW = viewport.width; // - 3;
      var winH = viewport.height;
      
      /*
      var props = U.getCloneOf(this.vocModel, 'ImageResource.bigImage');
      if (props.length == 0)
        props = U.getCloneOf(this.vocModel, 'ImageResource.originalImage');
      
      var oWidth,
          oHeight,
          imagePropName = props[0],
          imageProp = imagePropName && meta[imagePropName],
          image = imagePropName && res.get(imagePropName);
      
      if (typeof image == 'undefined') 
        return this;
      */

      var oWidth, oHeight, metaW, metaH, metaDim;
      var isIntersection = U.isA(this.vocModel, 'Intersection');
      
      if (!isIntersection) {
        oWidth = res.get('ImageResource.originalWidth');
        oHeight = res.get('ImageResource.originalHeight');
        metaW = imageProp['imageWidth'];
        metaH = imageProp['imageHeight'];
        metaDim = imageProp['maxImageDimension'];
      } 
      else {
        var range, iProp;
        if (imageProp.shortName.charAt(0) == 'a') { 
          oWidth = res.get('Intersection.aOriginalWidth');
          oHeight = res.get('Intersection.aOriginalHeight');
          range = meta[U.getCloneOf(this.vocModel, 'Intersection.a')].range;
          iProp = meta[U.getCloneOf(this.vocModel, 'Intersection.aFeatured')];
        }
        else {
          oWidth = res.get('Intersection.bOriginalWidth');
          oHeight = res.get('Intersection.bOriginalHeight');
          range = meta[U.getCloneOf(this.vocModel, 'Intersection.b')].range;
          iProp = meta[U.getCloneOf(this.vocModel, 'Intersection.bFeatured')];
        }
        var im = U.getModel(U.getLongUri1(range));
        if (im) {
          var imeta = im.properties;
          var imgP = iProp  &&  imeta[U.getCloneOf(im, 'ImageResource.mediumImage')]; 
          maxDim = imgP && imgP.maxImageDimension;
        }
      }
      
      var frag = document.createDocumentFragment();
      var isHorizontal = this.isLandscape();
  
      if (image.indexOf('Image/') == 0)
        image = decodeURIComponent(image.slice(6));
  
      var clip = U.clipToFrame(winW, winH, oWidth, oHeight, metaDim);


      var w, h, t, r, b, l, left, top, maxW;

      var clip;
      if (metaDim) {
        if (winW >= metaDim) {
          if (oWidth >= oHeight)
            maxW = metaDim;
          else 
            maxW = Math.floor((oWidth / oHeight) * metaDim);
        }
        else {
          maxW = winW;
          clip = U.clipToFrame(winW, winH, oWidth, oHeight, metaDim);
        }
      }
      var w;
      var h;
      if (!isIntersection) {
        if (oWidth > maxW) {
          var ratio;
          ratio = maxW / oWidth;
          w = maxW;
          h = Math.floor(oHeight * ratio);
          oHeight = oHeight * ratio;
        }
        else if (oWidth  &&  oWidth != 0) {
          w = oWidth;
          h = oHeight;
        }
      }
      
      imgAtts = DOM.lazifyImages({
        src: image,
        'data-for': U.getImageAttribute(res, imagePropName)
      })[0];
      
//      if (l) {
//        iTemplate += '<a href="#cameraPopup" class="cameraCapture" target="#" data-icon="camera" data-prop="'+ cOf[0] + '"></a>';
//        imgAtts.style = 'position:absolute; clip: rect(' + t + 'px,' + r + 'px,' + b + 'px,' + l + 'px); left:' + left + 'px; '; // + (top ? 'top: ' + top + 'px;' : '');   
//      }
      if (clip) {
        if (l)
          iTemplate += '<a href="#cameraPopup" class="cameraCapture" target="#" data-icon="camera" data-prop="'+ cOf[0] + '"></a>';
//        imgAtts.style = 'position:absolute; clip: rect(' + t + 'px,' + r + 'px,' + b + 'px,' + l + 'px); left:' + left + 'px; '; // + (top ? 'top: ' + top + 'px;' : '');   
        imgAtts.style = 'position:absolute; clip: rect(' + clip.clip_top + 'px,' + clip.clip_right + 'px,' + clip.clip_bottom + 'px,' + clip.clip_left + 'px); left:-' + clip.clip_left + 'px; top:-' + clip.clip_top; // + (top ? 'top: ' + top + 'px;' : '');
      }
      else if (!isIntersection) {
        if (w) imgAtts.width = w;
        if (h) imgAtts.height = h;
      }
      
      var imgTag = DOM.tag('img', null, imgAtts);
      var iTemplate = DOM.toHTML(imgTag);
      
//      var iTemplate = w ? "<img data-frz-src='" + image +"' width='" + w + "'" + (h ? " height='" + h : '') + "' />"
//                        : "<img data-frz-src='" + image +"' />";
      var li;
/*
      if (G.canWebcam  &&  U.isAssignableFrom(this.vocModel, U.getLongUri1('commerce/urbien/Urbien'))  &&  this.resource.get('_uri') ==  G.currentUser._uri) {
        var cOf = U.getCloneOf(this.vocModel, "FileSystem.attachments");
      }
*/
      
      var padding = w ? (15 - (maxW - w) / 2) : 0;
      padding = -padding;
      
      var mg = U.getPropertiesWith(meta, "mainGroup");
//      if (mg == null  ||  mg.length == 0)
//        li = '<div style="margin-top: -15px; margin-left: {0}px;"><a href="{1}">{2}</a></div>'.format(padding, U.makePageUrl(res), iTemplate);
//      else
//        li = '<div><a href="{0}">{1}</a></div>'.format(U.makePageUrl(res), iTemplate);
      if (mg == null  ||  mg.length == 0)
        li = '<div style="margin-top: -15px; margin-left: {0}px;">{1}</div>'.format(padding, iTemplate);
      else {
        if (clip)
          li = '<div style="position:relative;height:' + (clip.clip_bottom - clip.clip_top) + 'px">{0}</div>'.format(iTemplate);
        else
          li = '<div style="height:' + h + 'px">{0}</div>'.format(iTemplate);
      }
      U.addToFrag(frag, li);
//      this.$el[this.isAudio ? 'append' : 'html'](frag);
//      this[this.isAudio ? 'append' : 'html'](frag);
      if (this.isAudio)
        this.el.appendChild(frag);
      else {
        this.el.innerHTML = "";
        this.el.appendChild(frag);
      }
        
      if (l) {
        var h = t ? b - t : b;
        this.el.style.height = h + 'px';
      }
      
      this.pageView.trigger('loadLazyImages', this.el);
      return this;
    }
  },
  {
    displayName: 'ResourceImageView'
  });
});
