// This javascript module presents a simple CRUD interface for REST web services.
// Requires Prototype.js 1.3.1 - http://prototype.conio.net/
//
// Use it like the following:
//
//      // Basic class setup
//      Music.Artist = Class.create();
//      Music.Artist.extend(JSDBI);
//      Music.Artist.prototype = (new JSDBI()).extend( {
//          initialize: function () {
//          },
//      });
//      
//      Music.Artist.fields(['artistid', 'name']);
//      Music.Artist.url('http://someserver/rest/artist');
//      Music.Artist.elementTag('artist'); //optional
//     
//      // In the calling code
//      
//      var artist = Music.Artist.insert({name: 'Billy'});
//      var artistid = artist.id();
//      
//      artist = Music.Artist.retrieve(artistid);
//      document.write("name: "+artist.name());
//      
//      artist.name('Fred');
//      artist.update();
//      
//      artist.destroy();
//
// The REST interface must use a single url endpoint, with primary keys for the
// objects appended to the end of the url, like http://localhost/rest/artist/1
// where 1 is the primary key of the artist requested.  Retrieve and create
// will be called on the base url (http://localhost/rest/artist) and update and
// delete will be called on the object's url (http://localhost/rest/artist/1).
//
// Actions are mapped onto the REST interface in the following manner:
// retrieve - HTTP GET
// insert - HTTP PUT (accepts CGI params for field values)
// update - HTTP POST (accepts CGI params for field values)
// delete - HTTP DELETE
//
// Assuming the docTag set to 'response' and the elementTag is set to 'artist',
// the xml returned from the server should look like:
//
// <response>
//    <artist name="Fred" artistid="80"/>
// </response>
//
//
// Copyright (C) 2005 Scotty Allen <scotty@scottyallen.com>
//
// This code is freely distributable under the terms of an MIT-style license.
//
// Inspired heavily by Class::DBI - http://search.cpan.org/~tmtm/Class-DBI/lib/Class/DBI.pm
// Thanks to Scott Williams, Chris Whipple, and Jon Raphelson for letting me bounce ideas off them

// TODO current list
//  Add docs for multiple primary keys
//  Handle errors from the server

// TODO future list
//  Allow support for server push updating
//  Allow for other field types than strings (like arrays and more complex data structures)
//  Allow for more flexible definition of the REST interface
//  Allow hydration of fields (relationships)

// #################################################################
var JSDBI = Class.create();
JSDBI.Version = '0.2';
JSDBI.__updates_in_progress = 0;
JSDBI.prototype = {
    initialize: function () {
        //this.__fields = new Array();
        if(this.fields() && this.fields().length > 0){
            // only do this if the class has been properly initialized
            this.__internalUrl = this.url();
        }
        this.__fieldsChanged = [];
    },

    // Returns the primary key(s) for this object
    id: function () {
        if(this.__primaryKeys){
            var ids = new Array;
            for(var i=0;i<this.__primaryKeys.length;i++){
                var keyName=this.__primaryKeys[i]
                ids.push(this.__getField(keyName));
            }
            return ids;
        } else {
            var primaryKey = this.fields()[0];
            return this.__getField(primaryKey);
        }
    },

    toString: function() {
        return this.id().toString();
    },

    internalUrl: function (value) {
        if(value) {
            this.__internalUrl = value;
        } else {
            return this.__internalUrl;
        }
    },

    insert: function (options) {
        var params = this.__getParams();
        if(!options){
            options = {asynchronous: false};
        }
        try {
            var request = new Ajax.Request(JSDBI.base_url()+this.__url,
                                            { method: 'put',
                                              parameters: params,
                                              onSuccess: this.onInsertFinish.bindWithParams(this,options),
                                              onFailure: function(){ alert("insert failed") },
                                              asynchronous: options.asynchronous} );
        } catch (e) {
            alert("error: "+e.message);
        }
    },

    onInsertFinish: function (options,transport){
      if(!transport.responseXML){
          alert("Got bogus xml response to insert: " + transport.responseText);
      }
      this.__populate(transport.responseXML);
      if(options.onSuccess){
          options.onSuccess();
      }
    },

    // Marks a field as changed.
    __setFieldChanged: function(field_name) {
        this.__fieldsChanged.push(field_name);
    },

    // Returns true if any of the fields have changed since we last sent the
    // values to the server.
    __isChanged: function() {
        return this.__fieldsChanged.length > 0;
    },

    // Returns true if the field has changed since we last sent the values to
    // the server.
    __isFieldChanged: function(field_name) {
        for (var i = 0; i < this.__fieldsChanged.length; i++) {
            if (field_name == this.__fieldsChanged[i]) {
                return true;
            }
        }
        return false;
    },

    // Resets the lists of fields that have changed.
    __clearChanged: function() {
        this.__fieldsChanged = [];
    },

    // Sends any updated fields in the object to the server.
    update: function(callback) {
        if(!this.__isChanged()){
            // don't update if we don't need to
            return;
        }
        if (this.internalUrl() == undefined) {
          // Not yet ready to update: no url was received yet.  This object
          // must have been just created.
          this.__needs_update = true;
          return;
        }
        var params = this.__getParams();
        if(JSDBI.__updates_in_progress == 0){
            if(JSDBI.on_start_update){
                JSDBI.on_start_update();
            }
        }
        JSDBI.__updates_in_progress = JSDBI.__updates_in_progress + 1;
        this.request = new Ajax.Request(this.internalUrl(), { method: 'post',
                                                     parameters: params,
                                                     asynchronous: true,
                                                     onComplete: this.afterUpdate.bindWithParams(this,callback) } );
        this.internalUrl(this.url());
        this.__clearChanged();
        this.__needs_update = false;
        return;
    },

    afterUpdate: function (callback,transport) {
        JSDBI.__updates_in_progress = JSDBI.__updates_in_progress - 1;
        if(JSDBI.__updates_in_progress == 0){
            if(JSDBI.on_end_update){
                JSDBI.on_end_update();
            }
        }
        // XXX this is total crap.  Really need a way to detect if xml was received
        if(transport.responseText != 'OK' &&
           transport.responseText != 'ERROR' &&
           transport.responseXML != null){
            this.__populate(transport.responseXML);
        }
        if(callback != null){
            callback();
        }
    },

    // Deletes this object from the server.
    //  XXX it won't let me name this delete - is destroy a good name?
    destroy: function() {
        var request = new Ajax.Request(this.internalUrl(), { method: 'delete',
                                                     asynchronous: true} );
        return;
    },

    // Returns the server url for this object (for updating and deleting)
    url: function() {
        var url;
        if(typeof this.id() == 'number'
           || typeof this.id() == 'string'){
            url = JSDBI.base_url()+this.__url+'/'+this.id();
        } else if (typeof this.id() == 'object'){
            url = JSDBI.base_url()+this.__url+'/'+this.id().join('/');
        }
        return url;
    },

    // Takes in an xml element or document, and populates the fields for this object from it.
    // Also populates any children that are included in the xml.
    __populate: function(xml) {
        if(xml.nodeName != this.__elementTag){
            var elements = xml.getElementsByTagName(this.__docTag);
            elements = elements[0].getElementsByTagName(this.__elementTag);
            xml = elements[0];
        }
        for (var i=0;i<this.__fields.length;i++){
            var field = this.__fields[i];
            if (this.__isFieldChanged(field)) {
                // Skip fields that have changed since we sent them to the
                // server.  This helps prevent __populate from overwriting
                // fields that were updated after an insert request was sent,
                // but before it was received.
                continue;
            }
            if (field == this.__contentField){
                this[field](xml.textContent);
            } else {
                this[field](xml.getAttribute(field));
            }
        }

        // prepopulate any has_a relationships for which we have xml
        if(this.__has_a_relationships){
            for(var i=0;i<this.__has_a_relationships.length;i++){
                var fieldName = this.__has_a_relationships[i][0];
                var className = this.__has_a_relationships[i][1];
                var fclass = eval(className);
                var elementTag = fclass.elementTag();
                var elements = xml.getElementsByTagName(elementTag);
                for(var j=0;j<elements.length;j++){
                    var object = new fclass();
                    object.__populate(elements[j]);
                    if(object.id() == this.__getField(fieldName)){
                        this.__setField(fieldName,object);
                    }
                }
            }
        }

        // prepopulate any has_many relationships for which we have xml
        if(this.__has_many_relationships){
            for(var i=0;i<this.__has_many_relationships.length;i++){
                var fieldName = this.__has_many_relationships[i][0];
                var className = this.__has_many_relationships[i][1];
                var fclass = eval(className);
                var elementGroup = xml.getElementsByTagName(fieldName);
                if(elementGroup){
                    elementGroup = elementGroup[0];
                    var elementTag = fclass.elementTag();
                    var elements = xml.getElementsByTagName(elementTag);
                    var objects = [];
                    for(var j=0;j<elements.length;j++){
                        var object = new fclass();
                        object.__populate(elements[j]);
                        objects.push(object);
                    }
                    this.__setField(fieldName,objects);
                }
            }
        }

        this.internalUrl(this.url());

        if (this.__needs_update) {
          this.update();
        }
    },

    // returns a string containing all the fields for this object joined together as cgi parameters
    __getParams: function() {
        var paramList = "";
        for(var i=0;i<this.__fields.length;i++){
            var fieldName = this.__fields[i];
            if(this.__getField(fieldName) == undefined){
                // skip undefined values
                continue;
            }
            if(paramList){
                paramList = paramList + '&';
            }
            paramList = paramList + escape(fieldName) + '=' +
                        escape(this.__getField(fieldName));
        }
        return paramList;
    },

    // gets the value of a field without hydrating it
    __getField: function(fieldName) {
        return this['__'+fieldName];
    },
    
    // sets the value of a field
    __setField: function(fieldName, value) {
        return this['__'+fieldName] = value;
    },

    // returns the names of the fields for this object
    fields: function() {
        return this.__fields;
    }
};

// These are class methods, and thus, aren't included in the prototype.  This
// means they can't be called on instantiated objects

// TODO write docs
JSDBI.prototype.__base_url = '';
JSDBI.base_url = function (url) {
    if(url){
        return this.prototype.__base_url = url;
    } else {
        return this.prototype.__base_url;
    }
};

// gets/sets the base REST url for this class.  All actions are performed
// against this url.  If the object is specific to an already existing object,
// then the object primary key field is appended to the url, separated by
// a slash, ie: http://localhost/rest/artist/1
JSDBI.url = function (url) {
    if(url){
        // set default elementTag if it's not already set
        if((this.elementTag()) === undefined){
            var chunks = url.split('/');
            this.elementTag(chunks[chunks.length-1]);
        }
        return JSDBI.base_url() + (this.prototype.__url = url);
    } else {
        return JSDBI.base_url() + this.prototype.__url;
    }
};

// gets/sets the base xml tag for the xml documents returned from the server
// for this class.  Defaults to 'response'
JSDBI.prototype.__docTag = 'response';
JSDBI.docTag = function (docTag) {
    if(docTag){
        return this.prototype.__docTag = docTag;
    } else {
        return this.prototype.__docTag;
    }
};

// gets/sets the  xml tag for the elements that represent this object in xml
// documents returned from the server.  Defaults to the last segment of the url
// (Ie, the url http://localhost/rest/artist will result in the elementTag
// 'artist'
JSDBI.elementTag = function (elementTag) {
    if(elementTag){
        return this.prototype.__elementTag = elementTag;
    } else {
        return this.prototype.__elementTag;
    }
};

// gets/sets up the the allowed fields for the jsdbi object.  Accepts a
// array of field names.
JSDBI.fields = function (fields) {
    if(fields){
        if(this.prototype.__fields && this.prototype.__fields.length > 0){
            // we had previous fields, so delete all the previous accessors
            for(var i=0; i<this.prototype.__fields.length;i++){
                delete this.prototype[this.prototype.__fields[i]];
            }
        }

        // create all the new accessors
        for(var i=0; i<fields.length;i++){
            var field = fields[i];
            
            var obj = {}
            obj[field] = this.__createAccessor(field);
            JSDBI.inherit(this,obj);
            //this.prototype[field] = this.__createAccessor(field);
        }

        // set the list of accessors
        return this.prototype.__fields = fields;
    } else {
        return this.prototype.__fields;
    }
};

// gets/sets the field that receives the text content of the xml tag.
JSDBI.contentField = function (fieldName) {
    if(fieldName){
        return this.prototype.__contentField = fieldName;
    } else {
        return this.prototype.__contentField;
    }
};

// This may optionally be used to specify multiple primary keys.  You should
// also include these fields in the general list of fields.
JSDBI.primaryKeys = function (keyNames) {
    if(keyNames){
        return this.prototype.__primaryKeys = keyNames;
    } else {
        return this.prototype.__primaryKeys;
    }
}

// This creates nifty closures for us
JSDBI.__createAccessor = function (field){
    return function (value) {
        var thisfield = field;
        // XXX add a unit test to make sure this works with false and 0 as values
        if(value !== undefined){
            this.__setFieldChanged(thisfield);
            return this.__setField(thisfield,value);
        } else {
            return this.__getField(thisfield);
        }
    };
};

// Retrieves an existing object from the server, given the object id
JSDBI.retrieve = function (id) {
    // more crazy shit - this actually gets an instance of the current class,
    // amazingly
    var object = new this();

    var url;
    if(typeof id == 'number'
       || typeof id == 'string' ){
        url = this.url()+'/'+id;
    } else if (typeof id == 'object'){
        url = this.__url;
        for(var i=0;i<this.__primaryKeys.length;i++){
            var keyName=this.__primaryKeys[i]
            url = url+'/'+id[keyName];
        }
    } else {
        alert("couldn't match type of id: "+typeof id);
    }
    var request = new Ajax.Request(url,
                                   { method: 'get',
                                     asynchronous: false } );

    if(!request.transport.responseXML){
        alert("Got bogus xml response to retrieve: "+request.transport.responseText);
    }
    object.__populate(request.transport.responseXML);
    return object;
};

// Creates a new object on the server.  Accepts an associative array (object) of values for the new object.
JSDBI.insert = function (values) {
    var object = new this();
    for(key in values){
        var value = values[key];
        object[key](value);
    }
    var params = object.__getParams();
    var request = new Ajax.Request(this.url(),
                                        { method: 'put',
                                          parameters: params,
                                          asynchronous: false } );
    if(!request.transport.responseXML){
        alert("Got bogus xml response to insert: "+request.transport.responseText);
    }
    object.__populate(request.transport.responseXML);
    return object;
};

// has_a - define relationship on this object. It creates a few methods on the 
// prototype, including the _field_ accessor
JSDBI.has_a = function (fieldName, className) {
    // XXX this might be better as a hash
    if(!this.prototype.__has_a_relationships) this.prototype.__has_a_relationships = [];
    this.prototype.__has_a_relationships.push([fieldName,className]);
    this.prototype[fieldName] = function (value) {
        if(value) {
            return this.__setField(fieldName,value);
        } else {
            // inflate if we need to
            var obj;
            var type = typeof this.__getField(fieldName);
            if(type == 'string' || type == 'number') {
                var eClass = eval(className);
                obj = eClass.retrieve(this.__getField(fieldName));
                this.__setField(fieldName, obj);
            } else {
                obj = this.__getField(fieldName);
            }        
            return obj;
        }
    };
};

// has_many - define relationship on this object. It creates a few methods on
// the prototype, including the _field_ accessor and the add_to_field method.
JSDBI.has_many = function (field, className, key, retrieveUrl) {
    if(!this.prototype.__has_many_relationships) this.prototype.__has_many_relationships = [];
    this.prototype.__has_many_relationships.push([field,className,key,retrieveUrl]);
    this.prototype[field] = function (value) {
        if(value) {
            alert("not quite sure what to do here");
        } else {
            if(this.__getField(field)){
                return this.__getField(field);
            }
            var retArray = new Array;
            var eClass = eval(className);
            var opts = { 
                method: 'get',
                asynchronous: false 
            };
            var request = new Ajax.Request(retrieveUrl.replace(/\$/, this.id().toString()), opts);
            var xml = request.transport.responseXML;
            var elements = xml.getElementsByTagName(eClass.elementTag());
            for(var i = 0; i < elements.length; i++) {
                var obj = new eClass();
                obj.__populate(elements[i]);
                retArray.push(obj);
            }
            this.__setField(field.retArray);
            return retArray;    
        }
    };

    this.prototype['add_to_' + field] = function (value) {
        var obj;
        var eClass = eval(className);
        var type = typeof value;
        if (type == 'string' || type == 'number') {
            // we got an id to an already existing object
            obj = eClass.retreive(value);
            obj[key] = this.toString();
            obj.update();    
        } else {
            // we got an object - were making a new one
            value[key] = this.toString();
            obj = eClass.insert(value);    
        }

        return obj;
    };
};

// TODO - document this up
JSDBI.inherit = function (destination,source) {
    if(destination.superclass == undefined) {
         destination.superclass = {};
         destination.prototype.superclass = destination.superclass;
    }
    destination.superclass.extend(source);
    destination.prototype.extend(source);
};
