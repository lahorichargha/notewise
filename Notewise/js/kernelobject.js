// KernelObject is the super class for all kernel objects, such as ViewKernel
// and VisibleKernelController.  It contains all the shared logic between these classes.

var KernelObject = Class.create();

KernelObject.prototype = {
    initialize: function(htmlElement){
        this.htmlElement = htmlElement;
        this.headerDivs = new Array();

        if(this.htmlElement){
            this.setup();
        }
    },

    // setup all the event listeners
    registerHandlers: function() {
        // setup the namefield actions
//        Event.observe(this.namefield,'keypress', this.loseFocusOnEnter.bindAsEventListener(this));

        // drag in namefield should select text, not drag object
        this.observe(this.namefield,
                                   'mousedown',
                                   Utils.terminateEvent.bindAsEventListener(this));
        this.observe(this.namefield,
                                   'mouseup',
                                   Utils.terminateEvent.bindAsEventListener(this));
        // double click in namefield should select text, not create kernel
        this.observe(this.namefield,
                     'dblclick',
                     Utils.terminateEvent.bindAsEventListener(this));

        if(this.namelink){
            var model = this.model();
            this.observe(this.namelink,'click', function (e) {
                e = e || window.event;
                Utils.terminateEvent(e);
                Utils.preventDefault(e);
                ViewKernel.makeView(model.kernel_id());
            });
            this.observe(this.namelink,'dblclick', function () {
                e = e || window.event;
                Utils.terminateEvent(e);
                Utils.preventDefault(e);
                ViewKernel.makeView(model.kernel_id());
            });
        }
    },

    observe: function(element, name, observer, useCapture) {
        if (!this.observers) this.observers = [];
        this.observers.push([element, name, observer, useCapture]);
        Event.observe(element, name, observer, useCapture);
    },

    unregisterHandlers: function() {
        dndMgr.deregisterDropZone(this.dropzone);
        if (this.observers) {
            for (var i = 0; i < this.observers.length; i++) {
                Event.stopObserving.apply(this, this.observers[i]);
            }
        }
    },

    updateNamelink: function () {
        this.updateNamelinkText();
        this.updateNamelinkUrl();
    },

    updateNamelinkText: function () {
        if(this.namelink != undefined){
            // Update the link text
            this.namelink.innerHTML = this.kernel().name();
        }
    },

    updateNamelinkUrl: function () {
        if(this.namelink != undefined){
            // Update the link url
            this.namelink.href = this.kernel().object_url();
        }
    },

    loseFocusOnEnter: function(e) {
        if(e.keyCode == Event.KEY_RETURN) {
            Utils.clearSelectionAndTerminate(e);
        }
    },

    // returns the desired width of the name field.  Usually the width of the
    // text in the field, but bounded by the minimum width
    getNameFieldWidth: function(){
        // TODO make 20 into a constant - min namefield width
        return Math.max(Utils.getInputTextWidth(this.namefield),20);
    },

    setup: function () {
        // add this object as a property of the htmlElement, so we can get back
        // to it if all we have is the element
        this.htmlElement.kernel = this;

        this.fetchElements();
        this.registerHandlers();
    },

    // retrieves references to all the relevant html elements and stores them
    // as properties in this object
    fetchElements: function() {
        this.bodyElement = Utils.getElementsByClassName(this.htmlElement, 'body')[0];
        if(this.htmlElement){
            this.namefield = Utils.getElementsByClassName(this.htmlElement, 'namefield')[0];
        };
    },

    // marks the html with a css class based on whether it contains any child objects
    updateContains: function() {
        var vkernels = Utils.getElementsByClassName(this.bodyElement,'vkernel');
        var notes = Utils.getElementsByClassName(this.bodyElement,'note');
        if(this.kernel().has_children() > 0){
            this.changeClass('contains');
        } else {
            this.changeClass('notcontains');
        }
    },

    changeClass: function(newClass){
        var oldClass;
        if(newClass == 'collapsed'){
            oldClass = 'expanded';
        } else if(newClass == 'expanded'){
            oldClass = 'collapsed';
        } else if(newClass.search(/^not/) == -1){
            oldClass = 'not'+newClass;
        } else {
            oldClass = newClass.replace(/^not/,'');
        }

        this.htmlElement.className =
            this.htmlElement.className.replace(new RegExp('-'+oldClass,'g'),'-'+newClass);
        for(var i=0; i<this.headerDivs.length; i++){
            this.headerDivs[i].className =
                this.headerDivs[i].className.replace(new RegExp('-'+oldClass,'g'),'-'+newClass);
        }
    }
};


