var WiseObject = Class.create();
WiseObject.prototype = {};
WiseObject.prototype.extend(new Draggable());
WiseObject.prototype.extend({

    initialize: function() {
        // listeners that get notified when this visible kernel moves
        this.__moveListeners = new Array();
        // listeners that get notified when this visible kernel changes size
        this.__sizeListeners = new Array();
        // listeners that get notified when this visible kernel starts moving or changing size (start of the drag)
        this.__startChangeListeners = new Array();
        // listeners that get notified when this visible kernel stops moving or changing size (end of the drag)
        this.__endChangeListeners = new Array();
    },

    // XXX this is necessary because inheritance is kinda borked
    collapsed: function (collapsed) {
        return this.superclass.collapsed.call(this, collapsed);
    },

    setup: function () {
        this.fetchElements();
        this.registerHandlers();
        
        // clean out whitespace only child nodes, in the hopes of improving layoutResize speed
        if(this.htmlElement){
            Element.cleanWhitespace(this.htmlElement);
        }
    },

    // creates the actual html for this object. Subclasses should override this,
    // supply the actual html node in this.htmlElement.
    realize: function(parent) {
        parent.appendChild(this.htmlElement);
        this.setup();
        this.moveX(this.x());
        this.moveY(this.y());
        this.moveWidth(this.width());
        this.moveHeight(this.height());
        this.layout();
    },

    // retrieves references to all the relevant html elements and stores them
    // as properties in this object
    fetchElements: function () {
        this.bodyElement = Utils.getElementsByClassName(this.htmlElement, 'body')[0];
        this.corner = Utils.getElementsByClassName(this.htmlElement, 'corner')[0];
        this.removebutton = Utils.getElementsByClassName(this.htmlElement, 'removebutton')[0];
        this.relationshiphalo = Utils.getElementsByClassName(this.htmlElement, 'relationshiphalo')[0];
        if(this.relationshiphalo){ // thumbs don't have halos and arrows
            this.relationshiphalotop = Utils.getElementsByClassName(this.relationshiphalo, 'halo-top')[0];
            this.relationshiphalobottom = Utils.getElementsByClassName(this.relationshiphalo, 'halo-bottom')[0];
            this.relationshiphaloleft = Utils.getElementsByClassName(this.relationshiphalo, 'halo-left')[0];
            this.relationshiphaloright = Utils.getElementsByClassName(this.relationshiphalo, 'halo-right')[0];
            this.newrelationshiparrow = Utils.getElementsByClassName(this.relationshiphalo, 'newrelationshiparrow')[0];
        }
    },

    registerHandlers: function() {
        // set up the dnd
        dndMgr.registerDraggable( this );
        dndMgr.registerDraggable( new ResizeCornerDraggable(this.corner, this) );

        // setup the remove button
        Event.observe(this.removebutton,
                                   'click',
                                   this.destroy.bind(this));

        // dragging on any of the buttons shouldn't drag the object
        Event.observe(this.removebutton,
                                   'mousedown',
                                   Utils.terminateEvent.bindAsEventListener(this));

        // doubleclicking on any of the buttons shouldn't do anything
        Event.observe(this.removebutton,
                                   'dblclick',
                                   Utils.terminateEvent.bindAsEventListener(this));

        // Don't let clicks fall through to the background
        Event.observe(this.htmlElement,
                                   'click',
                                   Utils.terminateEvent.bindAsEventListener(this));


        // setup relationship halo
        Event.observe(this.relationshiphalo,
                                    'mousemove',
                                    this.moveInRelationshipHalo.bindAsEventListener(this));
        Event.observe(this.relationshiphalo,
                                    'mouseover',
                                    this.enterRelationshipHalo.bindAsEventListener(this));
        Event.observe(this.relationshiphalo,
                                    'mouseout',
                                    this.leaveRelationshipHalo.bindAsEventListener(this));
        Event.observe(this.relationshiphalo,
                                    'mousedown',
                                    this.startCreateRelationship.bindAsEventListener(this));
        Event.observe(this.newrelationshiparrow,
                                    'mouseout',
                                    this.leaveRelationshipHalo.bindAsEventListener(this));

        Event.observe(this.removebutton,
                                    'mouseover',function(){Element.addClassName(this.removebutton,'removebutton-hover')}.bind(this));
        Event.observe(this.removebutton,
                                    'mouseout',function(){Element.removeClassName(this.removebutton,'removebutton-hover')}.bind(this));
      },

    // Select this object and terminate the event
    selectAndTerminate: function(e) {
        dndMgr.clearSelection();
        dndMgr.updateSelection(this,false);
        Utils.terminateEvent(e)
    },

    // starts the process of creating a relationship
    startCreateRelationship: function(e){
        newRelationship.startDrag(e,this);
        Utils.terminateEvent(e);
        Utils.preventDefault(e);
    },

    moveInRelationshipHalo: function(e) {
        var pos = Utils.getEventPosition(e);
        var parentPos = Utils.toViewportPosition(this.relationshiphalo);
        var x=pos.x-parentPos.x;
        var y=pos.y-parentPos.y;
        var h;
        var v;
        var dx=x;
        var dy=y;
        var direction;
        if(y > this.relationshiphalo.clientHeight/2){
            dy = this.relationshiphalo.clientHeight - y;
        }
        if(x > this.relationshiphalo.clientWidth/2){
            dx = this.relationshiphalo.clientWidth - x;
        }

        if(dx > dy) {
            if(y < this.relationshiphalo.clientHeight/2){
                this.newrelationshiparrow.style.top='0px';
                this.newrelationshiparrow.style.bottom='';
                direction = 'up';
            } else {
                this.newrelationshiparrow.style.bottom='0px';
                this.newrelationshiparrow.style.top='';
                direction = 'down';
            }
            this.newrelationshiparrow.style.left=Math.min(this.relationshiphalo.clientWidth-13,Math.max(0,x-6))+'px';
            this.newrelationshiparrow.style.right='';
        } else {
            if(x < this.relationshiphalo.clientWidth/2){
                this.newrelationshiparrow.style.left='0px';
                this.newrelationshiparrow.style.right='';
                direction = 'left';
            } else {
                this.newrelationshiparrow.style.right='0px';
                this.newrelationshiparrow.style.left='';
                direction = 'right';
            }
            this.newrelationshiparrow.style.top=Math.min(this.relationshiphalo.clientHeight-14,Math.max(0,y-7))+'px';
            this.newrelationshiparrow.style.bottom='';
        }
        if(x < 15){
            if(y < 15){
                direction = 'upleft';
            } else if (y > this.relationshiphalo.clientHeight - 15){
                direction = 'downleft';
            }
        } else if (x > this.relationshiphalo.clientWidth - 15){
            if(y < 15){
                direction = 'upright';
            } else if (y > this.relationshiphalo.clientHeight - 15){
                direction = 'downright';
            }
        }
        this.newrelationshiparrow.className = 'newrelationshiparrow '+direction;
    },

    enterRelationshipHalo: function(e) {
        Element.show(this.newrelationshiparrow);
    }, 

    leaveRelationshipHalo: function(e) {
        Element.hide(this.newrelationshiparrow);
    },

    parentVKernel: function () {
        var oldParent = this.htmlElement.parentNode.parentNode.kernel;
        if (oldParent == null){
            // view kernel doesn't have a body and therefor htmlelement=body
            oldParent = this.htmlElement.parentNode.kernel;
        }
        return oldParent;
    },

    // removes the html element from the view, and then notifies the server
    destroy: function () {
        var oldParent = this.parentVKernel();
        if(this.htmlElement.parentNode != null){
            this.htmlElement.parentNode.removeChild(this.htmlElement);
        }
        if(oldParent && oldParent.updateContains){
            oldParent.updateContains();
        }
        this.deleteRelationships();
        dndMgr.clearSelection();
        dndMgr.giveSearchBoxFocus();
        return JSDBI.prototype.destroy.call(this);
    },

    deleteRelationships: function() {
        if(this.relationshipCache){
            for(var i=0; i<this.relationshipCache.length; i++){
                var relationship = this.relationshipCache[i];
                relationship.removeFromView();
                relationship.uncache();
            }
        }
    },

    // create html elements for the relationships that are visible for this object
    hydrateRelationships: function() {
        // TODO(scotty): we should have jsdbi expose something like
        // container_object_id() for all hydrated relationships, so we don't
        // have to do these sort of hacks.
        if(this.model().__container_object == sandbox.id){
            return;
        }
        var rels = this.container_object().visible_relationships();
        for(var i=0; i<rels.length; i++){
            var rel = rels[i];
            if(rel.part1() == this.kernel_id() ||
               rel.part2() == this.kernel_id()){
                rel.realize(this.container_object().id());
            }
        }
    },


    cacheRelationship: function(relationship) {
        if(!this.relationshipCache){
            this.relationshipCache=[];
        }
        this.relationshipCache.push(relationship);
    },

    uncacheRelationship: function(relationship) {
        this.relationshipCache.removeItem(relationship);
    },

    // performs internal visual layout of the html elements for this kernel
    layout: function(){
        this.layoutResize();
    },

    // causes the resize corner to relayout
    layoutCorner: function() {
        this.corner.style.left = '';
        this.corner.style.top = '';
        this.corner.style.right = '3px';
        this.corner.style.bottom = '3px';
    },

    // causes the internal elements to resize if necessary
    layoutResize: function() {
      if(this.bodyElement != undefined){
          // The -1 is to compensate for problems with calculating the width of
          // html elements that are set via a percentage.  It seems that
          // firefox always rounds up to the nearest integer for things like
          // clientWidth, when what we really want is to always round down.
          // Instead, we compensate by always subtracting one, and setting the
          // right and bottom in the css to be 1px rather than 0px, for both
          // the body, and the right header image (so they line up)
          this.bodyElement.style.width = Math.max(0,this.htmlElement.clientWidth - 1) + 'px';
          this.bodyElement.style.height = Math.max(0,this.htmlElement.clientHeight - this.bodyElement.offsetTop - 1) + 'px';
      }
      // XXX could change this to only do this if the halo is visible, for speed.  We'd need to make sure this gets called when the object gets expanded though
      if(this.relationshiphalo != undefined){
          this.relationshiphalo.style.width = (this.htmlElement.clientWidth + 30) + 'px';
          this.relationshiphalo.style.height = (this.htmlElement.clientHeight + 30) + 'px';
          this.relationshiphalotop.style.width = Math.max(0,this.htmlElement.clientWidth - 8) + 'px';
          this.relationshiphalobottom.style.width = Math.max(0,this.htmlElement.clientWidth - 8) + 'px';
          this.relationshiphaloleft.style.height = Math.max(0,this.htmlElement.clientHeight - 8) + 'px';
          this.relationshiphaloright.style.height = Math.max(0,this.htmlElement.clientHeight - 8) + 'px';
      }
    },

    // Just sets the internal x coordinate but don't change the display
    setX: function(x) {
        this.notifyMoveListeners(x+'%',this.y()+'%');
        return this.model().x(x);
    },

    // Sets the x coordinate as a percentage of the parent object's width and moves the object accordingly
    moveX: function(x) {
        if(x && this.htmlElement){
            this.htmlElement.style.left = x+"%";
            this.notifyMoveListeners(x+'%',this.y()+'%');
        }
        return this.model().x(x);
    },

    // Just sets the internal y coordinate but don't change the display
    setY: function(y) {
        this.notifyMoveListeners(this.x()+'%',y+'%');
        return this.model().y(y);
    },

    // Sets the y coordinate as a percentage of the parent object's height and moves the object accordingly
    moveY: function(y) {
        if(y && this.htmlElement){
            this.htmlElement.style.top = y+"%";
            this.notifyMoveListeners(this.x()+'%',y+'%');
        }
        return this.model().y(y);
    },

    // Sets the width as a percentage of the parent object's width and moves
    // the object accordingly
    moveWidth: function(width) {
        var results;
        if(width != undefined){
            results = this.setWidth(this.checkWidth(width));
            if(this.htmlElement){
                this.htmlElement.style.width = results+"%";
            }
            this.layoutCorner();
        } else {
            results = this.setWidth(this.checkWidth(width));
        }
        return results;
    },

    // Just sets the internal width
    setWidth: function(width) {
        var results = this.model().width(width);
        if(width != undefined){
            this.notifySizeListeners();
        }
        return results;
    },

    // Sets the height as a percentage of the parent object's width and moves
    // the object accordingly
    moveHeight: function(height) {
        var results;
        if(height != undefined){
            results = this.setHeight(this.checkHeight(height));
            if(this.htmlElement){
                this.htmlElement.style.height = results+"%";
            }
            this.layoutCorner();
        } else {
            results = this.setHeight(this.checkHeight(height));
        }
        return results;
    },

    // Just sets the internal height  but don't change the display
    setHeight: function(height) {
        var results = this.model().height(height);
        if(height != undefined){
            this.notifySizeListeners();
        }
        return results;
    },

    // checks to make sure the height is ok, and returns a corrected value if it isn't
    // height should be in percentage
    checkHeight: function(h){
        var minHeight=this.getMinHeight();
        var parentHeight=this.htmlElement.parentNode.clientHeight;
        var heightPixels=(parentHeight * h)/100;
        if(heightPixels < minHeight){
            h = minHeight*100/parentHeight;
        }
        return h;
    },

    // checks to make sure the width is ok, and returns a corrected value if it isn't
    // width should be in percentage
    checkWidth: function(w){
        var minWidth=this.getMinWidth();
        var parentWidth=this.htmlElement.parentNode.clientWidth;
        var widthPixels=(parentWidth * w)/100;
        if(widthPixels < minWidth){
            w = minWidth*100/parentWidth;
        }
        return w;
    },


    // returns the current actual onscreen size of the object in percent
    currentHeight: function(parentElement) {
        if(parentElement == null){
            parentElement=this.htmlElement.parentNode;
        }
        if(this.collapsed()){
            return this.htmlElement.clientHeight*100/parentElement.clientHeight;
        } else {
            return this.height();
        }
    },

    // returns the current actual onscreen size of the object in percent
    currentWidth: function(parentElement) {
        if(parentElement == null){
            parentElement=this.htmlElement.parentNode;
        }
        if(this.collapsed() && parentElement){
            return this.htmlElement.clientWidth*100/parentElement.clientWidth;
        } else {
            return this.width();
        }
    },

    // Adds a movement listener.  The notify method will called whenever this
    // visible kernel moves, with the parameters this object, newX, and new Y,
    // in terms of the parent at the start of the drag
    addMoveListener: function (notifyMethod){
        this.__moveListeners.push(notifyMethod);
    },

    removeMoveListener: function (notifyMethod){
        this.__moveListeners.removeItem(notifyMethod);
    },

    // Adds a size listener.  The notify method will called whenever this
    // visible kernel is resized, with this object as the parameter.
    addSizeListener: function (notifyMethod){
        this.__sizeListeners.push(notifyMethod);
    },

    removeSizeListener: function (notifyMethod){
        this.__sizeListeners.removeItem(notifyMethod);
    },

    // Adds a start change listener.  The notify method will called whenever
    // this visible kernel starts resizing or moving.  The notify method will
    // get this object as a parameter.
    addStartChangeListener: function (notifyMethod){
        this.__startChangeListeners.push(notifyMethod);
    },

    removeStartChangeListener: function (notifyMethod){
        this.__startChangeListeners.removeItem(notifyMethod);
    },

    // Adds an end change listener.  The notify method will called whenever
    // this visible kernel stops resizing or moving.  The notify method will
    // get this object as a parameter.
    addEndChangeListener: function (notifyMethod){
        this.__endChangeListeners.push(notifyMethod);
    },

    removeEndChangeListener: function (notifyMethod){
        this.__endChangeListeners.removeItem(notifyMethod);
    },

    notifyMoveListeners: function (x,y){
        for(var i=0;i<this.__moveListeners.length;i++){
            this.__moveListeners[i](this,x,y);
        }
    },

    notifySizeListeners: function (){
        if(this.htmlElement){
            for(var i=0;i<this.__sizeListeners.length;i++){
                this.__sizeListeners[i](this);
            }
        }
    },

    notifyStartChangeListeners: function (){
        for(var i=0;i<this.__startChangeListeners.length;i++){
            this.__startChangeListeners[i](this);
        }
    },

    notifyEndChangeListeners: function (){
        for(var i=0;i<this.__endChangeListeners.length;i++){
            this.__endChangeListeners[i](this);
        }
    },

    // accepts the kernel body to reparent to, and whether or not to notify the server about it
    reparent: function(body, do_update) {
        var parentElement = body.bodyElement;

        var oldParent = this.oldParentNode.parentNode.kernel;
        if (oldParent == null){
            // view kernel doesn't have a body and therefor htmlelement=body
            oldParent = this.oldParentNode.kernel;
        }

        // Can't make element child of it's own child
        if(Utils.hasAncestor(parentElement,this.htmlElement)){
            log("!!! SHOULDN'T GET THIS !!! - Can't reparent to it's own child");
            return;
        }
        // and don't reparent it if it's already in the right element
        if(this.htmlElement.parentNode == parentElement){
            log("Not reparenting - already in that parent");
            return;
        }

        // remove the object from the object cache
        delete objectCache[this.idString()];

        // Save all the old position and size info in pixels, so we can
        // recalculate it with the new parent
        var pos = Utils.toViewportPosition(this.htmlElement);
        var parentPos = Utils.toViewportPosition(parentElement);
        var width = this.htmlElement.clientWidth;
        var height = this.htmlElement.clientHeight;

        var parentMarginLeft = Utils.chopPx(Utils.getStyle(parentElement,'margin-left'));
        var parentMarginRight = Utils.chopPx(Utils.getStyle(parentElement,'margin-right'));
        if(Utils.is_ie()){
            parentMarginRight = 0;
        }

        // actually reparent
        parentElement.appendChild(this.htmlElement);

        // switch all the position and size info to match the new parent
        this.moveX(((pos.x-parentPos.x+parentMarginLeft)*100/(parentElement.clientWidth+parentMarginLeft+parentMarginRight+2)));
        this.moveY((pos.y-parentPos.y)*100/(parentElement.clientHeight+2));
        if(!this.collapsed()){
            // don't set the size if we're collapsed, cause it'll wipe
            // out the currently saved size
            this.moveWidth(width*100/(parentElement.clientWidth+parentMarginLeft+parentMarginRight+2));
            this.moveHeight(height*100/(parentElement.clientHeight+2));
        }

        // move the object to the frontmost layer
        dndMgr.moveToFront(this.htmlElement);

        // relayout
        this.layoutResize();

        // update the db

        // this is a hack to avoid having to retrieve the kernel object
        // itself, since we don't really need it right now
        this.model().container_object(body.kernel.id());
        this.model().update();

        // add the object back into the object cache
        objectCache[this.idString()] = this;

        // update the contains flags on the html
        if(oldParent && oldParent.updateContains){
            oldParent.updateContains();
        }
        // TODO(scotty): figure out how this gets called
//        if(vkernel.updateContains){
//            vkernel.updateContains();
//        }

        // delete all the old relationships and create new ones
        if(parentElement != this.oldParentNode){
            // set this on a timer, so it doesn't block the ui
            window.setTimeout(this.refreshRelationships.bind(this),50);
        }
    },

    refreshRelationships: function () {
            this.deleteRelationships();
            this.hydrateRelationships();
    },

    // Returns whether or not this object is currently selected
    isSelected: function () {
        alert("isSelected() needs to be overridden in subclasses");
    },

    // Select this object
    select: function () {
        alert("select() needs to be overridden in subclasses");
    },

    // Mark this object as not selected
    deselect: function () {
        alert("deselect() needs to be overridden in subclasses");
    },

    // Rico draggable stuff

    startDrag: function() {
        this.notifyStartChangeListeners();

        var parentElement = this.htmlElement.parentNode;

        // change the startx/starty offsets so they're correct when we pop up
        // into the document body
        var parentPos = Utils.toViewportPosition(parentElement);
        var parentMarginLeft = Utils.chopPx(Utils.getStyle(parentElement,'margin-left'));
        this.startx -= parentPos.x - parentMarginLeft;
        this.starty -= parentPos.y;

        // make sure the original position is relative to the viewport, not the
        // parent, so it ends up back in the same place if the drag is canceled
        this.origPos = Utils.toViewportPosition(this.htmlElement);

        // convert this element to pixels, so it doesn't change size as we reparent
        this.htmlElement.style.width=this.htmlElement.clientWidth+'px';
        if( (this.type == 'vkernel' && ! this.collapsed()) ||
             this.type == 'note' ){
            // only do this if it's expanded - otherwise the kernel and halo
            // don't size correctly between being in the view, and being in a
            // thumbnail
            this.htmlElement.style.height=this.htmlElement.clientHeight+'px';
        }

        // pop the element up into the document body, so it can drag anywhere
        this.oldParentNode = parentElement;
        parentElement.removeChild(this.htmlElement);
        document.body.appendChild(this.htmlElement);

        // relayout
        this.layoutResize();
    },
 
    endDrag: function() {
        // TODO need to make sure at the end of the drag, the element ends up back down inside a kernel body
        delete this.oldParentNode;
        this.notifyEndChangeListeners();
    },
 
    duringDrag: function() {
        var parentPos = Utils.toViewportPosition(this.oldParentNode);
        var x = Number(Utils.chopPx(this.htmlElement.style.left)-parentPos.x)*100
                       / this.oldParentNode.clientWidth;
        var y = (Number(Utils.chopPx(this.htmlElement.style.top))-parentPos.y)*100
                       / this.oldParentNode.clientHeight;
        this.notifyMoveListeners(x+'%',y+'%');
    },

    cancelDrag: function() {
        var parentElement = this.oldParentNode;
        delete this.oldParentNode;

        var pos = Utils.toViewportPosition(this.htmlElement);
        var parentPos = Utils.toViewportPosition(parentElement);
        var width = this.htmlElement.clientWidth;
        var height = this.htmlElement.clientHeight;

        parentElement.appendChild(this.htmlElement);

        var elementStyle = this.htmlElement.style;
        elementStyle.left = ((pos.x-parentPos.x)*100/parentElement.clientWidth) + '%';
        elementStyle.top = ((pos.y-parentPos.y)*100/parentElement.clientHeight) + '%';
        elementStyle.width = (width*100/parentElement.clientWidth) + '%';
        elementStyle.height = (height*100/parentElement.clientHeight) + '%';
        if(this.collapsed && this.collapsed()){
            elementStyle.height = '';
        }

        this.layoutResize();

        this.notifyEndChangeListeners();
    },

    // Returns whether or not this object is currently selected
    isSelected: function () {
        var result = this.htmlElement.className.search(/\-selected/) != -1;
        return result;
    }
});

// This is totally a hack, but it more or less works.  The idea is that we think of the corner image as it's own separate draggable object.  However, the duringDrag event that fires while it is being dragged resizes the associate object appropriately. When the drag finishes, the size of the object is written out.

var ResizeCornerDraggable = Class.create();
ResizeCornerDraggable.prototype = (new Draggable()).extend( {
    initialize: function( htmlElement, wiseobject ) {
        this.type        = 'ResizeCorner';
        this.htmlElement = htmlElement;
        this.wiseobject        = wiseobject;
    },
 
    startDrag: function() {
       this.wiseobject.notifyStartChangeListeners();
    },
 
    cancelDrag: function() {
       this.sizeFromCorner();
       this.wiseobject.notifyEndChangeListeners();
       dndMgr.giveSearchBoxFocus();
    },

    endDrag: function() {
       this.wiseobject.notifyEndChangeListeners();
       this.wiseobject.layoutCorner();
       this.wiseobject.model().update();
       dndMgr.giveSearchBoxFocus();
    },
 
    duringDrag: function() {
        this.sizeFromCorner();
    },

    // size the associated object based on the position of the corner
    sizeFromCorner: function(){
        var cornerWidth = this.htmlElement.clientWidth;
        var cornerHeight = this.htmlElement.clientHeight;
        var w = Number(Utils.chopPx(this.htmlElement.style.left)) + cornerWidth;
        var h = Number(Utils.chopPx(this.htmlElement.style.top)) + cornerHeight;
        this.wiseobject.moveHeight(h*100/this.wiseobject.htmlElement.parentNode.clientHeight);
        this.wiseobject.moveWidth(w*100/this.wiseobject.htmlElement.parentNode.clientWidth);
        this.wiseobject.layoutResize();
    },
 
    select: function() {
    }
} );
