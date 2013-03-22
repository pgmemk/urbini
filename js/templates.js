//'use strict';
define([
  'globals',
  'fileCache!../templates.jsp',
  'jquery', 
  'underscore',
  'events'
], function(G, HTML, $, _, Events) {
  _.templateSettings = {
    evaluate:    /\{\{(.+?)\}\}/g,
    interpolate: /\{\{=(.+?)\}\}/g
//    variable: 'G'
  };
  
  var Templates = {
    // Hash of preloaded templates for the app
    templates: {},
    propTemplates: {
      "string": "stringPT",
      "boolean": "booleanPT",
      "int": "intPT",
      "float": "intPT",
      "double": "intPT",
      "emailAddress": "emailPT",
      "phone": "telPT",
      "mobilePhone": "telPT",
      "Url": "UrlPT",
      "system/primitiveTypes/Duration": "durationPT",
      "date": "datePT",
      "dateTime": "datePT",
      "resource": "resourcePT",
      "model/company/Money": "moneyPT",
      "ComplexDate": "complexDatePT",
      "Image": "imagePT"
    },

    propEditTemplates: {
      "string": "stringPET",
      "enum": "enumPET",
      "enum1": "shortEnumPET",
      "enum2": "longEnumPET",
      "resource": "resourcePET",
      "boolean": "booleanPET",
      "phone": "telPET",
      "mobilePhone": "telPET",
      "emailAddress": "emailPET",
      "date": "datePET",
      "ComplexDate": "datePET",
      "system/primitiveTypes/Duration": "datePET",
//    "model/portal/Image": "fileUpload",
      "model/company/Money": "moneyPET"
//       ,
//      "boolean": "booleanPET",
//      "int": "intPET",
//      "float": "intPET",
//      "double": "intPET",
//      "http://www.hudsonfog.com/voc/system/fog/Url": "UrlPET",
//      "Duration": "complexDatePET",
//      "resource": "resourcePET",
//      "http://www.hudsonfog.com/voc/model/company/Money": "moneyPET",
//      "http://www.hudsonfog.com/voc/system/fog/ComplexDate": "complexDatePET",
//      "http://www.hudsonfog.com/voc/model/portal/Image": "imagePET"
    },

 
    // This implementation should be changed in a production environment:
    // All the template files should be concatenated in a single file.
    loadTemplates: function() {
      var elts = $('script[type="text/template"]', $(HTML));
      _.each(elts, function(elt) {
        this.templates[elt.id] = {
          'default': elt.innerHTML
        };
      }.bind(this));
    },
 
    _treatTemplate: function(text) {
      text = text.trim();
      var matches = text.match(/<script[^>]*>([\s\S]*)<\/script>/);
      return matches ? matches[1] : text;
    },
    
    addCustomTemplate: function(template) {
      var type = template.get('modelDavClassUri');
      var templates = this.templates[template.get('templateName')];
      if (!templates) // currently, only allow to override default templates
        return;
      
      templates[type || 'default'] = this._treatTemplate(template.get('templateText'));
      Events.trigger('templateUpdate', template);
      
//      var elts = $(template.get('templateText'));
//      _.each(elts, function(elt) {
//        var templates = this.templates[elt.id];
//        if (!templates) // currently, only allow to override default templates
////          return;
//        
//        templates[type] = elt.innerHTML;
//        Events.trigger('templateUpdate', template);
//      }.bind(this));
    },
    
    // Get template by name from hash of preloaded templates
    /**
     * @param name: template name
     * @param custom: set to false if you want the default template, otherwise will return custom template (if available, else default template)
     */
    get: function(name, type) {
      var templates = this.templates[name];
      return type ? templates[type] : templates['default'];
    },
    
    getDefaultTemplate: function(name) {
      var template = this.templates[name];
      return template && template['default'];      
    },

    getCustomTemplate: function(name, type) {
      var template = this.templates[name];
      return template && template[type]; 
    },

    getPropTemplate: function(prop, edit, val) {
      var t = edit ? Templates.propEditTemplates : Templates.propTemplates;
      var template;
      if (prop.facet  &&  !prop.multiValue)
        template = t[prop.facet];
      if (!template) {
        if (prop.multiValue  &&  edit)
          return t.resource;
        template = t[prop.range];
      }
      
      return template ? template : (prop.range.indexOf('/') == -1 && prop.range != 'Class' ? t.string : t.resource);
    },
    __DEFAULT_TEMPLATE: '<!-- put your template code here -->',
    prepNewTemplate: function(t) {
      if (t.vocModel.type !== G.commonTypes.Jst)
        return;
      
      if (!t.get('templateText')) {
        var tName = t.get('templateName');
        var text;
        if (tName)
          text = Templates.get(tName);
        
        text = text || Templates.__DEFAULT_TEMPLATE;
        t.set({templateText: text});
      }
    }
  };
  
  Events.on('newResource', Templates.prepNewTemplate);
  Events.on('newTemplate', Templates.prepNewTemplate);

  return Templates;
});