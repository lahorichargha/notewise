/** 
 * A PaneDivider is the class that handles mouse events for the dividers that
 * split the panes in a SplitPane. One is created automaticaly for each pane
 * that is added to the SplitPane.
 */
var PaneDivider = Class.create();
PaneDivider.prototype = (new Draggable()).extend({	
	initialize: function (splitPane, title) {
		this.parent = splitPane; // the splitPane that this divider is inside of
		this.htmlElement = null;
		this.type = 'PaneDivider';
		this.selected = false;
		this.activeResize = true;
	
		// create the bar itself.
		this.dragBar = document.createElement('div'); 
		this.dragBar.className = 'dragBar';
		this.dragBar.innerHTML = title;
		this.htmlElement = this.dragBar;
		
		// create the button used to collapse
		this.collapseButton = document.createElement('a');
		this.collapseButton.setAttribute("href", "#");
		this.collapseButton.innerHTML = "<->";
		this.collapseButton.onclick = this.collapseHandler.bindAsEventListener(this);
		
		this.dragBar.appendChild(this.collapseButton);
		
		// info used by the drag stuff to restrict bar movement (-1 is unset)
		this.minY = -1;
		this.maxY = -1;
		
		// used by the splitpane to manage the divider (this shouldn' be here...)
		this.paneId = -1;
		this.paneHeight = -1;
		
		// make the bar actually do stuff
		dndMgr.registerDraggable(this);
	},
	
	collapseHandler: function () {
		// TODO figure this one out
		// this.parent.resizeCollapse(this);
	},
	
	select: function () {
		this.dragBar.className = "dragBar selected";
	},
	
	deselect: function () {
		this.dragBar.className = "dragBar";
	},
	
	startDrag: function () {
		// when the drag is started, get the current max and min Y values, and move
		// the bar to the front most layer.
		var height = this.dragBar.clientHeight;
		this.minY = this.parent.getMinY(this);
		this.maxY = this.parent.getMaxY(this) + height;
		
		dndMgr.moveToFront(this.dragBar);
	},
	
	duringDrag: function () {
		// during the drag, make sure to restrict the y values to the range 
		// in this.minY and this.maxY and (if active resize is on) notify the 
		// splitpane of the change.
		top = Utils.constrainToRange(Utils.chopPx(this.dragBar.style.top), this.minY, this.maxY);
		this.dragBar.style.top = top + "px";
		this.dragBar.style.left = 0; // so you can only move in y dir
		
		// tell the parent if we are supposed to
		this.parent.resizeActive(this);
	},
	
	cancelDrag: function () {
		// when the drag is complete, notify the splitpane that the drag is complete
		// and then do the normal exit stuff. This is exactly the same and endDrag.
		this.parent.resizeComplete(this);
		this.cleanupDrag();
	},
	
	endDrag: function () {
		// notify the splitPane of the new location of the splitbar, and then do 
		// any required cleanup
		this.parent.resizeComplete(this);
		this.cleanupDrag();
	},
	
	cleanupDrag: function () {
		// when the drag is done (whether abnormally or successfully), we need
		// to reset the min and max values to their defaults, and reset the class
		// of the dragbar to the default.
		
		this.minY = -1;
		this.maxY = -1;
		this.dragBar.className = "dragBar";
	}
});

/**
 * A SplitPane is used in the sidebar to allow multiple "panes" which are 
 * resizable and collapsable. Each pane is a div, and dividers are placed
 * inbewteen them. A pane is resizeable by moving it's divider and repartioning
 * the space between the pane above it and itself.
 */
var SplitPane = Class.create();
SplitPane.prototype = (new Dropzone).extend({

	initialize: function (id) {
		this.panes = new Array(); // a list of the panes (content divs) we're managing
		this.pdivs = new Array(); // a list of associated PaneDivider objects
		this.htmlElement = $(id);
		
		// TODO make this an additive event handler
		window.onresize = this.layoutChildren.bindAsEventListener(this);
		
		dndMgr.registerDropZone(this);
	},
	
	addPane: function (id, title, prefHeight, skipLayout) {
		// this is called to have a "pane" be managed by the SplitPane. It takes
		// the id of an html element to manage, created a divider for that pane
		// and allows the setting of a title and preferred height for the pane.
		
		// add the pane to the panes list
		var pane = $(id);
		this.panes.push(pane);

		// create the default title
		if(title == null) {
			title = "Pane #" + (this.pdivs.length + 1);
		}

		// add a new divider to the panes list and save the index of the pane in
		// the pane list.
		var pdiv = new PaneDivider(this, title);
		pdiv.paneId = this.pdivs.length;
		this.pdivs.push(pdiv);
		
		// add the panes to the splitpane node
		this.htmlElement.appendChild(pdiv.dragBar);
		this.htmlElement.appendChild(pane);

		// save the preferred height of the pane
		if(prefHeight != null) {
			pdiv.paneHeight = prefHeight;
		}

		// redo the layout unless it's told not to
		if(skipLayout == null || !skipLayout) {
			this.layoutChildren();
		}
	},
	
	makePercent: function (h) {
		return ((h / this.htmlElement.clientHeight) * 100);
	},
	
	fromPercent: function (h) {
		return ((h * this.htmlElement.clientHeight) / 100);
	},

	accept: function(draggableObjects) {
		// override the position absolut case
    var htmlElement = this.getHTMLElement();
    if ( htmlElement == null )
    	return;

    n = draggableObjects.length;
    for ( var i = 0 ; i < n ; i++ )
    {
    	var theGUI = draggableObjects[i].getDroppedGUI();
     	htmlElement.appendChild(theGUI);
   	}
	},
	
	resizeComplete: function (pdiv) {
		if(pdiv.paneId == 0) { return; } // moving the top one does nothing
		
		// resize two panes - top pane is (bar.top - min), bottom is 
		// (max - bar.top) + bar.height
		var bartop = Utils.chopPx(pdiv.dragBar.style.top);
		var topheight = bartop - this.getMinY(pdiv);
		var botheight = this.getMaxY(pdiv) - bartop + pdiv.dragBar.clientHeight;
	
		this.pdivs[pdiv.paneId - 1].paneHeight = this.makePercent(topheight);
		pdiv.paneHeight = this.makePercent(botheight);
		
		this.layoutChildren();
	},
	
	resizeActive: function (pdiv) {
		//this.resizeComplete(pdiv);
	},
	
	resizeCollapse: function (pdiv) {
		if(pdiv.paneId == (this.pdivs.length - 1)) {
			// if we are the last one, then we can move this one to the bottom
			var max = this.getMaxY(pdiv);
			pdiv.dragBar.style.top = max + "px";
			this.resizeComplete(pdiv);
		} else {
			// if we are the top, then we have to move the under one up
			var newPdiv = this.pdivs[pdiv.paneId + 1];
			var min = this.getMinY(newPdiv);
			newPdiv.dragBar.style.top = min + "px";
			this.resizeComplete(newPdiv);
		}
	},
	
	layoutChildren: function () {
		// do the actual layout of all the children.
		
		// if we have no children, don't do anything.
		if(this.panes.length == 0) return;
	
		var totalSize = this.htmlElement.clientHeight;
		var dragBarHeight = this.pdivs[0].dragBar.clientHeight;
		
		// remove the height of the dragbars 
		// (TODO kludgy, maybe store height as a class var of PaneDivider?)
		totalSize -= this.panes.length * dragBarHeight;

		// figure out which of the panes have a stored height (in %)
		var presetPanes = new Array();
		for(var i = 0; i < this.panes.length; i++) {
			if (this.pdivs[i].paneHeight != -1)
				presetPanes.push(i);
		}
		
		// remove the size of preset panes from the available height
		for(var i = 0; i < presetPanes.length; i++) {
			totalSize -= this.fromPercent(this.pdivs[presetPanes[i]].paneHeight);
		}
		
		// totalSize is now the size we can work with.
		var defaultSize = totalSize / (this.panes.length - presetPanes.length);

		var top = 0;
		// now go through and setup the children
		for(var i = 0; i < this.panes.length; i++) {
			var pstyle = this.panes[i].style;
			var paneHeight = this.pdivs[i].paneHeight;
			
			// set the location of the dragbar
			this.pdivs[i].dragBar.style.top = top + "px";
			this.pdivs[i].dragBar.style.left = 0;
			top += dragBarHeight;  
			
			// generate the height the pane should be
			var height = 0;
			if(paneHeight < 0)
				height = defaultSize;
			else
				height = ((paneHeight / 100) * this.htmlElement.clientHeight);

			// place and size the pane
			pstyle.height = height + "px";
			pstyle.top = top + "px";
			pstyle.left = 0;
			top += height;
		}
		
		// the bottom child get done separately, and always takes the remainder of the screen
		
	},
	
	getMaxY: function(pdiv) {
		// get the max Y coordinate that the divider can be dragged to
		if(pdiv.paneId == 0) {
			// if we're the first pane, we can't move the dragbar, and the divider
			// adds it's height from the max, so to make this 0, return -height 
			var h = pdiv.dragBar.clientHeight;
			return -h;
		}
		
		// max is the min, plus the previous pane, plus the current pane, minus 
		// one divider height
		var max = this.getMinY(pdiv);
		max += Utils.chopPx(this.panes[pdiv.paneId - 1].style.height); 
		max += Utils.chopPx(this.panes[pdiv.paneId].style.height);
		max -= pdiv.dragBar.clientHeight;
		
		return max;
	},
	
	getMinY: function(pdiv) {
		// get the minimum y coord of the divider bar
		if(pdiv.paneId == 0) return 0; // if we're the first pane, don't move
		
		// min is the sum of the heights of all panes and dragbars up until the
		// pane above the current dragbar
		var min = 0;
		var id = pdiv.paneId;
		for(var i = 0; i < (id-1); i++) {
			min += pdiv.dragBar.clientHeight;
			min += Utils.chopPx(this.panes[i].style.height);
		}
		
		// loop ended at the last pane, add the last dragbar
		min += pdiv.dragBar.clientHeight;
		
		return min;
	}
});
