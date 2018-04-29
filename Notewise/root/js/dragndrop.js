// TODO this is all heavily based on code from rico - need to make sure we
// comply with license.  I basically just started with Rico, and hacked out
// anything we didn't need.

var Rico = {};
Rico.ArrayExtensions = new Array();

if (Object.prototype.extend) {
   // in prototype.js...
   Rico.ArrayExtensions[ Rico.ArrayExtensions.length ] = Object.prototype.extend;
}

if (Array.prototype.push) {
   // in prototype.js...
   Rico.ArrayExtensions[ Rico.ArrayExtensions.length ] = Array.prototype.push;
}

if (!Array.prototype.remove) {
   Array.prototype.remove = function(dx) {
      if( isNaN(dx) || dx > this.length )
         return false;
      for( var i=0,n=0; i<this.length; i++ )
         if( i != dx )
            this[n++]=this[i];
      this.length-=1;
   };
  Rico.ArrayExtensions[ Rico.ArrayExtensions.length ] = Array.prototype.remove;
}

if (!Array.prototype.removeItem) {
   Array.prototype.removeItem = function(item) {
      for ( var i = 0 ; i < this.length ; i++ )
         if ( this[i] == item ) {
            this.remove(i);
            break;
         }
   };
  Rico.ArrayExtensions[ Rico.ArrayExtensions.length ] = Array.prototype.removeItem;
}

if (!Array.prototype.indices) {
   Array.prototype.indices = function() {
      var indexArray = new Array();
      for ( index in this ) {
         var ignoreThis = false;
         for ( var i = 0 ; i < Rico.ArrayExtensions.length ; i++ ) {
            if ( this[index] == Rico.ArrayExtensions[i] ) {
               ignoreThis = true;
               break;
            }
         }
         if ( !ignoreThis )
            indexArray[ indexArray.length ] = index;
      }
      return indexArray;
   }
  Rico.ArrayExtensions[ Rico.ArrayExtensions.length ] = Array.prototype.indices;
}

var LayerManager = Class.create();
LayerManager.prototype = {
    initialize: function() {
    },

    minIndex: -10000000,
    maxIndex: 10000000,
    defaultIndex: 2,

    // moves the element to the next layer above the highest layer
    moveToFront: function(element){
        var parentElement = element.parentNode;

        // get the highest layer in the parent
        var highestLayer = this.minIndex;
        for(var i=0; i<parentElement.childNodes.length; i++){
            var siblingElement = parentElement.childNodes[i];
            if(siblingElement == element){
                continue;
            }
            var layerIndex = this.layer(siblingElement);
            if(layerIndex != null
               && layerIndex > highestLayer){
                highestLayer = this.layer(siblingElement);
            }
        }
        if(highestLayer == this.minIndex){
            // we probably didn't see anything with layers, so reset to reasonable value
            highestLayer=this.defaultIndex;
        }

        // set the layer of this element to be one higher than the highest layer
        // XXX note that this could lead to large layer indexes, if used for a long time.
        var newLayer = Number(highestLayer)+1;
        this.layer(element,newLayer);
    },

    // moves the element to the next layer below the lowest layer
    moveToBack: function(element){
        var parentElement = element.parentNode;

        // get the lowest layer in the parent
        var lowestLayer = this.maxIndex;
        for(var i=0; i<parentElement.childNodes.length; i++){
            if(siblingElement == element){
                continue;
            }
            var siblingElement = parentElement.childNodes[i];
            var layerIndex = this.layer(siblingElement);
            if(layerIndex != null
               && layerIndex < lowestLayer){
                lowestLayer = this.layer(siblingElement);
            }
        }
        if(lowestLayer == this.maxIndex){
            // we probably didn't see anything with layers, so reset to reasonable value
            lowestLayer=this.defaultIndex;
        }

        // set the layer of this element to be one lower than the lowest layer
        // XXX note that this could lead to large negative layer indexes, if used for a long time.
        this.layer(element,Number(lowestLayer)-1);
    },

    // returns the layer index for the element, optionally setting it if a layer is given
    layer: function(element,layer){
        if(typeof element.style == 'undefined'){
            return null;
        }
        if(layer !== undefined){
            return element.style.zIndex=layer;
        } else {
            var layer = Utils.getStyle(element,'z-index');
            if(layer == 'auto'){
                layer = this.defaultIndex;
            }
            return layer || this.defaultIndex;
        }
    }
};

var DragAndDrop = Class.create();

DragAndDrop.prototype = new LayerManager();
DragAndDrop.prototype.extend({

   // sets up a new dndMgr
   initialize: function() {
      this.dropZones                = new Array();
      this.draggables               = new Array();
      this.currentDragObjects       = new Array();
      this.dragElement              = null;
      this.lastSelectedDraggable    = null;
      this.currentDragObjectVisible = false;
      this.interestedInMotionEvents = false;
      // denotes that the current event was actually a drag, and not just a
      // click.  See bug #79
      this.wasDrag                  = false;
      // denotes whether we just selected something on a mousedown, so we don't
      // deselect it on a mouseup - see bug #79
      this.newlySelected            = false;
   },

   // registers a given drop zone with the dndMgr
   registerDropZone: function(aDropZone) {
      this.dropZones[ this.dropZones.length ] = aDropZone;
   },

   // unregisters a given drop zone with the dndMgr
   deregisterDropZone: function(aDropZone) {
      var newDropZones = new Array();
      var j = 0;
      for ( var i = 0 ; i < this.dropZones.length ; i++ ) {
         if ( this.dropZones[i] != aDropZone )
            newDropZones[j++] = this.dropZones[i];
      }

      this.dropZones = newDropZones;
   },

   // removes all drop zones from the dndMgr
   clearDropZones: function() {
      this.dropZones = new Array();
   },

   // registers a draggable with the dndMgr
   registerDraggable: function( aDraggable ) {
      this.draggables[ this.draggables.length ] = aDraggable;
      this._addMouseDownHandler( aDraggable );
   },

   // clears any currently selected draggables
   clearSelection: function() {
      for ( var i = 0 ; i < this.currentDragObjects.length ; i++ )
         this.currentDragObjects[i].deselect();
      this.currentDragObjects = new Array();
      this.lastSelectedDraggable = null;
   },

   giveSearchBoxFocus: function() {
      // this allows IE to work correctly.  If we call .focus() directly, we
      // get the onfocus event, but no cursor.
      setTimeout(this.__giveSearchBoxFocus.bind(this), 1);
   },

   __giveSearchBoxFocus: function() {
      $('mysearchfield').focus();
      $('mysearchfield').select();
      Element.hide($('mysearchresults'));
   },

   // returns true if there are currently any objects selected
   hasSelection: function() {
      return this.currentDragObjects.length > 0;
   },

   // starts a drag from the given html element
   setStartDragFromDraggable: function( e, draggableObject ) {
      draggableObject.origPos = Utils.toDocumentPosition(draggableObject.getMouseDownHTMLElement());
      draggableObject.startx = e.screenX - draggableObject.origPos.x
      draggableObject.starty = e.screenY - draggableObject.origPos.y

      this.interestedInMotionEvents = this.hasSelection();
      this._terminateEvent(e);
   },

   // updates the set of currently selected objects with the given draggable.
   // If extendSelection is true, it adds the object to the set of selected
   // objects.  Otherwise, it replaces the set of selected objects
   updateSelection: function( draggable, extendSelection ) {
      if ( ! extendSelection )
         this.clearSelection();

      if ( draggable.isSelected() ) {
         this.currentDragObjects.removeItem(draggable);
         draggable.deselect();
         if ( draggable == this.lastSelectedDraggable )
            this.lastSelectedDraggable = null;
      }
      else {
         this.currentDragObjects[ this.currentDragObjects.length ] = draggable;
         draggable.select();
         this.lastSelectedDraggable = draggable;
      }
   },

   _getDraggable: function (e) {
      var eventTarget      = e.target ? e.target : e.srcElement; //compat
      var draggableObject  = eventTarget.draggable;

      var candidate = eventTarget;
      // if the thing we got the event for isn't actually draggable, traverse
      // up the hierarchy until we find something that is
      while (draggableObject == null && candidate.parentNode) {
         candidate = candidate.parentNode;
         draggableObject = candidate.draggable;
      }
      return draggableObject
   },

   // the actual handler for mouse down events
   _mouseDownHandler: function(e) {
      if ( arguments.length == 0 )
         e = event;

      // if not button 1 ignore it...
      var nsEvent = e.which != undefined;
      if ( (nsEvent && e.which != 1) || (!nsEvent && e.button != 1))
         return;

      var draggableObject = this._getDraggable(e);
   
      if ( draggableObject == null ){
         // we didn't actually find a draggable, so don't do anything
         return;
      }

      if( ! draggableObject.isSelected()){
         this.updateSelection( draggableObject, e.ctrlKey || e.shiftKey );
         this.newlySelected = true;
      }

      // clear the drop zones position cache...
      if ( this.hasSelection() )
         for ( var i = 0 ; i < this.dropZones.length ; i++ )
            this.dropZones[i].clearPositionCache();

      for ( var i = 0 ; i < this.currentDragObjects.length ; i++ ){
          this.setStartDragFromDraggable( e, this.currentDragObjects[i] );
      }
   },


   _mouseMoveHandler: function(e) {
      var nsEvent = e.which != undefined;
      if ( !this.interestedInMotionEvents ) {
//         this._terminateEvent(e);
         return;
      }

      if ( ! this.hasSelection() )
         return;

      if ( ! this.currentDragObjectVisible )
         this._startDrag(e);

      if ( !this.activatedDropZones )
         this._activateRegisteredDropZones();

      this._updateDraggableLocation(e);
      this._updateDropZonesHover(e);

      this._terminateEvent(e);
   },

   // Switches to the drag UI for the dragged object - XXX I don't think we need this.
   _makeDraggableObjectVisible: function(e)
   {
      if ( !this.hasSelection() )
         return;

      var dragElement;
      if ( this.currentDragObjects.length > 1 )
         dragElement = this.currentDragObjects[0].getMultiObjectDragGUI(this.currentDragObjects);
      else
         dragElement = this.currentDragObjects[0].getSingleObjectDragGUI();

      // go ahead and absolute position it...
      if ( Utils.getElementsComputedStyle(dragElement, "position")  != "absolute" )
         dragElement.style.position = "absolute";

      // need to parent him into the document...
      if ( dragElement.parentNode == null || dragElement.parentNode.nodeType == 11 )
         document.body.appendChild(dragElement);

      this.dragElement = dragElement;
      this._updateDraggableLocation(e);

      this.currentDragObjectVisible = true;
   },

   // updates the location of the objects being dragged
   _updateDraggableLocation: function(e) {
      for ( var i = 0 ; i < this.currentDragObjects.length ; i++ ){
         var currentDragObject = this.currentDragObjects[i];
         var dragObjectStyle = currentDragObject.htmlElement.style;
         dragObjectStyle.left = (e.screenX - currentDragObject.startx) + "px"
         dragObjectStyle.top  = (e.screenY - currentDragObject.starty) + "px";
         currentDragObject.duringDrag();
         this.wasDrag = true;
      }
   },

   // turns off and on which drop zones currently have hover indicators on
   _updateDropZonesHover: function(e) {
      var n = this.dropZones.length;

      var currentDropZone = this._getCurrentDropZone(e);

      for ( var i = 0 ; i < n ; i++ ) {
         if ( ! this.dropZones[i] != currentDropZone )
            this.dropZones[i].hideHover();

         if ( ! this.dropZones[i] == currentDropZone ){
            if ( this.dropZones[i].canAccept(this.currentDragObjects) )
                this.dropZones[i].showHover();
         }
      }
   },

   // starts the drag on the currently selected objects
   _startDrag: function(e) {
      for ( var i = 0 ; i < this.currentDragObjects.length ; i++ )
         this.currentDragObjects[i].startDrag();

      this._makeDraggableObjectVisible(e);
   },

   _mouseUpHandler: function(e) {
      if ( ! this.hasSelection() ){
         return;
      }

      if ( ! this.wasDrag
           && ! this.newlySelected ) {
         var draggableObject = this._getDraggable(e);
         if(draggableObject != null){
             this.updateSelection( draggableObject, (e.shiftKey || e.ctrlKey) );
         }
      }
      this.wasDrag = false;
      this.newlySelected = false;

      var nsEvent = e.which != undefined;
      if ( (nsEvent && e.which != 1) || (!nsEvent && e.button != 1)){
         return;
      }

      this.interestedInMotionEvents = false;

      if ( this.dragElement == null ) {
         this._terminateEvent(e);
         return;
      }

      if ( this._placeDraggableInDropZone(e) ){
         this._completeDropOperation(e);
      } else {
         this._terminateEvent(e);
         for ( var i = 0 ; i < this.currentDragObjects.length ; i++ ){
            var dragObject = this.currentDragObjects[i];
            new Effect.Position( dragObject.htmlElement,
                                 dragObject.origPos.x,
                                 dragObject.origPos.y,
                                 100,
                                 20,
                                 { complete : this._doCancelDragProcessing.bindWithParams(this,dragObject) } );
         }
      }
   },

   _completeDropOperation: function(e) {
      // remove the drag element if it was added just for the drag
      if ( this.dragElement != this.currentDragObjects[0].getMouseDownHTMLElement() ) {
         if ( this.dragElement.parentNode != null )
            this.dragElement.parentNode.removeChild(this.dragElement);
      }

      this._deactivateRegisteredDropZones();
      this._endDrag();
      this.dragElement = null;
      this.currentDragObjectVisible = false;
      this._terminateEvent(e);
   },

   _doCancelDragProcessing: function(dragObject) {
      dragObject.cancelDrag();

      // remove the drag element if it was added just for the drag
      if ( this.dragElement != null &&
           this.dragElement != this.currentDragObjects[0].getMouseDownHTMLElement() ) {
         if ( this.dragElement.parentNode != null ) {
            this.dragElement.parentNode.removeChild(this.dragElement);
         }
      }

      this._deactivateRegisteredDropZones();
      this.dragElement = null;
      this.currentDragObjectVisible = false;
   },

   _placeDraggableInDropZone: function(e) {
      var foundDropZone = false;
      var n = this.dropZones.length;

      var currentDropZone = this._getCurrentDropZone(e);

     if ( currentDropZone ) {
        if ( currentDropZone.canAccept(this.currentDragObjects) ) {
           currentDropZone.accept(this.currentDragObjects);
           foundDropZone = true;
        }
     }

      for ( var i = 0 ; i < n ; i++ ) {
         this.dropZones[i].hideHover();
      }

      return foundDropZone;
   },

   // gets the drop zone that the mouse is currently inside
   _getCurrentDropZone: function(e){
      var currentDropZone = null;
      var n = this.dropZones.length;
      outer:
      for ( var i = 0 ; i < n ; i++ ) {
         var dropZone = this.dropZones[i];
         if ( this._mousePointInDropZone( e, this.dropZones[i] ) ) {
            var obj_count = this.currentDragObjects.length;
            for (var j = 0; j < obj_count; j++){
                if(Utils.hasAncestor(dropZone.htmlElement,
                                     this.currentDragObjects[j].htmlElement)){
                    // skip drop zones that are children of any of the objects we're dragging
                    continue outer;
                }
            }
            if(currentDropZone == null){
               currentDropZone=dropZone;
               continue;
            }
            if(Utils.hasAncestor(dropZone.htmlElement,
                                 currentDropZone.htmlElement)){
               currentDropZone=dropZone;
               continue;
            }
            if(currentDropZone.htmlElement.parentNode ==
               dropZone.htmlElement.parentNode
               && dropZone.htmlElement.zIndex >
                  currentDropZone.htmlElement.zIndex){
               currentDropZone=dropZone;
               continue;
            }
         }
      }
      return currentDropZone;
   },

   // call endDrag on each of the draggables
   _endDrag: function() {
      for ( var i = 0 ; i < this.currentDragObjects.length ; i++ )
         this.currentDragObjects[i].endDrag();
   },

   // returns true if the mouse is located in the given drop zone
   _mousePointInDropZone: function( e, dropZone ) {
       // TODO this is where the zindex awareness should go, I think.

      var absoluteRect = dropZone.getAbsoluteRect();

      return e.clientX  > absoluteRect.left  &&
             e.clientX  < absoluteRect.right &&
             e.clientY  > absoluteRect.top   &&
             e.clientY  < absoluteRect.bottom;
   },

   // adds the mouse down handler to the mouseDownElement for the given draggable
   _addMouseDownHandler: function( aDraggable )
   {
      var htmlElement = aDraggable.getMouseDownHTMLElement();
      if ( htmlElement != null ) {
         // actually assign the draggable object as a property of the html object - this is very clever
         htmlElement.draggable = aDraggable;
         this._addMouseDownEvent( htmlElement );
      }
   },

   // activates any drop zones that can accept the currently being drug objects
   _activateRegisteredDropZones: function() {
      var n = this.dropZones.length;
      for ( var i = 0 ; i < n ; i++ ) {
         var dropZone = this.dropZones[i];
         if ( dropZone.canAccept(this.currentDragObjects) )
            dropZone.activate();
      }

      this.activatedDropZones = true;
   },

   // deactivates any currently activated drop zones
   _deactivateRegisteredDropZones: function() {
      var n = this.dropZones.length;
      for ( var i = 0 ; i < n ; i++ )
         this.dropZones[i].deactivate();
      this.activatedDropZones = false;
   },

   // actually adds the mouse down handler to the given html element
   _addMouseDownEvent: function( htmlElement ) {
      if ( typeof document.implementation != "undefined" &&
         document.implementation.hasFeature("HTML",   "1.0") &&
         document.implementation.hasFeature("Events", "2.0") &&
         document.implementation.hasFeature("CSS",    "2.0") ) {
         htmlElement.addEventListener("mousedown", this._mouseDownHandler.bindAsEventListener(this), false);
      }
      else {
         htmlElement.attachEvent( "onmousedown", this._mouseDownHandler.bindAsEventListener(this) );
      }
   },

   // terminates the given event (but does not prevent the default action from happening - this behavior is different from rico)
   _terminateEvent: function(e) {
      if ( e.stopPropagation != undefined )
         e.stopPropagation();
      else if ( e.cancelBubble != undefined )
         e.cancelBubble = true;

    /*
      if ( e.preventDefault != undefined )
         e.preventDefault();
      else
         e.returnValue = false;
    */
   },

   // sets up the document listeners for mouse up and mouse move
   initializeEventHandlers: function() {
      if ( typeof document.implementation != "undefined" &&
         document.implementation.hasFeature("HTML",   "1.0") &&
         document.implementation.hasFeature("Events", "2.0") &&
         document.implementation.hasFeature("CSS",    "2.0") ) {
         document.addEventListener("mouseup",   this._mouseUpHandler.bindAsEventListener(this),  false);
         document.addEventListener("mousemove", this._mouseMoveHandler.bindAsEventListener(this), false);
      } else {
         document.attachEvent( "onmouseup",   this._mouseUpHandler.bindAsEventListener(this) );
         document.attachEvent( "onmousemove", this._mouseMoveHandler.bindAsEventListener(this) );
      }
   }
});

var dndMgr = new DragAndDrop();
dndMgr.initializeEventHandlers();


var Draggable = Class.create();

Draggable.prototype = {

   initialize: function( type, htmlElement ) {
      this.type          = type;
      this.htmlElement   = $(htmlElement);
      this.selected      = false;
   },

   /**
    *   Returns the HTML element that should have a mouse down event
    *   added to it in order to initiate a drag operation
    *
    **/
   getMouseDownHTMLElement: function() {
      return this.htmlElement;
   },

   select: function() {
      this.selected = true;

      if ( this.showingSelected )
         return;

      var htmlElement = this.getMouseDownHTMLElement();

//      var color = Rico.Color.createColorFromBackground(htmlElement);
//      color.isBright() ? color.darken(0.033) : color.brighten(0.033);
//
//      this.saveBackground = RicoUtil.getElementsComputedStyle(htmlElement, "backgroundColor", "background-color");
//      htmlElement.style.backgroundColor = color.asHex();
      this.showingSelected = true;
   },

   deselect: function() {
      this.selected = false;
      if ( !this.showingSelected )
         return;

      var htmlElement = this.getMouseDownHTMLElement();

      htmlElement.style.backgroundColor = this.saveBackground;
      this.showingSelected = false;
   },

   isSelected: function() {
      return this.selected;
   },

   startDrag: function() {
   },

   duringDrag: function() {
   },

   cancelDrag: function() {
   },

   endDrag: function() {
   },

   getSingleObjectDragGUI: function() {
      return this.htmlElement;
   },

   getMultiObjectDragGUI: function( draggables ) {
      return this.htmlElement;
   },

   getDroppedGUI: function() {
      return this.htmlElement;
   }
}


var Dropzone = Class.create();

Dropzone.prototype = {

   initialize: function( htmlElement ) {
      this.htmlElement  = $(htmlElement);
      this.absoluteRect = null;
   },

   getHTMLElement: function() {
      return this.htmlElement;
   },

   clearPositionCache: function() {
      this.absoluteRect = null;
   },

   getAbsoluteRect: function() {
      if ( this.absoluteRect == null ) {
         var htmlElement = this.getHTMLElement();
         var pos = Utils.toViewportPosition(htmlElement);

         this.absoluteRect = {
            top:    pos.y,
            left:   pos.x,
            bottom: pos.y + htmlElement.offsetHeight,
            right:  pos.x + htmlElement.offsetWidth
         };
      }
      return this.absoluteRect;
   },

   activate: function() {
      var htmlElement = this.getHTMLElement();
      if (htmlElement == null  || this.showingActive)
         return;

      this.showingActive = true;
//      this.saveBackgroundColor = htmlElement.style.backgroundColor;
//
//      var fallbackColor = "#ffea84";
//      var currentColor = Rico.Color.createColorFromBackground(htmlElement);
//      if ( currentColor == null )
//         htmlElement.style.backgroundColor = fallbackColor;
//      else {
//         currentColor.isBright() ? currentColor.darken(0.2) : currentColor.brighten(0.2);
//         htmlElement.style.backgroundColor = currentColor.asHex();
//      }
   },

   deactivate: function() {
      var htmlElement = this.getHTMLElement();
      if (htmlElement == null || !this.showingActive)
         return;

      htmlElement.style.backgroundColor = this.saveBackgroundColor;
      this.showingActive = false;
      this.saveBackgroundColor = null;
   },

   showHover: function() {
      var htmlElement = this.getHTMLElement();
      if ( htmlElement == null || this.showingHover )
         return;

      this.saveBorderWidth = htmlElement.style.borderWidth;
      this.saveBorderStyle = htmlElement.style.borderStyle;
      this.saveBorderColor = htmlElement.style.borderColor;

      this.showingHover = true;
      htmlElement.style.borderWidth = "1px";
      htmlElement.style.borderStyle = "solid";
      //htmlElement.style.borderColor = "#ff9900";
      htmlElement.style.borderColor = "#ffff00";
   },

   hideHover: function() {
      var htmlElement = this.getHTMLElement();
      if ( htmlElement == null || !this.showingHover )
         return;

      htmlElement.style.borderWidth = this.saveBorderWidth;
      htmlElement.style.borderStyle = this.saveBorderStyle;
      htmlElement.style.borderColor = this.saveBorderColor;
      this.showingHover = false;
   },

   canAccept: function(draggableObjects) {
      return true;
   },

   accept: function(draggableObjects) {
      var htmlElement = this.getHTMLElement();
      if ( htmlElement == null )
         return;

      n = draggableObjects.length;
      for ( var i = 0 ; i < n ; i++ )
      {
         var theGUI = draggableObjects[i].getDroppedGUI();
         if ( Utils.getElementsComputedStyle( theGUI, "position" ) == "absolute" )
         {
            theGUI.style.position = "static";
            theGUI.style.top = "";
            theGUI.style.top = "";
         }
         htmlElement.appendChild(theGUI);
      }
   }
}

if(typeof Effect == 'undefined'){
    Effect = {};
}

Effect.Position = Class.create();
Effect.Position.prototype = {

   initialize: function(element, x, y, duration, steps, options) {
      new Effect.SizeAndPosition(element, x, y, null, null, duration, steps, options);
  }
}

Effect.SizeAndPosition = Class.create();
Effect.SizeAndPosition.prototype = {

   initialize: function(element, x, y, w, h, duration, steps, options) {
      this.element = $(element);
      this.x = x;
      this.y = y;
      this.w = w;
      this.h = h;
      this.duration = duration;
      this.steps    = steps;
      this.options  = arguments[7] || {};

      this.sizeAndPosition();
   },

   sizeAndPosition: function() {
      if (this.isFinished()) {
         if(this.options.complete) this.options.complete(this);
         return;
      }

      if (this.timer)
         clearTimeout(this.timer);

      var stepDuration = Math.round(this.duration/this.steps) ;

      // Get original values: x,y = top left corner;  w,h = width height
      var currentX = this.element.offsetLeft;
      var currentY = this.element.offsetTop;
      var currentW = this.element.offsetWidth;
      var currentH = this.element.offsetHeight;

      // If values not set, or zero, we do not modify them, and take original as final as well
      this.x = (this.x) ? this.x : currentX;
      this.y = (this.y) ? this.y : currentY;
      this.w = (this.w) ? this.w : currentW;
      this.h = (this.h) ? this.h : currentH;

      // how much do we need to modify our values for each step?
      var difX = this.steps >  0 ? (this.x - currentX)/this.steps : 0;
      var difY = this.steps >  0 ? (this.y - currentY)/this.steps : 0;
      var difW = this.steps >  0 ? (this.w - currentW)/this.steps : 0;
      var difH = this.steps >  0 ? (this.h - currentH)/this.steps : 0;

      this.moveBy(difX, difY);
      this.resizeBy(difW, difH);

      this.duration -= stepDuration;
      this.steps--;

      this.timer = setTimeout(this.sizeAndPosition.bind(this), stepDuration);
   },

   isFinished: function() {
      return this.steps <= 0;
   },

   moveBy: function( difX, difY ) {
      var currentLeft = this.element.offsetLeft;
      var currentTop  = this.element.offsetTop;
      var intDifX     = parseInt(difX,10);
      var intDifY     = parseInt(difY,10);

      var style = this.element.style;
      if ( intDifX != 0 )
         style.left = (currentLeft + intDifX) + "px";
      if ( intDifY != 0 )
         style.top  = (currentTop + intDifY) + "px";
   },

   resizeBy: function( difW, difH ) {
      var currentWidth  = this.element.offsetWidth;
      var currentHeight = this.element.offsetHeight;
      var intDifW       = parseInt(difW,10);
      var intDifH       = parseInt(difH,10);

      var style = this.element.style;
      if ( intDifW != 0 )
         style.width   = (currentWidth  + intDifW) + "px";
      if ( intDifH != 0 )
         style.height  = (currentHeight + intDifH) + "px";
   }
}

// vim set:sw=3
