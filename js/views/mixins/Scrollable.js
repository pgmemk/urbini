define('views/mixins/Scrollable', ['globals', 'underscore', 'utils', 'events'], function(G, _, U, Events) {

  var FORCE_TOUCH = false,
      SCROLL_DISTANCE_THRESH = 25,
      SCROLL_TIME_THRESH = 1000,
      nonTouchEvents = ['mousedown', 'mouseup', 'mousemove', 'keydown', 'keyup'],
      touchEvents = ['touchstart', 'touchend', 'touchmove'],
      AXES = ['X', 'Y'],
      IS_TOUCH = FORCE_TOUCH || G.browser.mobile,
//      INPUT_EVENTS = IS_TOUCH ? touchEvents : nonTouchEvents,
      TOUCH_EVENTS = IS_TOUCH ? {
        touchstart: 'touchstart',
        touchend: 'touchend',
        touchmove: 'touchmove',
        touchcancel: 'touchcancel'
      } : {
        touchstart: 'mousedown',
        touchend: 'mouseup',
        touchmove: 'mousemove'
//          ,
//        touchcancel: 'touchcancel'
      },
      beziers = {
        fling: 'cubic-bezier(0.103, 0.389, 0.307, 0.966)', // cubic-bezier(0.33, 0.66, 0.66, 1)
        bounceDeceleration: 'cubic-bezier(0, 0.5, 0.5, 1)',
        bounce: 'cubic-bezier(0.7, 0, 0.9, 0.6)'
      },
      
      // SCROLLER STATES
      UNINITIALIZED = 'uninitialized',
      INACTIVE = 'inactive',
      READY = 'ready',
      DRAGGING = 'dragging',
      COASTING = 'coasting',
      SNAPPING = 'snapping',
      // END SCROLLER STATES
      doc = document;

//  document.body.addEventListener('mousemove', function() {
//    debugger;
//    e.preventDefault();
//  }, false)

  doc.body.addEventListener('touchmove', function(e) {
    // This prevents native scrolling from happening.
    e.preventDefault();
  }, false);

  function scrollPosToOffset(pos) {
    return {
      scrollLeft: -pos.X,
      scrollTop: -pos.Y
    }
  }
  
  function isScrollableContainer(el) {
    var style = window.getComputedStyle(el);
    return style.overflow == 'hidden' && style.position == 'absolute';
  }
  
  function oppositeDir(dir) {
    return dir == 'X' ? 'Y' : 'X';
  }
  
  function calcAnimationTime(distance) {
    return parseInt(Math.sqrt(Math.abs(distance)) * 50, 10);
  }
  
  function calcDistance(pos1, pos2) {
    var x = pos1.X - pos2.X,
        y = pos1.Y - pos2.Y;
    
    return Math.sqrt(x * x + y * y);
  }

  function toTouchEvent(mouseEvent) {
    var touches = [{
      clientX: mouseEvent.clientX,
      clientY: mouseEvent.clientY
    }];
    
    return {
      targetTouches: touches,
      changedTouches: touches,
      timeStamp: mouseEvent.timeStamp,
      preventDefault: mouseEvent.preventDefault.bind(mouseEvent)
    }
  }
  
  function getGesture(touch1, touch2) {
    return {
      X: touch2.X - touch1.X,
      Y: touch2.Y - touch1.Y,
      distance: calcDistance(touch1, touch2),
      time: touch2.timeStamp - touch1.timeStamp
    }
  }
  
  function isInBounds(point, bounds, includeBorder) {
    var lessThan = includeBorder ? _['<'] : _['<=']; // looks like you would want the opposite, but we're looking to eliminate, not to match
    for (var i in AXES) {
      var axis = AXES[i];
      if (!isInRange(point[axis], bounds[axis]))
        return false;
    }    
    
    return true;
  }

  /*
   * @param range { min: min, max: max }
   */
  function isInRange(num, range, includeBorder) {
    var lessThan = includeBorder ? _['<'] : _['<=']; // looks like you would want the opposite, but we're looking to eliminate, not to match
    return !lessThan(num, range.min) && !lessThan(range.max, num);
  }

  function limitToBounds(point, bounds) {
    var limited = {};
    for (var i in AXES) {
      var axis = AXES[i],
          val = point[axis],
          bound = bounds[axis];
      
      limited[axis] = Math.max(bound.min, Math.min(val, bound.max));
    }
    
    return limited;
  }
  
  // Sroller Finite State Machine. Each scroller state expects only certain events, and has functions to handle those events, and then return the new scroller state
  var TRANSITION_MAP = {
    uninitialized: {
      // Events to expect in 'uninitialized' state
      init: function(e) {
        if (this._scrollerProps.metrics || this._calculateSizes() !== false) {
          doc.addEventListener(TOUCH_EVENTS.touchstart, this, true);
          this._scrollTo(0, 0);
          return READY;
        }
        else {
          setTimeout(function() {
            this._transitionScrollerState(UNINITIALIZED, 'init');
          }.bind(this), 100);
          
          return UNINITIALIZED;
        }
      }
    },
    
    inactive: {
      wake: function() {
        doc.removeEventListener(TOUCH_EVENTS.touchstart, this, true); // just in case we left one hanging
        doc.addEventListener(TOUCH_EVENTS.touchstart, this, true);
        return READY;
      }
    },
    
    ready: {
      // Events to expect in READY state
      mousedown: function(e) {
        return this._transitionScrollerState(READY, 'touchstart', toTouchEvent(e));
      },
      touchstart: function(e) {
        // grab, subscribe to touchmove
        this._clearScrollTimeouts();
        this._clearTouchHistory();
        doc.removeEventListener(TOUCH_EVENTS.touchstart, this, true);
        doc.removeEventListener(TOUCH_EVENTS.touchmove, this, true); // just in case
        doc.removeEventListener(TOUCH_EVENTS.touchend, this, true); // just in case
        doc.addEventListener(TOUCH_EVENTS.touchmove, this, true);
        doc.addEventListener(TOUCH_EVENTS.touchend, this, true);
        this._updateTouchHistory(e, e.targetTouches[0]);
        return DRAGGING;
      },
      
      sleep: function() {
        this._cleanupScroller();
        return INACTIVE;
      }
    },
    dragging: {
      // Events to expect in DRAGGING state
      mousemove: function(e) {
        return this._transitionScrollerState(DRAGGING, 'touchmove', toTouchEvent(e));
      },
      touchmove: function(e) {
        // scroll to new position
        var s = this._scrollerProps, 
            history = s.touchHistory,
            historyLength = history.length,
            lastTimeStamp, 
            scrollX,
            gesture,
            position,
            targetPosition;
        
        if (!historyLength || !e.targetTouches.length) { // || !this._isDragging())
          debugger; // should never happen
          return;
        }
        
  //      console.log('touchmove at: ' + e.targetTouches[0].clientY);
        lastTimeStamp = s._lastTouchMoveTime || Date.now();
        s._lastTouchMoveTime = Date.now();
        if (!historyLength)
          this._triggerScrollEvent('scrollstart');
          
        this._updateTouchHistory(e, e.targetTouches[0]);
        scrollX = this._getScrollAxis() == 'X';
        gesture = s.lastGesture;
        position = s.position;
        
        targetPosition = { 
          X: scrollX ? s.position.X + gesture.X : s.position.X, 
          Y: !scrollX ? s.position.Y + gesture.Y : s.position.Y 
        };
  
        this._scrollTo(targetPosition.X, targetPosition.Y); // immediate, duration 0
        return DRAGGING;
      },

      mouseup: function(e) {
        return this._transitionScrollerState(DRAGGING, 'touchend', toTouchEvent(e));
      },
      
      touchend: function(e) {
        // if fling
        if (!e.changedTouches.length) {
          debugger; // should never happen
          return;
        }
        
        var isInBounds = this._isInBounds(),
            s = this._scrollerProps;
        
        if (isInBounds && (s.distanceTraveled < SCROLL_DISTANCE_THRESH)) {// || s.timeTraveled < SCROLL_TIME_THRESH)) {
          // this was a click, not a swipe/scroll
//          console.log('this was a click');
          this._resetScroller();
          return READY;
        }
        else {
          s.preventClick = true;
          e.preventDefault();
        }

        if (this._flingScrollerIfNeeded()) {
          // fling scroll, schedule state change to bounce/snap/ready
          return COASTING;
        }
        else {
          // update position and reset scroll, unsubscribe from touchmove/touchend
          if (this._snapScrollerIfNeeded())
            return SNAPPING;
          
          this._updateScrollPosition(); // parse it from CSS transform
          this._resetScroller();
          return READY;
        }
      },
      
      sleep: function() {
        return this._transitionScrollerState(READY, 'sleep', e);
      }
    },
    coasting: {
      // Events to expect in COASTING state
      mousedown: function(e) {
        return this._transitionScrollerState(COASTING, 'touchstart', { targetTouches: [e] });
      },
      
      touchstart: function(e) {
        // stop, calc new position, then call ready->touchstart handler and return whatever it returns
        this._clearScrollTimeouts();
        this._clearTouchHistory();
        this._updateScrollPosition(); // parse it from CSS transform
        var pos = this._getScrollPosition();
        this._scrollTo(pos.X, pos.Y);
        return this._transitionScrollerState(READY, 'touchstart', e);
      },
      
      coastcomplete: function(flingInfo) {
        this._updateScrollPosition(flingInfo.to);
        if (this._snapScrollerIfNeeded())
          return SNAPPING;
        
        this._resetScroller();
        return READY;
      },
      
      sleep: function() {
        return this._transitionScrollerState(READY, 'sleep', e);
      }
    },
    snapping: {
      // Events to expect in 'snapping' state
      mousedown: function(e) {
        return this._transitionScrollerState(SNAPPING, 'touchstart', { targetTouches: [e] });
      },
      
      touchstart: function(e) {
//        var touch = e.targetTouches[0];
//        if (!isInBounds(U.cloneTouch(touch), this._scrollerProps.scrollBounds))
//          return SNAPPING; // keep on snapping if the user clicks out of bounds (nothing to click/drag there)
//        else {
          // same as when you get a touchstart during coasting
          return this._transitionScrollerState(COASTING, 'touchstart', e);
//        }
      },
      snapcomplete: function(e) {
        return this._transitionScrollerState(COASTING, 'coastcomplete', e);
      },
      
      sleep: function(e) {
        return this._transitionScrollerState(READY, 'sleep', e);
      }
    }
  }
  
  var initScrollerProps = {
    state: UNINITIALIZED,
    axis: 'Y',
    touchHistory: [],
    SCROLL_EVENT_PERIOD: 200,
    MAX_COAST_TIME: 1500,
//    MIN_START_VELOCITY_: 0.25,
    MAX_OUT_OF_BOUNDS: 50,
    BOUNCE_OUT_TIME: 400,
    BOUNCE_BACK_TIME: 400,
    acceleration: -0.005,
    momentum: true,
    timeTraveled: 0,
    distanceTraveled: 0,
    timeouts: []
  };
  
  var Scrollable = {
    initialize: function(options) {
      _.bindAll(this, '_initScroller', '_resetScroller', '_snapScroller', '_flingScroller', '_scrollTo', '_calculateSizes', '_onSizeInvalidated', '_onClickInScroller', '_onScrollerActive', '_onScrollerInactive');
      this.onload(this._initScroller.bind(this));
    },
    
    _initScroller: function(options) {
      this._scrollerProps = _.deepExtend({}, initScrollerProps, options);
      var el = this.el;
      var s = this._scrollerProps;
      var frame = s.frame = el.parentNode || doc.body;
      this._transitionScrollerState(UNINITIALIZED, 'init'); // simulate 'init' event in UNINITIALIZED state
    },
    
    events: {
      'click': '_onClickInScroller',
      'resize': '_onSizeInvalidated',
      'orientationchange': '_onSizeInvalidated'
    },

    windowEvents: {
      'resize': '_onSizeInvalidated',
      'orientationchange': '_onSizeInvalidated'
    },
    
    globalEvents: {},
    
    myEvents: {
      'invalidateSize': '_onSizeInvalidated',
      '.scrollable active': '_onScrollerActive',
      '.scrollable inactive': '_onScrollerInactive'
    },
    
    _onScrollerActive: function() {
      if (this._scrollerProps)
        this._transitionScrollerState(this._scrollerProps.state, 'wake');
    },

    _onScrollerInactive: function() {
      this._transitionScrollerState(this._scrollerProps.state, 'sleep');
    },
    
//    _activateScroller: function() {
//      if (this.scrollerProps.state != INACTIVE)
//        return;
//      
//      this._transition
//    },
//
//    _deactivateScroller: function() {      
//      doc.removeEventListener(TOUCH_EVENTS.touchstart, this, true);
//      doc.removeEventListener(TOUCH_EVENTS.touchend, this, true);
//      doc.removeEventListener(TOUCH_EVENTS.touchmove, this, true);
//    },
//
//    _onSizeInvalidated: _.debounce(function(e) {
    _onSizeInvalidated: function(e) {
      if (!this.rendered)
        return;
      
      console.log('invalidated size');
      this._calculateSizes();
      if (!this._isInBounds())
        this._snapScroller(true);
//    }, 100),
    },
    
    _calculateSizes: function() {
      var s = this._scrollerProps,
          frame = s.frame,
//          scrollWidth = this.el.offsetWidth,
//          scrollHeight = this.el.offsetHeight,
          scrollWidth = this.el.scrollWidth,
          scrollHeight = this.el.scrollHeight,
          containerWidth = frame.offsetWidth,
          containerHeight = frame.offsetHeight,
          scrollX = this._getScrollAxis() == 'X',
          hadPosition = !!s.position,
          gutter = s.MAX_OUT_OF_BOUNDS;
      
      if (!scrollHeight || !containerHeight)
        return false;

//      if (hadPosition) {
//        debugger;
//      }
      
      _.extend(s, {        
        position: {
            X: 0,
            Y: 0
        },
        
        metrics: {
          snapGrid: {
            X: containerWidth,
            Y: containerHeight
          },
          container: {
            X: containerWidth,
            Y: containerHeight
          },
          content: {
            X: scrollWidth,
            Y: scrollHeight,
            rawX: scrollWidth,
            rawY: scrollHeight
          }
        },
        
        scrollBounds: {
          X: {
            min: scrollX ? containerWidth - scrollWidth : 0, 
            max: 0
          },
          Y: {
            min: !scrollX ? containerHeight - scrollHeight : 0,
            max: 0
          }  
        },
        
        bounceBounds: {
          X: {
            min: scrollX ? containerWidth - scrollWidth - gutter : 0, 
            max: 0
          },
          Y: {
            min: !scrollX ? containerHeight - scrollHeight - gutter : 0,
            max: 0
          }  
        }
      });

      if (hadPosition)
        this._updateScrollPosition();
    },

    _transitionScrollerState: function(fromState, withEvent, event) {
      console.log('state: ' + fromState + ', event: ' + withEvent);
      try {
        return (this._scrollerProps.state = TRANSITION_MAP[fromState][withEvent].call(this, event));
      } finally {
        if (fromState !== this._scrollerProps.state)
          console.log('scroller state changed from ' + fromState.toUpperCase() + ' to ' + this._scrollerProps.state.toUpperCase());
      }
    },    
    
    _queueScrollTimeout: function(fn, time) {
      this._scrollerProps.timeouts.push(setTimeout(fn, time));
    },
    
    _resetScroller: function(wake) {
//      console.log('resetting scroll');
      this._cleanupScroller();
      this._transitionScrollerState(INACTIVE, 'wake');
    },
    
    _cleanupScroller: function() {
      var s = this._scrollerProps;
      this._clearScrollTimeouts();
      this._clearTouchHistory();
      s.dragging = s.decelerating = s.coasting = s.preventClick = s.touchendReceived = false;
      s.startTimestamp = s.lastTimestamp = s.distanceTraveled = s.timeTraveled = 0;
      
      U.CSS.setStylePropertyValues(this.el.style, {
        transition: null
      });      
      
      doc.removeEventListener(TOUCH_EVENTS.touchmove, this, true);
      doc.removeEventListener(TOUCH_EVENTS.touchend, this, true);
      doc.removeEventListener(TOUCH_EVENTS.touchstart, this, true);
    },
    
    _clearTouchHistory: function() {
      var s = this._scrollerProps;
      s.touchHistory.length = s.distanceTraveled = s.timeTraveled = 0;
    },
    
    _clearScrollTimeouts: function() {
      var timeouts = this._scrollerProps.timeouts;   
      for (var i = 0; i < timeouts.length; i++) {
        clearTimeout(timeouts[i]);
      }
      
      timeouts.length = 0;
    },

    _updateTouchHistory: function(e, touch) {
      var s = this._scrollerProps,
          history = s.touchHistory;
      
      history.push({
        X: touch.clientX,
        Y: touch.clientY,
        timeStamp: e.timeStamp
      });

      if (history.length > 1) {
        var g = s.lastGesture = this._getLastGesture();
        s.distanceTraveled += g.distance;
        s.timeTraveled += g.time;
        
        if (history.length > 30)
          history = history.slice(history.length - 10);
      }
    },
    
    _getLastGesture: function() {
      var history = this._scrollerProps.touchHistory,
          l = history.length;
      
      if (l > 1)
        return getGesture(history[l - 2], history[l - 1]);
      else
        return null;
    },
    
    _updateScrollPosition: function(x, y) {
//      console.log('updating scroll position:', x, y);
      var pos = this._scrollerProps.position;
      if (arguments.length) {
        if (arguments.length == 1) { // passed in position object
          _.extend(pos, arguments[0]);
        }
        else {
          pos.X = x;
          pos.Y = y;
        }
      }
      else {
        var style = document.defaultView.getComputedStyle(this.el, null);
        this._scrollerProps.position = U.CSS.parseTranslation(U.CSS.getStylePropertyValue(style, 'transform'));
      }
    },
    
    _getScrollerState: function() {
      return this._scrollerProps.state;
    },
    
    handleEvent: function(e) {
      var state = this._getScrollerState(),
          stateHandlers = TRANSITION_MAP[state],
          eventType = e.type;
      
      if (stateHandlers && stateHandlers[eventType])
        this._transitionScrollerState(state, eventType, e);
    },
    
    _onClickInScroller: function(e) {
      var ok = !this._scrollerProps.preventClick;
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
      }
      
      return ok;
    },
    
    onTransitionEnd: function(e) {
//      U.CSS.setStylePropertyValues(this.el.style, {
//        transition: null
//      });
      this.log('event', 'transitionend event: ' + e.propertyName);
    },
    
    _triggerScrollEvent: function(type, scroll) {
      this.$el.trigger(type, scroll || this._getScrollOffset());
    },
    
    _scrollTo: function(offsetX, offsetY, time, ease) {
      console.log('scrolling to: ' + offsetX + ', ' + offsetY);
      time = time || 0;
      var s = this._scrollerProps,
          content = s.metrics.content,
          bounce = s.bounce;
      
      if (!time)
        this._updateScrollPosition(offsetX, offsetY);
      else
        this._queueScrollTimeout(this._updateScrollPosition.bind(this, offsetX, offsetY), time);
      
      U.CSS.setStylePropertyValues(this.el.style, {
        transition: 'all {0}ms {1}'.format(time, time == 0 ? '' : ease || beziers.fling),
        transform: 'translate3d({0}px, {1}px, 0px)'.format(offsetX, offsetY)
      });      

      this._triggerScrollEvent('scroll');
    },

    _getScrollPosition: function() {
      return this._scrollerProps.position;
    },

    _getScrollOffset: function() {
      return scrollPosToOffset(this._scrollerProps.position);
    },

    _isInBounds: function(position, includeBounceGutter, borderIsOut) {
      var s = this._scrollerProps,
          axis = this._getScrollAxis();
      
      return isInRange(s.position[axis], 
                       (includeBounceGutter ? s.bounceBounds : s.scrollBounds)[axis], 
                       !borderIsOut);
    },

    _limitToBounds: function(position, includeBounceGutter) {
      var s = this._scrollerProps;
      return limitToBounds(position, 
                           includeBounceGutter ? s.bounceBounds : s.scrollBounds);
    },
    
    _snapScrollerIfNeeded: function() {
      if (this._isInBounds())
        return;
      
      doc.addEventListener(TOUCH_EVENTS.touchstart, this, true);
      this._snapScroller();
      return true;
    },
    
    _snapScroller: function(immediate) {
      this._clearScrollTimeouts();
      // snap the content div to its frame
      console.log('snapping scroller');
      var s = this._scrollerProps,
          axis = this._getScrollAxis();
      
      this._snapScrollerTo(axis, 
                           s.position[axis] < s.scrollBounds[axis].min ? 'min' : 'max', 
                           immediate);
    },
    
    _snapScrollerTo: function(axis, endpoint, immediate) {
      var s = this._scrollerProps,
          snapTo = _.clone(s.position),
          time;
      
      snapTo[axis] = s.scrollBounds[axis][endpoint];
      time = immediate ? 0 : this._calcAnimationTime(Math.abs(snapTo[axis] - s.position[axis]));    
      this._scrollTo(snapTo.X, snapTo.Y, time, beziers.bounce, time);
      this._scheduleScrollerStateTransition(SNAPPING, 'snapcomplete', {
        time: time,
        to: snapTo
      }, time);
    },
    
    _scheduleScrollerStateTransition: function(fromState, eventName, eventData, time) {
      this._queueScrollTimeout(this._transitionScrollerState.bind(this, fromState, eventName, eventData), time);
    },

    _calcAnimationTime: function(distance) {
      return Math.min(calcAnimationTime(distance), this._scrollerProps.MAX_COAST_TIME);
    },

    _getScrollAxis: function() {
      return this._scrollerProps.axis;
    },
    
    _setScrollAxis: function(axis) {
      this._scrollerProps.axis = axis;      
    },

    _updateEndVelocity: function(direction) {
      var s = this._scrollerProps,
          axis = this._getScrollAxis(),
          lastGesture = s.lastGesture,
          velocity = lastGesture[axis] / lastGesture.time;
      
      return (s.velocity = velocity);
    },

    _flingScrollerIfNeeded: function() {
      var s = this._scrollerProps;
      this._updateEndVelocity();
      if (!this._isInBounds(s.position, false /* don't include bounce gutter */, true /* border counts as out */)) { 
        var axis = this._getScrollAxis(),
            offset = s.position[axis],
            tooBig = offset > s.scrollBounds[axis].max;
          
        if ((tooBig && s.velocity < 0) || (!tooBig && s.velocity > 0)) {
          this._flingScroller();
          return true;
        }
      }
      else if (Math.abs(s.velocity) > 0.5) {
        this._flingScroller();
        return true;
      }
    },
    
    _flingScroller: function() {
      this._clearScrollTimeouts();
      doc.addEventListener(TOUCH_EVENTS.touchstart, this, true);
      var s = this._scrollerProps,
          axis = this._getScrollAxis(),
          otherAxis = oppositeDir(axis),
          velocity = s.velocity,
          acceleration = velocity < 0 ? 0.0005 : -0.0005,
          distance = - (velocity * velocity) / (2 * acceleration),
          newPos = {},
          destination,
          pastDestination,
          timeToDestination,
          timeToReset;

      newPos[axis] = s.position[axis] + distance;
      newPos[otherAxis] = s.position[otherAxis];
      destination = this._limitToBounds(newPos);
//      pastDestination = this._limitToBounds(newPos, true);
      timeToDestination = timeToReset = this._calcAnimationTime(distance);    
      this._scrollTo(destination.X, destination.Y, timeToDestination, beziers.fling);      
      this._scheduleScrollerStateTransition(COASTING, 'coastcomplete', {
        to: destination,
        time: timeToDestination
      }, timeToDestination);
      
      
      // queue up events
      var period = s.SCROLL_EVENT_PERIOD,
          numScrollEvents = timeToReset / period,
          distanceUnit = (destination[axis] - s.position[axis]) / numScrollEvents, 
          pingPos = _.clone(s.position),
          scrollTime = 0;
      
      for (var i = 0; i < numScrollEvents; i++) {
        this._queueScrollTimeout(function() {
          pingPos[axis] += distanceUnit;
          this._triggerScrollEvent('scroll', scrollPosToOffset(pingPos));
        }.bind(this), scrollTime += period);
      }      
    }
  }
  
  return Scrollable;
});