/** DOMReady v2.0.1 - MIT license - https://github.com/freelancephp/DOMReady */
(function(a){a.DOMReady=function(){var b=[],c=false,d=null,e=function(a,b){try{a.apply(this,b||[])}catch(c){if(d)d.call(this,c)}},f=function(){c=true;for(var a=0;a<b.length;a++)e(b[a].fn,b[a].args||[]);b=[]};this.setOnError=function(a){d=a;return this};this.add=function(a,d){if(c){e(a,d)}else{b[b.length]={fn:a,args:d}}return this};if(a.addEventListener){a.document.addEventListener("DOMContentLoaded",function(){f()},false)}else{(function(){if(!a.document.uniqueID&&a.document.expando)return;var b=a.document.createElement("document:ready");try{b.doScroll("left");f()}catch(c){setTimeout(arguments.callee,0)}})()}return this}()})(window);

DOMReady.add( function () {
  'use strict';
  var div = d.createElement('div');
  div.className = 'mainDiv';
  div.style.background = 'none';
  if (localStorage  &&  localStorage.getItem)
    localStorage.setItem('homePage', Lablz.homePage);
    
  div.innerHTML = Lablz.homePage;
  if (window.location.hash) { 
    div.style.display = 'none';
  }
  d.getElementById('page').appendChild(div);
  /*setTimeout(function() {*/
    var s = d.createElement('script'); 
    s.type = 'text/javascript';
    s.charset = 'utf-8';
    s.async = true;
    
    s.src = Lablz.initScript.src; 
    s.setAttribute('data-main', Lablz.initScript['data-main']);
    var head = d.getElementsByTagName('head')[0];
    head.appendChild(s);
/*  }, 0); */
    
    Lablz.serverName = (function() {     
      var s = d.getElementsByTagName('base')[0].href;
      return s.match("/$") ? s.slice(0, s.length - 1) : s;
    })();
    
    for (var i = 0, r = Lablz.X_CSS; i < r.length; i++) {
      var l = d.createElement('link');
      l.rel = 'stylesheet';
      l.type = 'text/css';
      l.href = r[i]; 
      head.appendChild(l);
    }
});