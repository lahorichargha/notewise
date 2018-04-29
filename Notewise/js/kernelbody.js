KernelBody = function (bodyElement, kernel) {
    this.bodyElement = bodyElement;
    this.kernel = kernel;

    // set up the dnd
    this.dropzone = new KernelDropzone(this.bodyElement, this);
    dndMgr.registerDropZone( this.dropzone );

    // setup the click handlers
    Event.observe(this.bodyElement, 'dblclick',
                 this.gotDoubleClick.bindAsEventListener(this));
    Event.observe(this.bodyElement, 'mousedown',
                 this.startSelectionBox.bindAsEventListener(this));
    Event.observe(this.bodyElement, 'click',
                 this.gotClick.bindAsEventListener(this));
    Event.observe(this.bodyElement,
                 'mousedown',
                 function() {
                     dndMgr.clearSelection();
                     dndMgr.giveSearchBoxFocus();
                 } );
};

// Calls layoutResize on all the children.
// TODO(scotty): We probably want to keep track of the children directly,
// rather than having to traverse the dom to find them.
KernelBody.prototype.layoutChildren = function() {
    // resize children
    if(this.bodyElement != undefined) {
        var children = this.bodyElement.childNodes;
        for(var i=0; i<children.length; i++){
            var child = children[i];
            // XXX Icky - DRY
            if(child.className != undefined
               && Element.hasClassName(child,'vkernel')
               && child.kernel != undefined){
                child.kernel.layoutResize();
            }
            if(child.className != undefined
               && Element.hasClassName(child,'relationship')
               && child.relationship != undefined){
                child.relationship.layoutResize();
            }
            if(child.className != undefined
               && Element.hasClassName(child,'note')
               && child.note != undefined){
                child.note.layoutResize();
            }
        }
    }
};

KernelBody.prototype.gotClick = function(e) {
    if (!e) var e = window.event
    if(this.blockObjectCreation){
        Utils.terminateEvent(e);
        return;
    }
    if(e.shiftKey || e.ctrlKey || e.altKey) {
        this.addNewNote(e);
        // block note creation, so we don't create two notes on a double click
        this.blockObjectCreation = true;
        window.setTimeout(function () {
            this.blockObjectCreation = false;
        }.bind(this), 1000);
    }
};

KernelBody.prototype.gotDoubleClick = function(e) {
    if (!e) var e = window.event;
    if(this.blockObjectCreation){
        Utils.terminateEvent(e);
        return;
    }
    if(e.shiftKey || e.ctrlKey || e.altKey) {
        // don't do anything, since this was a double click
        Utils.terminateEvent(e);
    } else {
        this.addNewKernel(e);
    }
    Utils.terminateEvent(e);
};
    
KernelBody.prototype.addNewNote = function(e) {
    // get the event coords
    var posx = 0;
    var posy = 0;
    
    if (!e) var e = e.window.event;
    if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
    } else if (e.clientX || e.clientY) {
        posx = e.clientX + document.bodyElement.scrollLeft;
        posy = e.clientY + document.bodyElement.scrollTop; 
    }

    Utils.terminateEvent(e);
    
    var parentPos = Utils.toViewportPosition(this.bodyElement);
    
    var x = (posx - parentPos.x) * 100 / this.bodyElement.clientWidth;
    var y = (posy - parentPos.y) * 100 / this.bodyElement.clientHeight;

    var note = new Note;
    note.model().container_object(this.kernel);
    note.x(x);
    note.y(y);
    note.width(15);
    note.height(15);
    note.content('');
    note.create();

    note.realize(this.bodyElement);
    dndMgr.updateSelection(note, false);
    note.bodyElement.focus();

    // TODO(scotty): figure out how this is going to get called.  Seems like
    // maybe it should be a listener on the visiblekernelmodel for the parent.
//    this.updateContains();
};

// Adds a new kernel to the kernel body for the mouse event given (currently
// called from a double click)
KernelBody.prototype.addNewKernel = function(e) {
    // get the mouse event coordinates
    var posx = 0;
    var posy = 0;
    if (!e) var e = window.event;
    if (e.pageX || e.pageY) {
        posx = e.pageX;
        posy = e.pageY;
    }
    else if (e.clientX || e.clientY) {
        posx = e.clientX + document.bodyElement.scrollLeft;
        posy = e.clientY + document.bodyElement.scrollTop;
    }

    Utils.terminateEvent(e);

    var parentPos = Utils.toViewportPosition(this.bodyElement);

    var x = (posx-parentPos.x)*100/this.bodyElement.clientWidth;
    var y = (posy-parentPos.y)*100/this.bodyElement.clientHeight;

    // create the vkernel object on the server, and a matching js object
    var vkernel = new VisibleKernelController;
    var model = vkernel.model();
    model.container_object(this.kernel);
    model.x(x);
    model.y(y);
    model.width(30);
    model.height(30);
    model.collapsed(1);
    model.insert({asynchronous:true, onSuccess: function(){
        objectCache[model.idString()] = vkernel;
    }});

    // create a temporary kernel so realize() doesn't bomb
    // XXX this probably creates a nasty race condition, as if the user
    // makes an update that hits the kernel object, it'll be wiped out when
    // the object gets populated when the insert callback calls populate
    model.contained_object(new Kernel());
    model.contained_object().name('');

    vkernel.realize(this.bodyElement);
    dndMgr.updateSelection(vkernel,false);
    vkernel.edit(true);
    vkernel.namefield.focus();
    vkernel.newlyCreated(true);

    // TODO(scotty): Figure out where this gets called now
//    this.updateContains();

};

KernelBody.prototype.startSelectionBox = function(e) {
    this.duringSelectionBoxInstance =
        this.duringSelectionBox.bindAsEventListener(this);
    Event.observe(document,
                  'mousemove',
                  this.duringSelectionBoxInstance);

    this.endSelectionBoxInstance =
        this.endSelectionBox.bindAsEventListener(this);
    Event.observe(document,
                  'mouseup',
                  this.endSelectionBoxInstance);

    var bodyPos = Utils.toViewportPosition(this.bodyElement);

    this.selectboxstartx = Utils.mousex(e) - bodyPos.x + 8;
    this.selectboxstarty = Utils.mousey(e) - bodyPos.y;

    if(this.selectbox &&
       this.selectbox.parentNode == this.bodyElement){
            this.bodyElement.removeChild(this.selectbox);
    }

    var box = document.createElement('div');
    box.id = 'selectbox';
    this.selectbox = box;

    this.bodyElement.appendChild(box);
    return;
};

KernelBody.prototype.duringSelectionBox = function(e) {
    var bodyPos = Utils.toViewportPosition(this.bodyElement);
    var newx = Utils.mousex(e) - bodyPos.x + 8;
    var newy = Utils.mousey(e) - bodyPos.y;
    var x = Math.min(newx,this.selectboxstartx);
    var y = Math.min(newy,this.selectboxstarty);
    var w = Math.abs(newx - this.selectboxstartx);
    var h = Math.abs(newy - this.selectboxstarty);
    var box = this.selectbox;
    box.style.width = w + 'px';
    box.style.height = h + 'px';
    box.style.left = x + 'px';
    box.style.top = y + 'px';
}; 

KernelBody.prototype.endSelectionBox = function(e) {
    var bodyPos = Utils.toViewportPosition(this.bodyElement);
    var endx = Utils.mousex(e) - bodyPos.x + 8;
    var endy = Utils.mousey(e) - bodyPos.y;
    var startx = this.selectboxstartx;
    var starty = this.selectboxstarty;
    var boxleft = Math.min(endx,startx);
    var boxright = Math.max(endx,startx);
    var boxtop = Math.min(endy,starty);
    var boxbottom = Math.max(endy,starty);

    if(this.selectbox.parentNode == this.bodyElement){
        this.bodyElement.removeChild(this.selectbox);
    }

    Event.stopObserving(document,
                        'mousemove',
                        this.duringSelectionBoxInstance);

    Event.stopObserving(document,
                        'mouseup',
                        this.endSelectionBoxInstance);

    var children = this.bodyElement.childNodes;
    for(var i=0; i<children.length; i++){
        var element = children[i];
        if((Element.hasClassName(element,'vkernel')||
            Element.hasClassName(element,'note'))
           ){
            var pos = Utils.toViewportPosition(element);
            var left = pos.x - bodyPos.x + 8;
            var top = pos.y - bodyPos.y;
            var right = left + element.offsetWidth;
            var bottom = top + element.offsetHeight;
            if(left > boxleft && right < boxright
               && top > boxtop && bottom < boxbottom){
                    dndMgr.updateSelection(element.draggable,true);
            }
        }
    }
};

var KernelDropzone = Class.create();

KernelDropzone.prototype = (new Dropzone()).extend( {

   initialize: function( htmlElement, vkernel ) {
        this.type        = 'Kernel';
        this.htmlElement = htmlElement;
        this.vkernel        = vkernel;
   },

   accept: function(draggableObjects) {
       for(var i=0;i<draggableObjects.length;i++){
           if(draggableObjects[i].type != 'vkernel' && draggableObjects[i].type != 'note'){
               continue;
           }
           draggableObjects[i].reparent(this.vkernel);
       }
   },

   // XXX showHover and hideHover are all broken, because rico dnd doesn't understand layers
   showHover: function() {
//        Element.addClassName(this.htmlElement,'activated');
   },

   hideHover: function() {
//        Element.removeClassName(this.htmlElement,'activated');
   },

   activate: function() {
   },

   deactivate: function() {
   }
});
