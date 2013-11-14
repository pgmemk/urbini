define('domUtils', ['globals', 'templates', 'lib/fastdom'], function(G, Templates, Q) {
  var doc = document,
      LAZY_DATA_ATTR = G.lazyImgSrcAttr,
      LAZY_ATTR = LAZY_DATA_ATTR.slice(5),
      isFF = G.browser.firefox,
      vendorPrefixes = ['', '-moz-', '-ms-', '-o-', '-webkit-'];

  function getElementArray(els) {
    return _.isArray(els) || els instanceof NodeList ? els : els && [els];
  };

  // Bezier functions
  function B1(t) { return t*t*t }
  function B2(t) { return 3*t*t*(1-t) }
  function B3(t) { return 3*t*(1-t)*(1-t) }
  function B4(t) { return (1-t)*(1-t)*(1-t) }

  var DOM = {
    unhide: function(els) {
      return this.hide(els, true);
    },
    hide: function(els, unhide) {
      els = getElementArray(els);
      if (els) {
        var i = els.length,
            display,
            style,
            el;
        
        while (i--) {
          el = els[i];
          style = el.style;
          display = style.display;
          if (unhide) {
            if (display == 'none')
              style.display = '';
          }
          else
            style.display = 'none';
        }
      }
    },
    hasClass: function(el, cl) {
      return el && el.classList.contains(cl);
    },
    addClass: function(els /*, classes */) {
      els = getElementArray(els);
      if (els) {
        var i = els.length,
            j = arguments.length,
            el;
        
        while (i--) {
          el = els[i];
          while (j-- > 1) {
            el.classList.add(arguments[j]);
          }
        }
      }
    },
    removeClass: function(els /*, classes */) {
      els = getElementArray(els);
      if (els) {
        var i = els.length,
            j = arguments.length,
            el;
        
        while (i--) {
          el = els[i];
          while (j-- > 1) {
            el.classList.remove(arguments[j]);
          }
        }
      }
    },
    replaceClass: function(els, classStr) {
      els = getElementArray(els);
      if (els) {
        var i = els.length,
            el;
        
        while (i--) {
          el = els[i];
          el.classList.length = 0;
          el.setAttribute('class', classStr);
        }
      }
    },
    css: function(els) {
      if (arguments.length < 3 && arguments[1] && typeof arguments[1] !== 'object')
        return this.get.apply(this, arguments);
      
      return this.set.apply(this.arguments);
    },
    
    set: function(els /*, (key, value) or key value map*/) {
      els = getElementArray(els);
      if (!els)
        return;
      
      var i = els.length,
          propMap,
          el,
          style;
      
      if (arguments.length == 3) {
        propMap = {};
        propMap[arguments[1]] = arguments[2];
      }
      else
        propMap = arguments[1];      

      while (i--) {
        el = els[i];
        style = el.style;
        for (var prop in propMap) {
          style[prop] = propMap[prop];
        }
      }
    },
    
    get: function(el) {
      throw "not implemented yet";
    },
    
    attr: function(el /*, (key, value) or key value map*/) {
      var attrs;
      if (arguments.length == 3) {
        attrs = {};
        attrs[arguments[1]] = arguments[2];
      }
      else
        attrs = arguments[1];
  
      for (var name in attrs) {
        el.setAttribute(name, attrs[name]);
      }
    },
    
    getBezierCoordinate: function(p1x, p1y, p2x, p2y, p3x, p3y, p4x, p4y, percentComplete) {
      percentComplete = Math.max(0, Math.min(percentComplete, 1));
      var percent = 1 - percentComplete;
      return [p1x*B1(percent) + p2x*B2(percent) + p3x*B3(percent) + p4x*B4(percent),
              p1y*B1(percent) + p2y*B2(percent) + p3y*B3(percent) + p4y*B4(percent)];
    },
        
    getBezierPercentComplete: function(x1, y1, x2, y2, xTarget, xTolerance) {
      xTolerance = xTolerance || 0.01; //adjust as you please
      var myBezier = function(t) {
        return DOM.getBezierCoordinate(0, 0, x1, y1, x2, y2, 1, 1, t);
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

//        parseTransforms: function(transformsStr) {
//          if (!transformsStr || transformsStr === 'none')
//            return null;
//          
//          var match;
//          while ((match = transformsStr.match(/((translate|rotate|skew|perspective|scale|matrix|matrix3d)[XYZ]?)\((\d+)(px|em|deg|rad|\%|in)\)/i))) {
//            transformsStr = transformsStr.slice(transformsStr.indexOf(match[0]) + match[0].length);
////              matrices.push(opToMatrix(op, amount, units));
//            matrices.push(opToMatrix(match[1] /* operation like translate, rotate */ , parseFloat(match[3]) /* amount to transform */, match[4] /* px, em, %, etc. */));
//          }
//        },
    
    parseTransform: function(transformStr) {
      if (transformStr == 'none')
        return this.getNewIdentityMatrix(4);
      
      var split = transformStr.split(', '),
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
//          return 'translate({0}px, {1}px)'.format(position.X, position.Y);
//          return 'translate({0}px, {1}px) translateZ({2}px) {3}'.format(x || 0, y || 0, z || 0, isFF ? 'rotate(0.01deg)' : '');
//          return 'translate({0}px, {1}px)'.format(x || 0, y || 0);
//          return 'translate3d({0}px, {1}px, 0px)'.format(x || 0, y || 0);
//          return 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, {0}, {1}, 0, 1)'.format(x || 0, y || 0);
    },
    
    /**
     * @return { X: x-offset, Y: y-offset }
     */
    parseTranslation: function(transformStr) {
      var matrix = this.parseTransform(transformStr);
      return {
        X: matrix[3][0],
        Y: matrix[3][1]
      }
    },

//        parseTransform: function(transformStr) {
//          // matrix(a, b, c, d, tx, ty) is a shorthand for matrix3d(a, b, 0, 0, c, d, 0, 0, 0, 0, 1, 0, tx, ty, 0, 1).
//          var matrixMatch = transformStr.match(/^matrix\((.*)\)/),
//              matrix3dMatch = !matrixMatch && transformStr.match(/^matrix3d\((.*)\)/),
//              match = matrixMatch || matrix3dMatch,
//              nums = match && match[1].split(','),
//              matrix = [];
//          
//          if (!match)
//            return CSS.getNewIdentityMatrix(4);
//          
//          if (matrixMatch)
//            nums = [nums[0], nums[1], "0", "0", nums[2], nums[3], "0", "0", "0", "0", "1", "0", nums[4], nums[5], "0", "1"];
//          
//          for (var i = 0; i < 4; i++) {
//            var row = matrix[i] = [];
//            for (var j = 0; j < 4; j++) {
//              row[j] = parseFloat(nums[i * 4 + j].trim());
//            }
//          }
//          
//          return matrix;
//        },
    
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
          result.push(" " + name + "=\"" + DOM.escape(attributes[name]) + "\"");
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
        return "<" + element.name + DOM.toAttributesString(element.attributes) + "/>";
      }
      // Tag with content
      else {
        var html = ["<", element.name, DOM.toAttributesString(element.attributes), ">"],
            content = element.content,
            len = content.length;
        
        for (var i = 0; i < len; i++) {
          html[html.length] = DOM.toHTML(content[i]);
        }
        
        html[html.length] = "</" + element.name + ">";
        return html.join("");
      }
    },
  
    _replacements: [[/&/g, "&amp;"], [/"/g, "&quot;"], [/</g, "&lt;"], [/>/g, "&gt;"]],
    escape: function(text) {
      if (typeof text !== 'string')
        text = '' + text;
      
      var replacements = DOM._replacements;
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
      img.classList.add('wasLazyImage');
      if (!info)
        return;
      
      if (_.has(info, 'width'))
        img.style.width = info.width;
      if (_.has(info, 'height'))
        img.style.height = info.height;
      if (info.data) {
        var src = URL.createObjectURL(info.data), // blob or file
            onload = info.onload,
            onerror = info.onerror;
        
        img.onload = function() {
          try {
            return onload && onload.apply(this, arguments);
          } finally {
            URL.revokeObjectURL(src);
          }
        };

        img.onerror = function() {
          try {
            return onerror && onerror.apply(this, arguments);
          } finally {
            URL.revokeObjectURL(src);
          }          
        }

        img.src = src;
        if (info.realSrc)
          img.setAttribute(LAZY_DATA_ATTR, info.realSrc);
      }
      else if (info.realSrc) {
        if (info.onload)
          img.onload = info.onload; // probably store img in local filesystem
        if (info.onerror)
          img.onerror = info.onerror;
        
        img.src = info.realSrc;
      }
    },
    
    lazifyImage: function(img) {
      this.lazifyImages([img]);
      return img;
    },
    
    lazifyImages: function(images) {
      var infos = [],
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
    
    before: function(elem, before) {
      if ( before.parentNode ) {
        before.parentNode.insertBefore( elem, before );
      }
    },

    after: function(elem, after) {
      if ( after.parentNode ) {
        after.parentNode.insertBefore( elem, after.nextSibling );
      }
    },
    
    removeElement: function(el) {
      if (el.parentNode)
        el.parentNode.removeChild(el);
    }
  };
  
  return DOM;
});