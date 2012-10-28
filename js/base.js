window.Lablz = window.Lablz || {};
var packages = {};

// START ///////////// Models //////////////// START ///
packages.Resource = Backbone.Model.extend({
  dateLastUpdated: 0,
  idAttribute: "_uri",
  initialize: function() {
    _.bindAll(this, 'getKey', 'parse', 'url', 'validate', 'validateProperty', /*'set',*/ 'updateDB'); // fixes loss of context for 'this' within methods
//    this.bind('change', this.onChange);
    this.on('change', this.updateDB);
    var type = this.constructor.type || this.get('type');
    if (!type)
      return this;
    
    if (type.indexOf) {
      this.type = type;
      this.className = type.substring(type.lastIndexOf("/") + 1);
    }
    else {
      this.className = type.name;
      this.type = type._uri;
    }
    
    this.urlRoot = Lablz.apiUrl + this.className;
//    this._setUri();
  },  
  url: function() {
    return Lablz.apiUrl + this.className + "?_uri=" + encodeURIComponent(this.get('_uri'));
  },
  getKey: function() {
    return this.get('_uri');
  },
  parse: function (resp) {
    if (this.lastFetchOrigin == 'db')
      return resp;
    
    if (!resp || resp.error)
      return {};

    var uri = resp._uri;
    resp = uri ? resp : resp.data[0];
    resp._shortUri = Utils.getShortUri(uri, this.constructor);
    var primaryKeys = Utils.getPrimaryKeys(this.constructor);
    resp._uri = Utils.getLongUri(resp._uri, this.type, primaryKeys);
    return resp;
  },
  validate: function(attrs) {
    for (var name in attrs) {
      var validated = this.validateProperty(name, attrs[name]);
      if (validated !== true)
        return validated instanceof String ? error : "Please enter a valid " + name;
    }
  },
  validateProperty: function(name, value) {
    var meta = this.constructor.properties[name];
    if (!meta)
      return true;
    
    var type = meta.type;
    if (type == 'email')
      return Utils.validateEmail(value) || false;
//    else if (type == 'tel')
//      return Utils.validateTel(value) || false;
      
    // check annotations
    var anns = meta.annotations;
    if (!anns)
      return true;
    
    for (var i = 0; i < anns.length; i++) {
      var error;
      switch (anns[i]) {
        case "@r":
          error = value == null && (name + " is required");
          break;
      }
      
      if (typeof error != 'undefined')
        return error;
    }
    
    return true;
  },
  updateDB: function() {
    if (this.lastFetchOrigin != 'db' && !this.collection) // if this resource is part of a collection, the collection will update the db in bulk
      Lablz.indexedDB.addItem(this);
  },
  isA: function(interfaceName) {
    return Utils.isA(this.constructor, interfaceName);
  },
  fetch: function(options) {
    options = options || {};
    options.silent = true;
    return Backbone.Model.prototype.fetch.call(this, options);
  }
//  ,
//  loadMap: function() {
//    var url = url();
//    url += (url.indexOf("?") == -1 : "?" : "&") + "$map=y";
//  }
//  
//  ,
//  set: function(attrs, options) {
//    options = options || {};
////    options.silent = this.lastFetchOrigin == 'db';
//    return Backbone.Model.prototype.set.call(this, attrs, options);
//  },  
},
{
  type: "http://www.w3.org/TR/1999/PR-rdf-schema-19990303#Resource",
  shortName: "Resource",
  displayName: "Resource",
  myProperties: {
    davDisplayName: {type: "string"},
    _uri: {type: "resource"},
    _shortUri: {type: "resource"}
  },
  myInterfaces : {}
});

packages.Resource.properties = _.clone(packages.Resource.myProperties);
packages.Resource.interfaces = _.clone(packages.Resource.myInterfaces);

Lablz.ResourceList = Backbone.Collection.extend({
//  page: 1,
//  resultsPerPage: 10,
  initialize: function(models, options) {
    if (!models && !options.model)
      throw new Error("resource list must be initialized with options.model or an array of models");
    
    _.bindAll(this, 'getKey', 'parse'); //, 'onAdd'); //, 'fetch'); // fixes loss of context for 'this' within methods
    this.model = options.model || models[0].model;
    this.on('add', this.onAdd, this);
    this.on('reset', this.onReset, this);
//    this.model = metadata.model;
    this.type = this.model.type;
    this.className = this.model.shortName || this.model.className;
    this.url = Lablz.apiUrl + this.className;
    console.log("init " + this.className + " resourceList");
  },
  getKey: function() {
    return this.type;
  },
//  url: function() {
//    this.url = Lablz.apiUrl + this.className + "?$limit=" + this.resultsPerPage + "&$offset=" + ((this.page - 1) * this.resultsPerPage);
//  },
  isA: function(interfaceName) {
    return Utils.isA(this.model, interfaceName);
  },
  parse: function(response) {
    if (!response || response.error)
      return [];
    
    return response instanceof Array ? response : response.data;
  },
  onReset: function(model) {
    console.log("resourceList onReset");
  },
  onAdd: function(model) {
//    console.log("resourceList onAdd");
  },
  fetchAll: function(options) { 
    return Backbone.Model.prototype.fetch.call(this, options);
  },
  fetch: function(options) {
    options = options || {};
    options.silent = true;
    return Backbone.Collection.prototype.fetch.call(this, options);
  }

//  ,
//  onAdd: function(item) {
//    if (this.lastFetchOrigin == 'db')
//      return;
//    
//    var timestampProp = this.model.timestamp;
//    if (!timestampProp)
//      return;
//    
//    var existing = this.where({_uri: item.get('_uri')});
//    if (!existing || !existing.length)
//      return;
//    
//    var dateModified = item[timestampProp];
//    if (dateModified && (!this.has(timestampProp) || dateModified > this.get(timestampProp))) {
//      this.remove(existing);
//      Lablz.indexedDB.addItem(item);
//    }
//  }
});

Lablz.MapModel = Backbone.Model.extend({
  initialize: function(options) {
    _.bindAll(this, 'parse', 'url'); // fixes loss of context for 'this' within methods
    this.baseUrl = options && options.url;
  },  
  
  url: function() {
//    var base = this.get('url');
    return this.baseUrl + (this.baseUrl.indexOf("?") == -1 ? "?" : "&") + "$map=y";
  },
//  getKey: function() {
//    return this.url();
//  },
  parse: function (resp) {
    return resp;
  },
})

// END ///////////// Models //////////////// END ///


// START ///////////// Backbone sync override //////////////// START ///

Lablz.defaultSync = function(method, model, options) {
  model.lastFetchOrigin = 'server';
  Backbone.defaultSync(method, model, options);
};

Backbone.defaultSync = Backbone.sync;
Backbone.sync = function(method, model, options) {
  var defSuccess = options.success;
  var save;
  if (model instanceof Backbone.Collection) {
      save = function(results) {
      // only handle collections here as we want to add to db in bulk, as opposed to handling 'add' event in collection and adding one at a time.
      // If we switch to regular fetch instead of Backbone.Collection.fetch({add: true}), collection will get emptied before it gets filled, we will not know what really changed
      // Alternative is to override Backbone.Collection.reset() method and do some magic there.
  //    if (!(model instanceof Backbone.Collection))
  //      return;
      
      var tsProp = model.model.timestamp; // model.model is the collection's model 
      var toAdd = [];
      for (var i = 0; i < results.length; i++) {
        var r = results[i];
        var longUri = Utils.getLongUri(r._uri, model.type);
        var saved = model.get(longUri)[tsProp];
//        var saved = $.grep(model.models, function(o) {
//          return o.id == longUri;
//        })[0][tsProp];
        if (typeof saved === "undefined")
          saved = 0;
        var newLastModified = r[tsProp];
        if (typeof newLastModified === "undefined") 
          newR = 0;
        if (!tsProp || !newLastModified || newLastModified > saved) {
          toAdd.push(r); //new model.model(r));
        }
      }
      
      if (toAdd.length) {
        for (var i = 0; i < toAdd.length; i++) {
          var existing = model.get(toAdd[i]._uri);
          existing && existing.set(toAdd[i], {silent: true});
        }
        
        Lablz.indexedDB.addItems(toAdd, model.className);
      }
    }
  }

  var saveOptions = _.extend(_.clone(options), {
    success: function(resp, status, xhr) {
      if (resp.error) {
        console.log("Error in sync: " + resp.error.code + ", " + resp.error.details);
        return;
      }
      
      var data = model instanceof Backbone.Collection ? resp.data : resp.data[0];
      defSuccess && defSuccess(data, status, xhr);
      save && save(data);
    }
  });
    
  var runDefault = function() {
    return Lablz.defaultSync(method, model, saveOptions);
  }
  
  if (method !== 'read')
    return runDefault();
    
  var key, now, timestamp, refresh;
  var success = function(results) {
//      refresh = options.forceRefresh;
//      if (refresh || !timestamp || ((now - timestamp) > this.constants.maxRefresh)) {
//        // make a network request and store result in local storage
//        var success = options.success;
//        options.success = function(resp, status, xhr) {
//          // check if this is an add request in which case append to local storage data instead of replace
//          if(options.add && resp.values) {
//            // clone the response
//            var newData = JSON.parse(JSON.stringify(resp));
//            // append values
//            var prevData = $storage.get(key);
//            newData.values = prevData.values.concat(resp.values);
//            // store new data in local storage
//            $storage.set(key, newData);
//          } else {
//            // store resp in local storage
//            $storage.set(key, resp);
//          }
//  //        var now = new Date().getTime();
//          $storage.set(key + ":_uri", uri);
//          success(resp, status, xhr);
//        };
//        // call normal backbone sync
//        Backbone.defaultSync(method, model, options);
//      } else {
      // provide data from local storage instead of a network call
    if (!results || (results instanceof Array && !results.length)) {
      runDefault();
      return;
    }

    // simulate a normal async network call
    setTimeout(function(){
      var success = options.success;
      options.success = function(resp, status, xhr) {
        if (success) {
          console.log("got resources from db");
          success(resp, status, xhr);
        }
        
        return runDefault();
      }
      
      model.lastFetchOrigin = 'db';
      options.success(results, 'success', null);
    }, 0);    
  }
  
  var error = function(e) {
    if (e) console.log("Error fetching data from db: " + e);
    runDefault();      
  }
  
  // only override sync if it is a fetch('read') request
  key = this.getKey && this.getKey();
  if (!key || !Lablz.indexedDB.getDataAsync(key, success, error))
    runDefault();
}

// END ///////////// Backbone sync override //////////////// END ///


// START ///////////// Templates and Backbone convenience //////////////// START ///

Backbone.Model.prototype._super = function(funcName){
  return this.constructor.__super__[funcName].apply(this, _.rest(arguments));
};

Lablz.templates = {
  "string": "stringTemplate",
  "int": "intTemplate",
  "email": "emailTemplate",
  "date": "dateTemplate",
  "resource": "resourceTemplate",
  "Money": "moneyTemplate",
  "ComplexDate": "complexDateTemplate",
  "image": "imageTemplate"
};

Backbone.View.prototype.close = function(){
  this.remove();
  this.unbind();
  if (this.onClose){
    this.onClose();
  }
}

Lablz.models = [packages.Resource];
Lablz.shortNameToModel = {};
Lablz.initModels = function() {
  for (var i = 0; i < Lablz.models.length; i++) {
    var m = Lablz.models[i];
    Lablz.shortNameToModel[m.shortName] = m;
    m.prototype.parse = packages.Resource.prototype.parse;
    m.prototype.validate = packages.Resource.prototype.validate;
    var superProps = m.__super__.constructor.properties;
    m.properties = superProps ? _.extend(_.clone(superProps), m.myProperties) : _.clone(m.myProperties);
    var superInterfaces = m.__super__.constructor.interfaces;
    m.interfaces = superProps ? _.extend(_.clone(superProps), m.myInterfaces) : _.clone(m.myInterfaces);
  }
};

// END ///////////// Templates and Backbone convenience //////////////// END ///


// START ///////////// IndexedDB stuff //////////////// START ///

window.indexedDB = window.indexedDB || window.webkitIndexedDB || window.mozIndexedDB;

if ('webkitIndexedDB' in window) {
  window.IDBTransaction = window.webkitIDBTransaction;
  window.IDBKeyRange = window.webkitIDBKeyRange;
}

//Lablz.resourceType = "Urbien";
Lablz.indexedDB = {};
Lablz.indexedDB.db = null;
Lablz.DB_VERSION = 1;

Lablz.indexedDB.onerror = function(e) {
  console.log("db error: " + e);
};

Lablz.indexedDB.defaultOptions = {keyPath: '_uri'};
Lablz.indexedDB.open = function(storeNames, options, success, error) { // optional params: "storeName" to create, "options" to create it with
  var request = indexedDB.open("lablz");

  request.onblocked = function(event) {
    alert("Please close all other tabs with this site open!");
  };
  
  request.onsuccess = function(e) {
    Lablz.indexedDB.db = e.target.result;
    var db = Lablz.indexedDB.db;
    db.onversionchange = function(event) {
      db.close();
      alert("A new version of this page is ready. Please reload!");
    };    
      
    var newStoreNames = [];
    storeNames = storeNames instanceof String ? [storeNames] : storeNames;
    for (var i = 0; i < storeNames.length; i++) {
      if (!db.objectStoreNames.contains(storeNames[i]))
        newStoreNames.push(storeNames[i])
    }
    
    Lablz.DB_VERSION = newStoreNames.length == 0 ? db.version : db.version + 1;

    if (db.version == Lablz.DB_VERSION) {
      if (success)
        success();
      
      return;
    }
    
    if (db.setVersion) {
      console.log("in old setVersion: "+ db.setVersion); // deprecated but needed for Chrome
      
      // We can only create Object stores in a setVersion transaction or an onupgradeneeded callback;
      var req = db.setVersion(Lablz.DB_VERSION);
      // onsuccess is the only place we can create Object Stores
      req.onerror = Lablz.indexedDB.onerror;
      req.onsuccess = function(e) {
        for (var i = 0; i < newStoreNames.length; i++) {
          var name = newStoreNames[i];
          if (db.objectStoreNames.contains(name))
            db.deleteObjectStore(name);
  
          db.createObjectStore(name, options || Lablz.indexedDB.defaultOptions);
        }
        
        e.target.transaction.oncomplete = function() {
          if (success)
            success();
        };
      };      
    }
    else {
      db.close();
      var subReq = indexedDB.open("lablz", Lablz.DB_VERSION);
      subReq.onsuccess = request.onsuccess;
      subReq.onerror = request.onerror;
      subReq.onupgradeneeded = request.onupgradeneeded;
    }
  };
  
  request.onupgradeneeded = function(e) {
    console.log ("going to upgrade our DB!");
    Lablz.indexedDB.db = e.target.result;
    var db = Lablz.indexedDB.db;
    var newStoreNames = [];
    storeNames = storeNames instanceof String ? [storeNames] : storeNames;
    for (var i = 0; i < storeNames.length; i++) {
      if (!db.objectStoreNames.contains(storeNames[i]))
        newStoreNames.push(storeNames[i])
    }
    
    for (var i = 0; i < newStoreNames.length; i++) {

      var name = newStoreNames[i];
      if (db.objectStoreNames.contains(name))
        db.deleteObjectStore(name);

      db.createObjectStore(name, options || Lablz.indexedDB.defaultOptions);
    }
    
    e.target.transaction.oncomplete = function() {
//      Lablz.indexedDB.getItems(storeName);
      if (success)
        success();
    };
    
  }
  
  request.onerror = function(e) {
    if (error)
      error(e);
    
    Lablz.indexedDB.onerror(e);
  };
};

Lablz.indexedDB.addItems = function(items, className) {
  if (!items || !items.length)
    return;
  
  var db = Lablz.indexedDB.db;
  if (!db)
    return;
  
  if (!db.objectStoreNames.contains(className)) {
    db.close();
    Lablz.indexedDB.open(className, null, function() {Lablz.indexedDB.addItems(items, className)});
    return;
  }
  
  var trans = db.transaction([className], "readwrite");
  var store = trans.objectStore(className);
  _.each(items, function(item) {
    var request = store.put(item);
  
    request.onsuccess = function(e) {
//      console.log("Added item to db: ", e);
    };
  
    request.onerror = function(e) {
      console.log("Error adding item to db: ", e);
    };
  });
};

Lablz.indexedDB.addItem = function(item, className) {
  Lablz.indexedDB.addItems([item instanceof Backbone.Model ? item.toJSON() : item], className || item.className);
}

//Lablz.indexedDB.addItem = function(itemModel, success, error) {
////  var type = Utils.getType(itemModel.get('_uri'));
//  var name = itemModel.className;
//  var db = Lablz.indexedDB.db;
//  if (!db.objectStoreNames.contains(name)) {
//    db.close();
//    Lablz.indexedDB.open(name, null, function() {Lablz.indexedDB.addItem(itemModel)});
//    return;
//  }
//
//  var trans = db.transaction([name], "readwrite");
//  var store = trans.objectStore(name);
//  var request = store.put(itemModel.toJSON());
//
//  request.onsuccess = function(e) {
//    if (success) success(e);
//  };
//
//  request.onerror = function(e) {
//    console.log("Error Adding: ", e);
//    if (error) error(e);
//  };
//};

Lablz.indexedDB.deleteItem = function(uri) {
  var type = Utils.getType(item._uri);
  var name = Utils.getClassName(type);
  var db = Lablz.indexedDB.db;
  var trans = db.transaction([type], "readwrite");
  var store = trans.objectStore(type);
  var request = store.delete(uri);

  request.onsuccess = function(e) {
//    Lablz.indexedDB.getItems(type);
  };

  request.onerror = function(e) {
    console.log("Error Deleting: ", e);
  };
};

Lablz.indexedDB.getDataAsync = function(uri, success, error) {
  var type = Utils.getType(uri);
  if (type == uri)
    return Lablz.indexedDB.getItems(type, success, error);
  
  var name = Utils.getClassName(type);
  var db = Lablz.indexedDB.db;
  if (!db || !db.objectStoreNames.contains(name))
    return false;
  
  var trans = db.transaction([name]);
  var store = trans.objectStore(name);
  var request = store.get(Utils.getShortUri(uri, Lablz.shortNameToModel[name]));
  request.onsuccess = function(e) {
    if (success)
      success(e.target.result)
  };
  
  request.onerror = function(e) {
    if (error)
      error(e);
    
    Lablz.indexedDB.onerror(e);
  }
  
  return true;
}

Lablz.indexedDB.getItems = function(type, success, error) {
  // var todos = document.getElementById("todoItems");
  // todos.innerHTML = "";

  var name = Utils.getClassName(type);
  var db = Lablz.indexedDB.db;
  if (!db || !db.objectStoreNames.contains(name))
    return false;
  
  var trans = db.transaction([name]);
  var store = trans.objectStore(name);

  // Get everything in the store;
  var results = [];
  var cursorRequest = store.openCursor();
  cursorRequest.onsuccess = function(e) {
    var result = e.target.result;
    if (result) {
      results.push(result.value);
      result.continue();
    }
    else {
      if (success)
        success(results);
    }
  };

  cursorRequest.onerror = function (e) {
    if (error)
      error(e);
    
    Lablz.indexedDB.onerror(e);
  }
  
  return true;
};

// END ///////////// IndexedDB stuff //////////////// END ///