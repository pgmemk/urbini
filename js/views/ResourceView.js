//'use strict';
define([
  'globals',
  'underscore', 
  'events', 
  'utils',
  'views/BasicView'
], function(G, _, Events, U, BasicView) {
  var willShow = function(res, prop, role) {
    var p = prop.shortName;
    var doShow = p.charAt(0) != '_' && p != 'davDisplayName'  &&  !prop.avoidDisplayingInView  &&  U.isPropVisible(res, prop, role);
    // if property marked as Display name element show only on case it is of resource range.
    return doShow ? (!prop.displayNameElm  ||  prop.range.indexOf("/") != -1) : doShow;
      
  };

  return BasicView.extend({
    initialize: function(options) {
      _.bindAll(this, 'render', 'refresh'); // fixes loss of context for 'this' within methods
      this.constructor.__super__.initialize.apply(this, arguments);
      _.each(['propRowTemplate', 'propRowTemplate2', 'propGroupsDividerTemplate', 'priceTemplate', 'buyTemplate', 'sellTemplate'], function(t) {
        this.makeTemplate(t, t, this.vocModel.type);
      }.bind(this));
      
      var res = this.resource;
      res.on('change', this.refresh, this);
      var uri = res.getUri(), self = this;
//      if (U.isTempUri(uri)) {
//        Events.once('synced:' + uri, function(data) {
//          if (self.isActive()) {
//            var newUri = data._uri;
//            self.router.navigate('view/' + encodeURIComponent(newUri), {trigger: false, replace: true});
//          }
//        });
//      }

      var codemirrorModes = U.getRequiredCodemirrorModes(this.vocModel);
      this.isCode = codemirrorModes.length; // we don't need to use the actual modes, just need to know whether we need codemirror stuff
      var readyDfd = $.Deferred(function(defer) {
        if (this.isCode) {
          U.require(['codemirror', 'codemirrorCss'].concat(codemirrorModes), function() {
//          U.require(['codemirrorHighlighting', 'codemirrorCss'], function() {
            defer.resolve();
          }, this);
        }
        else
          defer.resolve();
      }.bind(this));
      
      if (options.isBuyGroup) {
        this.isBuyGroup = true;
        var purchasesBLProp, 
            vocModel = this.vocModel;
        
        if (res.isA("ItemListing"))
          purchasesBLProp = U.getCloneOf(vocModel, "ItemListing.ordersPlaced")[0];
        else if (res.isA("Buyable"))
          purchasesBLProp = U.getCloneOf(vocModel, "Buyable.orderItems")[0];
        
        if (!purchasesBLProp)
          this.isBuyGroup = false;
        else
          this.purchasesBacklinkProp = vocModel.properties[purchasesBLProp];
      }
      this.autoFinish = false;
      this.ready = readyDfd.promise();      
      return this;
    },
    events: {
      'click': 'click'
    },
    click: function(e) {
      if (!this.isBuyGroup)
        return;
      var t = e.target;
      var tagName = t.tagName.toLowerCase();
      while (tagName  &&  tagName != 'a') {
        t = t.parentElement;
        tagName = t.tagName.toLowerCase();
      }
      if (tagName != 'a'  ||  !t.id)
        return;
      if (t.id != 'buy') {
        if (t.id == 'sell')
          Events.stopEvent(e);
        return;
      }
      Events.stopEvent(e);

      var res = this.resource;
      
      var bl = this.purchasesBacklinkProp;
      var cbType = bl.range;
      var props = {};
      props[bl.backLink] = res.getUri();
      return this.router.navigate(U.makeMobileUrl('make', U.getLongUri1(cbType), props));
    },
    refresh: function(resource, options) {
      options = options || {};
      if (options.skipRefresh || options.fromDB)
        return;
      
      var res = this.resource;   
      
//      if (res.lastFetchOrigin === 'edit')
//        return;
      
      var collection, modified;
      if (U.isCollection(arguments[0])) {
        collection = arguments[0];
        modified = arguments[1];
        if (collection != res.collection || !_.contains(modified, res.getUri()))
          return this;
      }

      this.render();
    },
//    tap: Events.defaultTapHandler,  
//    click: Events.defaultClickHandler,
    
    pruneProps: function(json) {
      if (this.resource.isA("VideoResource")) {
        var videoHtml5Prop = U.getCloneOf(this.vocModel, "VideoResource.videoHtml5")[0];
        if (videoHtml5Prop)
          delete json[videoHtml5Prop];
      }
    },
    
    render: function() {
      var args = arguments;
//      if (!this.ready)
//        return this.renderHelper.apply(this, args);
      
      this.ready.done(function() {
        this.renderHelper.apply(this, args);
        this.finish();
      }.bind(this));
    },
    
    renderHelper: function(options) {
      var res = this.resource;
      var vocModel = this.vocModel;

      var params = U.getParamMap(window.location.hash);
      var isApp = U.isAssignableFrom(res, G.commonTypes.App);
      var isAbout = (isApp  &&  !!params['$about']  &&  !!res.get('description')) || !!params['$fs'];
//      var isAbout = isApp  &&  !!params['$about']  &&  !!res.get('description');
      if (isAbout  &&  isApp) {
        this.$el.removeClass('hidden');
        this.$el.html(res.get('description'));
        this.$el.trigger('create');      
        return this;
      }
      var meta = vocModel.properties;
      var userRole = U.getUserRole();
      var json = res.toJSON();
      this.pruneProps(json);

      var frag = document.createDocumentFragment();

      var currentAppProps = U.getCurrentAppProps(meta);
      var propGroups;
      if (this.isBuyGroup) {
        this.$el.css("float", "right");
        this.$el.css("width", "45%");
        this.$el.css("min-width", "130");
        var color = ['rgba(156, 156, 255, 0.95)', 'rgba(255, 0, 255, 0.8)', 'rgba(255, 255, 0, 0.95)', 'rgba(32, 173, 176, 0.8)', 'rgba(255, 156, 156, 0.8)', 'purple'];
        var colorIdx = 0;

        if (this.vocModel.type.endsWith("coupon/Coupon")) {
          if (json.discount < 90) {
            U.addToFrag(frag, this.priceTemplate(_.extend({color: color[1], name: 'Discount', shortName: 'discount', value: U.getFlatValue(meta.discount, json.discount)}))); //json['discount']})));
            U.addToFrag(frag, this.priceTemplate(_.extend({color: color[0], name: 'You save', shortName: 'dealDiscount', value: U.getFlatValue(meta.dealAmount, json.dealValue) - U.getFlatValue(meta.dealPrice, json['dealPrice'])})));
          }
          else
            U.addToFrag(frag, this.priceTemplate(_.extend({color: color[0], name: 'Deal value', shortName: 'dealValue', value: U.getFlatValue(meta.dealAmount, json.dealValue)})));
          U.addToFrag(frag, this.buyTemplate(_.extend({color: color[2], name: 'Price', shortName: 'dealPrice', value: U.getFlatValue(meta.dealPrice, json['dealPrice'])})));
        }
        else {        
//          U.addToFrag(frag, this.priceTemplate(_.extend({color: color[1], name: 'Discount', shortName: 'discount', value: U.getFlatValue(meta.discount, json.discount)}))); //json['discount']})));
//          U.addToFrag(frag, this.priceTemplate(_.extend({color: color[0], name: 'You save', shortName: 'dealDiscount', value: U.getFlatValue(meta.dealAmount, json.dealAmount) - U.getFlatValue(meta.price, json['price'])})));
          U.addToFrag(frag, this.buyTemplate(_.extend({color: color[2], name: meta['price'].displayName, shortName: 'price', value: U.getFlatValue(meta.price, json['price'])})));
          U.addToFrag(frag, this.sellTemplate(_.extend({color: color[2], background: 'rgba(255, 0, 0, 0.9)'})));
        }
        this.$el.html(frag);      
        this.$el.trigger('create');
        return this;
      }
      propGroups = U.getPropertiesWith(meta, "propertyGroupList"); // last param specifies to return array
//      propGroups = propGroups.length ? propGroups : U.getPropertiesWith(vocModel.properties, "propertyGRoupsList", true);
      propGroups = _.sortBy(propGroups, function(pg) {
        return pg.index;
      });
      
      var backlinks = U.getPropertiesWith(meta, "backLink");
//      var backlinksWithCount = backlinks ? U.getPropertiesWith(backlinks, "count") : null;

      if (isAbout) {
        var d = U.getCloneOf(vocModel, 'Submission.description');
        if (d.length > 0) {
          var val = res.get(d[0]);
          if (val) {
//            var val = U.makeProp({resource: res, propName: d, prop: meta[p], value: json[d]});
//            U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
            this.$el.removeClass('hidden');
            U.addToFrag(frag, '<div id="Description">' + val + '</div>');
            this.$el.html(frag);      
            if (this.$el.hasClass('ui-listview')) {
              this.$el.trigger('create');      
              this.$el.listview('refresh');
            }
            else
              this.$el.trigger('create');      
            return this;
          }
        }
      }
      var displayedProps = {};
      var idx = 0;
      var groupNameDisplayed;
      var maxChars = 30;


      if (propGroups.length) {
        for (var i = 0; i < propGroups.length; i++) {
          var grMeta = propGroups[i];
          var pgName = U.getPropDisplayName(grMeta);
          var props = grMeta.propertyGroupList.split(",");
          groupNameDisplayed = false;
          for (var j = 0; j < props.length; j++) {
            var p = props[j].trim();
            if (!/^[a-zA-Z]/.test(p) || !_.has(json, p) || _.has(backlinks, p))
              continue;
            
            var prop = meta[p];
            if (!prop) {
//              delete json[p];
              continue;
            }
                  
            if (!willShow(res, prop, userRole))
              continue;
  
            if (prop['app']  &&  (!currentAppProps || !currentAppProps[p]))
              continue;
            displayedProps[p] = true;
            var val = U.makeProp({resource: res, prop: prop, value: json[p]});
            if (!groupNameDisplayed) {
              U.addToFrag(frag, this.propGroupsDividerTemplate({value: pgName}));
              groupNameDisplayed = true;
            }
  
            // remove HTML tags, test length of pure text
            var v = U.removeHTML(val.value).trim();
            if (prop.code) {
              val.value = this.__prependNumbersDiv(prop, val.value);          
            }
            
            if (val.name.length + v.length > maxChars)
              U.addToFrag(frag, this.propRowTemplate2(val));
            else
              U.addToFrag(frag, this.propRowTemplate(val));
            
            json[p] = val;
          }
        }
      }
      
      var otherLi;
      groupNameDisplayed = false;
      var numDisplayed = _.size(displayedProps);
      if (!this.isBuyGroup  &&  this.vocModel.type.endsWith("/Coupon")) {
        displayedProps['price'] = true;
        displayedProps['dealAmount'] = true;
        displayedProps['value'] = true;
        displayedProps['discount'] = true;
      }
      for (var p in json) {
        if (!/^[a-zA-Z]/.test(p))
          continue;

        var prop = meta[p];
        if (!_.has(json, p) || displayedProps[p] || _.has(backlinks, p))
          continue;
        
        if (!prop) {
//          delete json[p];
          continue;
        }
        if (prop['app']  &&  (!currentAppProps || !currentAppProps[p]))
          continue;
        if (prop.autoincrement)
          continue;
//        if (prop.displayNameElm)
//          continue;
        if (!willShow(res, prop)) //(!U.isPropVisible(res, prop))
          continue;
  
        if (numDisplayed  &&  !groupNameDisplayed) {
          otherLi = '<li data-role="collapsible" id="other" data-inset="false" style="border:0px;' + (G.theme.backgroundImage ? 'background-image: url(' + G.theme.backgroundImage + ')' : '') + '" data-content-theme="' + G.theme.list + '"  data-theme="' + G.theme.list + '" id="other"><h3 style="margin:0px;">Other</h3><ul data-inset="true" data-role="listview" style="margin: -10px 0px;">';
  //        this.$el.append('<li data-role="collapsible" data-content-theme="c" id="other"><h2>Other</h2><ul data-role="listview">'); 
          groupNameDisplayed = true;
        }
        
        var val = U.makeProp({resource: res, propName: p, prop: prop, value: json[p]});
        if (prop.code) {
          val.value = this.__prependNumbersDiv(prop, val.value);          
        }
        
        var v = U.removeHTML(val.value).trim();
        if (otherLi) {
          if (val.name.length + v.length > maxChars)
            otherLi += this.propRowTemplate2(val);
          else
            otherLi += this.propRowTemplate(val);
        }
        else {
          if (val.name.length + v.length > maxChars)
            U.addToFrag(frag, this.propRowTemplate2(val));
          else
            U.addToFrag(frag, this.propRowTemplate(val));
        }
      }
      
      if (otherLi) {
        otherLi += "</ul></li>";
        U.addToFrag(frag, otherLi);
      }
  //    if (displayedProps.length  &&  groupNameDisplayed)
  //      this.$el.append("</ul></li>");
      
  //    var j = {"props": json};
  //    this.$el.html(html);
      this.$el.html(frag);      
      if (this.$el.hasClass('ui-listview')) {
        this.$el.trigger('create');      
        this.$el.listview('refresh');
      }
      else
        this.$el.trigger('create');      


      if (this.isCode && CodeMirror) {
//        var doc = document;
//        var codeNodes = this.$('[data-code]');
//        _.each(codeNodes, function(codeNode) {
//          var lineNo = 1;
//          var output = $(codeNode).find('pre')[0];
//          var text = output.innerHTML.trim();
//          if (!text.length)
//            return;
//          
//          var numbers = this.$('div#{0}_numbers'.format(codeNode.dataset.shortname))[0];
//          output.innerHTML = numbers.innerHTML = '';
//          function highlight(line) {
//            numbers.appendChild(doc.createTextNode(String(lineNo++)));
//            numbers.appendChild(doc.createElement("BR"));
//            for (var i = 0; i < line.length; i++) { 
//              output.appendChild(line[i]);
//            }
//            
//            output.appendChild(doc.createElement("BR"));
//          }
//
//          highlightText(text, highlight);
//        }.bind(this));
        this.$('textarea[data-code]').each(function() {
          var mode = this.dataset.code;
          switch (mode) {
            case 'html':
              mode = 'text/html';
              break;
            case 'css':
              mode = 'css';
              break;
//            case 'js':
//              mode = 'javascript';
//              break;
            default: {
//              debugger;
              mode = 'javascript';
              break;
            }
          }
          
          var editor = CodeMirror.fromTextArea(this, {
            mode: mode,
            tabMode: 'indent',
            lineNumbers: true,
            viewportMargin: Infinity,
            tabSize: 2,
            readOnly: true
          });
          
          setTimeout(function() {
            // sometimes the textarea will have invisible letters, or be of a tiny size until you type in it. This is a preventative measure that seems to work
            editor.refresh.apply(editor); 
          }, 50);
//          $(".Codemirror").focus();
//          var $this = $(this);
        });
      }

      return this;
    },
    
    __prependNumbersDiv: function(prop, html) {
//      return '<div id="{0}_numbers" style="float: left; width: 2em; margin-right: .5em; text-align: right; font-family: monospace; color: #CCC;"></div>'.format(prop.shortName) + html;
      return html;
    }

  }, {
    displayName: 'ResourceView'
  });
});
