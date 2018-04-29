var Note = Class.create();
Note.extend(JSDBI);
Note.prototype = {};
JSDBI.inherit(Note,new JSDBI());
JSDBI.inherit(Note,new WiseObject());

// Setup the JSDBI data access
Note.fields(['id', 'container_object', 'content', 'height', 'width', 'x', 'y']);
Note.url('rest/note');
Note.elementTag('note');
Note.contentField('content');
Note.has_a('container_object','Kernel');

// multiple inheritance from both JSDBI and Draggable
Note.prototype.extend({
    
    initialize: function(id,container_object,htmlElement,x,y,width,height,content) {
        
        if(htmlElement != undefined) {
            this.htmlElement = htmlElement;
            this.htmlElement.note=this;
            this.setup();
        }
        
        this.type = 'note';
        this.id(id);
        this.model().container_object(container_object);
        this.__x=x;
        this.__y=y;
        this.__width=width;
        this.__height=height;
        this.__content=content;
        this.superclass=Note.superclass;

        JSDBI.prototype.initialize.call(this);
        WiseObject.prototype.initialize.call(this);

        // XXX blah, hackage.  For some reason, toString doesn't get inherited from
        // JSDBI.prototype via JSDBI.inherit(), nor can we set it up like all our other methods.

        this.toString = function () {
            return JSDBI.prototype.toString.call(this);
        }
    },

    model: function() {
        // TODO(scotty): Factor out the model, after we're done making wiseobject aware about models.
        return this;
    },

    // Creates the note on the server, asynchronously.
    // TODO(scotty): maybe rename this to insert once we split out the model.
    create: function() {
        this.insert({asynchronous:true,
                     onSuccess: function(){
                       objectCache[this.idString()]=this;
                       if (this.htmlElement) {
                           this.htmlElement.id="note"+this.id();
                       }
                     }.bind(this)});
    },

    setup: function () {
        WiseObject.prototype.setup.call(this);

        // add this object as a property of the htmlElement, so we can get back
        // to it if all we have is the element
        this.htmlElement.note = this;
    },


    // creates the actual html for this kernel
    // XXX this is a bunch of garbage - need to unify this html with the stuff
    // in root/Kernel/kernel.tt.  Maybe think about shipping the html as part
    // of the xml?  Or maybe a seperate ajax call?
    realize: function(parent) {
        this.htmlElement = document.createElement('div');
        if (this.id() != undefined) {
          this.htmlElement.id="note"+this.id();
        }
        this.htmlElement.className="note note-notselected";
        var innerHTML =
           "<a title='Delete note' class=\"removebutton\"></a>"
           +"<div class='note-left'></div>"
           +"<div class='note-mid'></div>"
           +"<div class='note-right'></div>"
           +"<div class='relationshiphalo'>"
               +"<div class='newrelationshiparrow'></div>"
               +"<div class='halo-top-left'></div>"
               +"<div class='halo-top'></div>"
               +"<div class='halo-top-right'></div>"
               +"<div class='halo-left'></div>"
               +"<div class='halo-right'></div>"
               +"<div class='halo-bottom-left'></div>"
               +"<div class='halo-bottom'></div>"
               +"<div class='halo-bottom-right'></div>"
           +"</div>"
           +"<div class=\"bodycontainer\">"
               +"<textarea class='notebody'>"
                   + this.content()
               +"</textarea>"
               +"<div class=\"corner\">"
               +"</div>"
           +"</div>"
        this.htmlElement.innerHTML = innerHTML;
        this.htmlElement.note=this;
        WiseObject.prototype.realize.call(this, parent);
    },

    // setup all the event listeners
    registerHandlers: function() {
        WiseObject.prototype.registerHandlers.call(this);
        
        // setup the blur handler for the textarea
        this.bodyElement.__hasFocus = false;
        this.bodyElement.onfocus = this.bodyFocus.bindAsEventListener(this);
        this.bodyElement.onblur = this.contentChanged.bindAsEventListener(this);

        // TODO DRY - consolidate these into a big list of element/event pairs
        // Setup action terminators

        // dragging on the body shouldn't drag the object
        Event.observe(this.bodyElement, 'mousedown',
                                    Utils.terminateEvent.bindAsEventListener(this));

        Event.observe(this.htmlElement, 'dblclick',
                                    Utils.terminateEvent.bindAsEventListener(this));
                                    
        Event.observe(this.bodyElement, 'click',
                                    Utils.terminateEvent.bindAsEventListener(this));

        // handles problem with firefox/gecko not rendering scrollbars properly on mac - see bug #224
        if(Utils.is_mac() && Utils.is_gecko()) {
            Event.observe(this.corner, 'mouseover', function () { this.bodyElement.style.overflow = "hidden"; }.bind(this));
            Event.observe(this.corner, 'mouseout', function () { this.bodyElement.style.overflow = ""; }.bind(this));
        }
    },

    getMinHeight: function() {
        return 40;
    },

    getMinWidth: function() {
        return 50;
    },

    collapsed: function(){
        return 0;
    },

    bodyFocus: function (e) {
      this.bodyElement.__hasFocus = true;
      dndMgr.updateSelection(this,false);
    },
    
    contentChanged: function (e) {
        var text = this.bodyElement.value;
        if(text != this.content()) {
            this.content(text);
            this.model().update();
        }
        this.bodyElement.__hasFocus = false;
    },

    // Select this kernel
    select: function () {
        if (this.bodyElement.__hasFocus) this.retainFocus = true;
        else this.retainFocus = false;
  
        WiseObject.prototype.select.call(this,parent);
    },

    // Mark this kernel as not selected
    deselect: function () {
        this.bodyElement.retainFocus = false;
        WiseObject.prototype.deselect.call(this,parent);
    },

    startDrag: function() {
        if (this.bodyElement.__hasFocus) { 
          this.bodyElement.retainFocus = true; 
        } else { 
          this.bodyElement.retainFocus = false; 
        }
        WiseObject.prototype.startDrag.call(this,parent);
    },
 
    endDrag: function() {
        WiseObject.prototype.endDrag.call(this,parent);

        if(this.retainFocus) {
          this.bodyElement.focus();
        }
    },
 
    cancelDrag: function() {
        WiseObject.prototype.cancelDrag.call(this,parent);
        
        if(this.retainFocus)
          this.bodyElement.focus();
    },

    // makes notes compatible with visible ojbects for relationships
    // (see initialize() in js/relationship.js)
    contained_object: function() {
        return this;
    },

    // returns the id in the form '1/2' where the first number is the
    // container_id and the second number is the note id
    idString: function() {
        var id = this.__container_object+'/'+this.id();
        return id;
    },

    // causes the internal elements to resize if necessary
    layoutResize: function() {
        WiseObject.prototype.layoutResize.call(this);
        this.midbackground.style.width = Math.max(0,this.htmlElement.clientWidth -
                                                    this.leftbackground.clientWidth -
                                                    this.rightbackground.clientWidth + 1) + 'px';
    },

    // retrieves references to all the relevant html elements and stores them
    // as properties in this object
    fetchElements: function () {
        WiseObject.prototype.fetchElements.call(this);
        this.midbackground = Utils.getElementsByClassName(this.htmlElement, 'note-mid')[0];
        this.rightbackground = Utils.getElementsByClassName(this.htmlElement, 'note-right')[0];
        this.leftbackground = Utils.getElementsByClassName(this.htmlElement, 'note-left')[0];
        var bodycontainer = Utils.getElementsByClassName(this.htmlElement, 'bodycontainer')[0];
        this.bodyElement = Utils.getElementsByClassName(bodycontainer, 'notebody')[0];
        this.corner = Utils.getElementsByClassName(bodycontainer, 'corner')[0];
    },

    // Select this object
    select: function () {
        // make sure the newrelationshiparrow is hidden to start with
        Element.hide(this.newrelationshiparrow);
        if( !this.isSelected() ){
            Element.removeClassName(this.htmlElement,'note-notselected');
            Element.addClassName(this.htmlElement,'note-selected');
        }
        dndMgr.moveToFront(this.htmlElement);
    },

    // Mark this object as not selected
    deselect: function () {
        if( this.isSelected()){
            Element.removeClassName(this.htmlElement,'note-selected');
            Element.addClassName(this.htmlElement,'note-notselected');
        }
    },

    kernel_id: function () {
        return this.__id;
    }
});
