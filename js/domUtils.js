define('domUtils', ['globals', 'templates', 'lib/fastdom', 'events'], function(G, Templates, Q, Events) {
  var doc = document,
      LAZY_DATA_ATTR = G.lazyImgSrcAttr,
      LAZY_ATTR = LAZY_DATA_ATTR.slice(5),
      isFF = G.browser.firefox,
      vendorPrefixes = ['-moz-', '-ms-', '-o-', '-webkit-'],
      ArrayProto = Array.prototype,
      resizeTimeout;

  window.addEventListener('resize', function(e) {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(fireResizeEvent, 100);
  });

  window.addEventListener('debouncedresize', function() {
    console.log("debounced resize event");
  });

  function fireResizeEvent() {
    if (saveViewportSize()) {
      window.dispatchEvent(new Event('debouncedresize'));
      window.dispatchEvent(new Event('viewportdimensions'));
    }
  };
  
  window.addEventListener('orientationchange', function() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(fireOrientationchangeEvent, 100);
  });

  window.addEventListener('debouncedorientationchange', function() {
    console.log("debounced orientationchange event");
  });

  function fireOrientationchangeEvent() {
    window.dispatchEvent(new Event('debouncedorientationchange'));
    window.dispatchEvent(new Event('viewportdimensions'));
  };

  function saveViewportSize() {
    var viewport = G.viewport,
        width = window.innerWidth,
        height = window.innerHeight,
        oldWidth = 0,
        oldHeight = 0,
        changed = false;
    
    if (viewport) {
      oldWidth = viewport.width;
      oldHeight = viewport.height;
    }
    else
      viewport = G.viewport = {};
    
    if (oldWidth !== width) {
      viewport.width = width;
      changed = true;
    }
    if (oldHeight !== height) {
      viewport.height = height;
      changed = true;
    }

    if (changed)
      console.log("Viewport size changed from " + oldWidth + 'x' + oldHeight + ', to ' + width + 'x' + height);

    return changed;
//    Events.trigger('viewportResize', viewport);
  };

  function $wrap(el) {
    return el instanceof $ ? el : $(el);
  };

  function $unwrap(el) {
    return el instanceof $ ? el[0] : el;
  };

  saveViewportSize();  
//  window.addEventListener('orientationchange', saveViewportSize); 
//  window.addEventListener('debouncedresize', saveViewportSize); 

  function getElementArray(els) {
    return els instanceof Array ||
           els instanceof NodeList || 
           els instanceof HTMLCollection ? els : els && [els];
  };

  function newNodeList() {
    var frag = document.createDocumentFragment();
    return frag.querySelectorAll("html");
  }
  
  // Bezier functions
  function B1(t) { return t*t*t }
  function B2(t) { return 3*t*t*(1-t) }
  function B3(t) { return 3*t*(1-t)*(1-t) }
  function B4(t) { return (1-t)*(1-t)*(1-t) }

  var nodeProto = Node.prototype;
  var nodeListProto = NodeList.prototype;
  var htmlCollectionProto = HTMLCollection.prototype;
  var elementProto = Element.prototype;
  var $matches = elementProto.matches || elementProto.webkitMatchesSelector || elementProto.mozMatchesSelector || elementProto.msMatchesSelector;
  
  (function extendNodeAndNodeList(win, doc) {
    var NodeAndNodeListAug = {
      $matches: $matches,
      $on: function(event, handler, capture) {
        this.addEventListener(event, handler, capture);
        return this;
      },
      $off: function(event, handler, capture) {
        this.removeEventListener(event, handler, capture);
        return this;
      },
      $once: function(event, handler, capture) {
        var self = this; 
        return this.$on(event, function proxy() {
          self.$off(proxy);
          handler();
        }, capture);
      },
      $trigger: function(event, data) {
        if (typeof event == 'string')
          event = data ? new Event(event, data) : new Event(event);
        
        this.dispatchEvent(event);
        return this;
      },
      $css: function() {
        switch (arguments.length) {
        case 0:
          return window.getComputedStyle(this);
        case 1:
          var arg0 = arguments[0];
          if (typeof arg0 == 'string')
            return this.style[arg0];
          else
            _.extend(this.style, arg0);
          
          break;
        case 2:
          this.style[arguments[0]] = arguments[1];
          break;
        default:
          throw "invalid arguments to style method of Node";
        };
        
        return this;
      },
      
      $attr: function() {
        var arg0 = arguments[0];
        switch (arguments.length) {
        case 1:
          if (typeof arg == 'string') // get
            return this.getAttribute(arg0);
          
          for (var prop in arg0) { // set
            var val = arg0[prop];
            if (val == null)
              this.removeAttribute(prop);
            else
              this.setAttribute(prop, arg0[prop]);
          }
          
          break;
        case 2:
          var val = arguments[1];
          if (val == null)
            this.removeAttribute(arguments[0]);
          else
            this.setAttribute(arguments[0], val);
          break;
        default:
          throw "invalid arguments to style method of Node";
        };
        
        return this;
      },
      
      $remove: function() {
        if (this.parentNode)
          this.parentNode.removeChild(this);
        
        return this;
      },
  
      $hide: function() {
        this.style.display = 'none';
        return this;
      },
      
      $show: function() {
        if (this.style.display)
          this.style.display = "";
        
        return this;
      },
      
      $addClass: function() {
        var i = arguments.length;
        while (i--) this.classList.add(arguments[i]);
        return this;
      },
      
      $removeClass: function() {
        var i = arguments.length;
        while (i--) this.classList.remove(arguments[i]);
        return this;
      },
      
      $toggleClass: function(cl) {
        if (this.$hasClass(cl))
          this.$removeClass(cl);
        else
          this.$addClass(cl);
      },
      
      $empty: function() {
        this.innerHTML = "";
        return this;
      },
      
      $html: function(htmlOrFrag) {
        if (typeof htmlOrFrag == 'string')
          this.innerHTML = htmlOrFrag;
        else if (htmlOrFrag instanceof DocumentFragment) {
          this.innerHTML = "";
          this.appendChild(htmlOrFrag);
        }
        else
          throw "only HTML string or DocumentFragment are supported";
        
        return this;
      }
    },
        
    noOffset = {
      top: 0,
      left: 0
    };
    
    var NodeAug = {
      $: function(selector) {
        return this.nodeType == 1 ? this.querySelectorAll(selector) : newNodeList();
      },
    
      $offset: function() {
        var box = this.getBoundingClientRect(),
            docElem = doc.documentElement;
        
        return {
          top: box.top  + ( win.pageYOffset || docElem.scrollTop )  - ( docElem.clientTop  || 0 ),
          left: box.left + ( win.pageXOffset || docElem.scrollLeft ) - ( docElem.clientLeft || 0 )
        };
      },

//      $offsetParent: function() {
//         // from jQuery
//        var offsetParent = this.offsetParent || doc.documentElement;
//        while (offsetParent && offsetParent.nodeName !== "HTML" && win.getComputedStyle(offsetParent).position === "static") {
//          offsetParent = offsetParent.offsetParent;
//        }
//        
//        return offsetParent || doc.documentElement;
//      },
      
      $position: function() {
        var offset = this.$offset(),
            offsetParent = this.offsetParent, // maybe use jQuery's offsetParent?
            style = win.getComputedStyle(this),
            parentStyle = win.getComputedStyle(offsetParent),
            parentOffset = offset.nodeName == 'HTML' ? noOffset : offsetParent.$offset(),
            marginTop = 0,
            marginLeft = 0;
        
        if (parentStyle.borderTopWidth)
          parentOffset.top += parseFloat(parentStyle.borderTopWidth);
        if (parentStyle.borderLeftWidth)
          parentOffset.left += parseFloat(parentStyle.borderLeftWidth);
        
        if (style.marginTop)
          marginTop = parseFloat(style.marginTop);
        if (style.marginLeft)
          marginLeft = parseFloat(style.marginLeft);
        
        return {
          top:  offset.top  - parentOffset.top - marginTop,
          left: offset.left - parentOffset.left - marginLeft
        };
      },

      $not: function(selector) {
        return this.$matches(selector) ? false : true;
      },
      
      $before: function(before) {
        if (before.parentNode)
          before.parentNode.insertBefore(this, before);
        
        return this;
      },
    
      $after: function(after) {
        if (after.parentNode)
          after.parentNode.insertBefore(this, after.nextSibling );
        
        return this;
      },
      
      $hasClass: function(cl) {
        return this.classList.contains(cl);
      },
  
      $prepend: function(/* htmlOrFrag, htmlOrFrag, ... */) {
        var i = arguments.length;
        while (i--) {
          var htmlOrFrag = arguments[i];
          if (!this.firstChild) {
            this.$append(htmlOrFrag);
            continue;
          }
          
          if (typeof htmlOrFrag == 'string')
            htmlOrFrag = $.parseHTML(htmlOrFrag);
          
          (htmlOrFrag instanceof Array) ? htmlOrFrag[0].$before(this.firstChild) : htmlOrFrag.$before(this.firstChild);
//           htmlOrFrag.$before(this.firstChild);
        }
        
        return this;
      },  
      
      $append: function(/* htmlOrFrag, htmlOrFrag, ... */) {
        for (var i = 0; i < arguments.length; i++) {
          var htmlOrFrag = arguments[i];
          if (typeof htmlOrFrag == 'string')
            this.innerHTML += htmlOrFrag;
          else if (htmlOrFrag instanceof DocumentFragment)
            this.appendChild(htmlOrFrag);
          else
            throw "only HTML string or DocumentFragment are supported";
        }
        
        return this;
      },
      
      $fadeTo: function(targetOpacity, time, callback) {
        targetOpacity = targetOpacity || 0;
        var self = this,
            opacityInterval = 0.1,
            timeInterval = 40,
            opacity,
            diff;
        
        (function fader() {        
          opacity = self.opacity;
          if (time <= 0 || opacity - targetOpacity <= opacityInterval) {
            self.opacity = targetOpacity;
            if (targetOpacity == 0)
              self.display = "none";
            
            if (callback)
              callback.call(self);
          }
          else {
            self.opacity -= opacityInterval;
            setTimeout(fader, time -= timeInterval);
          }
        })();
        
        return this;
      }
    };
    
    _.defaults(nodeListProto, {
      $not: function(selector) {
        var i = this.length,
            node,
            filtered = [];
        
        while (i--) {
          node = this[i];
          if (!node.$matches(selector))
            filtered.push(node);
        }
        
        return filtered;
      }
    });
    
    var arrayMethods = Object.getOwnPropertyNames( ArrayProto ),
        arrayMethodI = arrayMethods.length;
    
    while (arrayMethodI--) {
      var methodName = arrayMethods[arrayMethodI];
      var method = ArrayProto[methodName];
      if (typeof method == 'function') {
        methodName = '$' + methodName;
        nodeListProto[methodName] = method;
        htmlCollectionProto[methodName] = method;
      }
    }
    
    function extendCollection(col, fnName) {
      var nodeFn = nodeProto[fnName];
      if (nodeFn) {
        col[fnName] = function() {
          var args = arguments,
              result,
              node,
              i = this.length;
          
          while (i--) {
            node = this[i];
            nodeFn.apply(node, args);
          }
          
          return this;
        }
      }
    };
    
    _.defaults(nodeProto, NodeAug, NodeAndNodeListAug);
  
    for (var prop in NodeAndNodeListAug) {
      var method = NodeAndNodeListAug[prop];
      if (!nodeListProto[prop])
        extendCollection(nodeListProto, prop);
      if (!htmlCollectionProto[prop])
        extendCollection(htmlCollectionProto, prop);
    }
  })(window, document);

  return {    
    getBezierCoordinate: function(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, percentComplete) {
      percentComplete = Math.max(0, Math.min(percentComplete, 1));
      var percent = 1 - percentComplete;
      return [p1x*B1(percent) + p2x*B2(percent) + p3x*B3(percent) + p4x*B4(percent),
              p1y*B1(percent) + p2y*B2(percent) + p3y*B3(percent) + p4y*B4(percent)];
    },
        
    getBezierPercentComplete: function(x1, y1, x2, y2, xTarget, xTolerance) {
      var self = this;
      xTolerance = xTolerance || 0.01; //adjust as you please
      var myBezier = function(t) {
        return self.getBezierCoordinate(0, 0, x1, y1, x2, y2, 1, 1, t);
      };
  
      //we could do something less stupid, but since the x is monotonic
      //increasing given the problem constraints, we'll do a binary search.
  
      //establish bounds
      var lower = 0;
      var upper = 1;
      var percent = (upper + lower) / 2;
  
      //get initial x
      var bezier = myBezier(percent);
      var x = bezier[0];
      var numLoops = 0;
  
      //loop until completion
      while (Math.abs(xTarget - x) > xTolerance) {
        if (numLoops++ > 100)
          debugger;
        
        if (xTarget > x) 
          lower = percent;
        else 
          upper = percent;
  
        percent = (upper + lower) / 2;
        bezier = myBezier(percent);
        x = bezier[0];
      }
      //we're within tolerance of the desired x value.
      //return the y value.
      return bezier[1];
    },
    getNewIdentityMatrix: function(n) {
      n = n || 4;
      var rows = new Array(n);
      for (var i = 0; i < n; i++) {
        rows[i] = new Array(n);
        for (var j = 0; j < n; j++) {
          rows[i][j] = +(i==j);
        }
      }
      
      return rows;
    },

    parseTransform: function(transformStr) {
      if (transformStr == 'none')
        return this.getNewIdentityMatrix(4);
      
      var split = transformStr.slice(transformStr.indexOf('(') + 1).split(', '),
          xIdx = split.length == 6 ? 4 : 12,
          yIdx = xIdx + 1; 

      split = _.map(split, parseFloat.bind(window));
      if (split.length == 6) {
        return [
          [split[0], split[2], 0, 0],
          [split[2], split[3], 0, 0],
          [0,        0,        1, 0],
          [split[4], split[5], 0, 1]
        ];
      }
      else {
        return [
          split.slice(0, 4),
          split.slice(4, 8),
          split.slice(8, 12),
          split.slice(12)
        ];
      }
    },

    getTranslationString: function(position) {
      var x, y, z;
      if (typeof position == 'object') {
        x = position.x;
        y = position.y;
        z = position.z;
      }
      else {
        x = position;
        y = arguments[1];
        z = arguments[2];
      }
      
      return 'translate(' + (x || 0) + 'px, ' + (y || 0) + 'px) translateZ(' + (z || 0) + 'px)' + (isFF ? ' rotate(0.01deg)' : '');
    },
    
    _zeroTranslation: {
      X:0,
      Y:0,
      Z:0
    },
    
    /**
     * @return { X: x-offset, Y: y-offset }
     */
    parseTranslation: function(transformStr) {
      transformStr = transformStr.trim();
      if (!transformStr || transformStr == 'none')
        return _.clone(this._zeroTranslation);
      
      if (/matrix/.test(transformStr)) {
        var matrix = this.parseTransform(transformStr);
        return {
          X: matrix[3][0],
          Y: matrix[3][1]
        }
      }
      
      if (/translate/.test(transformStr)) {
        var xyz = transformStr.match(/(\d)+/g);
        if (!xyz)
          return _.clone(this._zeroTranslation);

        return {
          X: parseFloat(xyz[0] || 0, 10),
          Y: parseFloat(xyz[1] || 0, 10),
          Z: parseFloat(xyz[2] || 9, 10)
        }
      }
      
      throw "can't parse transform";
    },
    
    getStylePropertyValue: function(computedStyle, prop) {
      var value,
          vendorSpecific = G.crossBrowser.css;
      
      if (vendorSpecific) {
        value = computedStyle.getPropertyValue(vendorSpecific.prefix + prop);
        if (value === undefined)
          value = computedStyle.getPropertyValue(prop);
      }
      else {
        for (var i = 0; i < vendorPrefixes.length; i++) {
          value = computedStyle.getPropertyValue(vendorPrefixes[i] + prop);
          if (value && value !== 'none')
            break;
        }
      }
      
      return value || 'none';
    },
      
    setStylePropertyValues: function(style, propMap) {
      for (var prop in propMap) {
        var value = propMap[prop],
            vendorSpecific = G.crossBrowser.css;
        
        style[prop] = value;
        if (vendorSpecific) {
          style[vendorSpecific.prefix + prop] = value;
        }
        else {
          for (var i = 0; i < vendorPrefixes.length; i++) {
            style[vendorPrefixes[i] + prop] = value;
          }
        }
      }
    },

    getTranslation: function(el) {
      return this.parseTranslation(this.getStylePropertyValue(window.getComputedStyle(el), 'transform'));
    },

    getTransform: function(el) {
      return this.parseTransform(this.getStylePropertyValue(window.getComputedStyle(el), 'transform'));
    },
    
    empty: function(els) {
      els = getElementArray(els);
      if (els) {
        var i = els.length;
//      while (node.hasChildNodes()) {
//      while (node.firstChild) {
//        node.removeChild(node.lastChild);
//      }
        while (i--) {
          els[i].innerHTML = '';
        }
      }
    },
    remove: function(els) {
      els = getElementArray(els);
      if (els) {
        var i = els.length,
            el;
        
        while (i--) {
          el = els[i];
          if (el.parentNode)
            el.parentNode.removeChild(el);
        }
      }
    },
    tag: function(name, content, attributes) {
      return {
        name: name, 
        attributes: attributes, 
        content: _.isArray(content) ? content : 
                             content == null ? [] : [content]
      };
    },
    
    toAttributesString: function(attributes) {
      var result = [];
      if (attributes) {
        for (var name in attributes) { 
          result.push(" " + name + "=\"" + this.escape(attributes[name]) + "\"");
        }
      }
      
      return result.join("");
    },
  
    /**
     * @param element: e.g. {
     *  name: 'p',
     *  attributes: {
     *    style: 'color: #000'
     *  },
     *  content: ['Hello there'] // an array of elements 
     * } 
    **/
    
    toHTML: function(element) {
      // Text node
      if (typeof element == "string") {
        return element; // already html
      }
      // Empty tag
      else if (!element.content || element.content.length == 0) {
        return "<" + element.name + this.toAttributesString(element.attributes) + "/>";
      }
      // Tag with content
      else {
        var html = ["<", element.name, this.toAttributesString(element.attributes), ">"],
            content = element.content,
            len = content.length;
        
        for (var i = 0; i < len; i++) {
          html[html.length] = this.toHTML(content[i]);
        }
        
        html[html.length] = "</" + element.name + ">";
        return html.join("");
      }
    },
  
    _replacements: [[/&/g, "&amp;"], [/"/g, "&quot;"], [/</g, "&lt;"], [/>/g, "&gt;"]],
    escape: function(text) {
      if (typeof text !== 'string')
        text = '' + text;
      
      var replacements = this._replacements;
      for (var i = 0; i < replacements.length; i++) {
        var replace = replacements[i];
        text = text.replace(replace[0], replace[1]);
      }
      
      return text;
    },

    unlazifyImagesInHTML: function(html) {
      return Templates.unlazifyImagesInHTML(html);
    },
    
    /**
     * @param img {HTMLElement}
     * @param info {Object}
     *    Example: {
     *      width: 100,
     *      height: 100,
     *      onload: function() {},
     *      onerror: function() {},
     *      data: {File or Blob},
     *      realSrc: src of the actual image
     *    } 
     */
    unlazifyImage: function(img, info) {
      img.onload = null;
      img.onerror = null;
      img.removeAttribute(LAZY_DATA_ATTR);
      img.classList.remove('lazyImage');
      if (!info)
        return;
      
      img.classList.add('wasLazyImage');
      if (_.has(info, 'width'))
        img.style.width = info.width;
      if (_.has(info, 'height'))
        img.style.height = info.height;
      if (info.data) {
        var src = URL.createObjectURL(info.data), // blob or file
            onload = info.onload,
            onerror = info.onerror;
        
        if (info.realSrc)
          img.setAttribute(LAZY_DATA_ATTR, info.realSrc);
        
        img.src = src;
        this.onImageLoad(img, function() {
          try {
            return onload && onload.apply(this, arguments);
          } finally {
            URL.revokeObjectURL(src);
          }
        });

        this.onImageError(img, function() {
          try {
            return onerror && onerror.apply(this, arguments);
          } finally {
            URL.revokeObjectURL(src);
          }          
        });
      }
      else if (info.realSrc) {
        img.src = info.realSrc;
        
        if (info.onload)
          this.onImageLoad(img, info.onload); // probably store img in local filesystem
        if (info.onerror)
          this.onImageError(img, info.onerror);        
      }
    },
    
    onImageError: function(img, callback) {
      if (img.complete)
        return;
      
      var onerror = img.onerror;
      img.onerror = function() {
        onerror && onerror.call(img);
        callback.call(img);
      };
    },
    
    onImageLoad: function(img, callback) {
      if (img.complete)
        callback.call(img);
      else {
        var onload = img.onload;
        img.onload = function() {
          onload && onload.call(img);
          callback.call(img);
        };
      }
//        img.$on('load', callback);
    },
    
    lazifyImages: function(/* images */) {
      if (!G.lazifyImages)
        return;
      
      var images = arguments,
          infos = [],
          lazyImgAttr = G.lazyImgSrcAttr,
          blankImg = G.getBlankImgSrc(),
          img,
          src,
          realSrc,
          isHTMLElement = images[0] instanceof HTMLElement,
          get = isHTMLElement ? function(el, attr) { return el.getAttribute(attr) } : _.index;
      
      function read() {
        for (var i = 0, num = images.length; i < num; i++) {
          img = images[i];
          realSrc = get(img, lazyImgAttr);
          src = get(img, 'src');
          
          if (realSrc && src == blankImg) {
            infos.push(null); // already lazy
//            debugger;
          }
          else {
            infos.push({
              src: realSrc || src,
              width: get(img, 'width'),
              height: get(img, 'height')
            });  
          }
        }
      };

      function write() {
        for (var i = images.length - 1; i >= 0; i--) { // MUST be backwards loop, as this may be a NodeList and thus may be automatically updated by the browser when we add/remove a class
          var img = images[i],
              info = infos[i];
          
          if (!info)
            continue;
            
          if (isHTMLElement) {
            if (!info.src.startsWith('data:') || info.src != blankImg) {
              img.setAttribute(lazyImgAttr, info.src);
              img.classList.remove('wasLazyImage');
              img.classList.add('lazyImage');
            }
            if (typeof info.width == 'number')
              img.style.width = info.width;
            if (typeof info.height == 'number')
              img.style.height = info.height;
            
  //          img.onload = window.onimageload;
  //          img.onerror = window.onimageerror;
          }
          else {
            img[lazyImgAttr] = info.src;
            img['class'] = 'lazyImage';
  //          img.onload = 'window.onimageload.call(this)';
  //          img.onerror = 'window.onimageerror.call(this)';
          }
          
          img.src = blankImg;
        }
      };
      
      if (isHTMLElement) {
        Q.read(read);
        Q.write(write);
      }
      else {
        read();
        write();
        return images;
      }
    },
    
    toggleButton: function(btn, disable) {
      if (G.isJQM()) {
        btn = $wrap(btn);
        btn.button().button(disable ? 'disable' : 'enable');
      }
      else {
        btn = $unwrap(btn);
        btn.$attr('disabled', disable ? true : null);
      }
    },
    
    closeDialog: function(p) {
      if (G.isJQM())
        $wrap(p).popup('close');
      else
        $unwrap(p).$remove();
    }
  };
});