// TODO this has code from rico - need to make sure we comply with license
var Utils;

Utils = {
    // Kills the event so it doesn't propogate up the component hierarchy
    terminateEvent: function(e) {
        dndMgr._terminateEvent(e);
    },

    // Clear the selection (resetting focus to the search box) and terminate the event
    clearSelectionAndTerminate: function(e){
        Utils.terminateEvent(e);
        Utils.preventDefault(e);
        dndMgr.clearSelection();
        dndMgr.giveSearchBoxFocus();
    },

    // prevents the default browser action for this event from occuring
    preventDefault: function(e) {
        if ( e.preventDefault != undefined )
           e.preventDefault();
        else
           e.returnValue = false;
    },


    getElementsByClassName: function(parentElement,className) {
      var children = parentElement.childNodes;
      var elements = new Array();
      
      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if(child.className !== undefined){
            var classNames = child.className.split(' ');
            for (var j = 0; j < classNames.length; j++) {
              if (classNames[j] == className) {
                elements.push(child);
                break;
              }
            }
        }
      }
      
      return elements;
    },

    // Tests to see if this element has the given element as a parent
    hasAncestor: function(childElement, parentElement) {
        if(childElement == null || parentElement == null){
            return false;
        }
        var element = childElement;
        while(element != document){
            if(element == parentElement){
                return true;
            }
            element = element.parentNode;
        }
        return false;
    },

    getElementsComputedStyle: function ( htmlElement, cssProperty, mozillaEquivalentCSS) {
       if ( arguments.length == 2 )
          mozillaEquivalentCSS = cssProperty;

       var el = $(htmlElement);
       if ( el.currentStyle )
          return el.currentStyle[cssProperty];
       else
          return document.defaultView.getComputedStyle(el, null).getPropertyValue(mozillaEquivalentCSS);
    },

    toViewportPosition: function(element) {
       return this._toAbsolute(element,true);
    },

    toDocumentPosition: function(element) {
       var elementPosition = this._toAbsolute(element,false);
       var parentPosition = this._toAbsolute(element.offsetParent);
       return {x: elementPosition.x-parentPosition.x,
               y: elementPosition.y-parentPosition.y};
    },

    /**
     *  Compute the elements position in terms of the window viewport
     *  so that it can be compared to the position of the mouse (dnd)
     *  This is additions of all the offsetTop,offsetLeft values up the
     *  offsetParent hierarchy, ...taking into account any scrollTop,
     *  scrollLeft values along the way...
     *
     * IE has a bug reporting a correct offsetLeft of elements within a
     * a relatively positioned parent!!!
     **/
    _toAbsolute: function(element,accountForDocScroll) {

       if ( navigator.userAgent.toLowerCase().indexOf("msie") == -1 )
          return this._toAbsoluteMozilla(element,accountForDocScroll);

       var x = 0;
       var y = 0;
       var parent = element;
       while ( parent ) {

          var borderXOffset = 0;
          var borderYOffset = 0;
          if ( parent != element ) {
             var borderXOffset = parseInt(this.getElementsComputedStyle(parent, "borderLeftWidth" ),10);
             var borderYOffset = parseInt(this.getElementsComputedStyle(parent, "borderTopWidth" ),10);
             borderXOffset = isNaN(borderXOffset) ? 0 : borderXOffset;
             borderYOffset = isNaN(borderYOffset) ? 0 : borderYOffset;
          }

          x += parent.offsetLeft - parent.scrollLeft + borderXOffset;
          y += parent.offsetTop - parent.scrollTop + borderYOffset;
          try {
              parent = parent.offsetParent;
          } catch (e) {
              break;
          }
       }

       if ( accountForDocScroll ) {
          x -= this.docScrollLeft();
          y -= this.docScrollTop();
       }

       return { x:x, y:y };
    },

    /**
     *  Mozilla did not report all of the parents up the hierarchy via the
     *  offsetParent property that IE did.  So for the calculation of the
     *  offsets we use the offsetParent property, but for the calculation of
     *  the scrollTop/scrollLeft adjustments we navigate up via the parentNode
     *  property instead so as to get the scroll offsets...
     *
     **/
    _toAbsoluteMozilla: function(element,accountForDocScroll) {
       var x = 0;
       var y = 0;
       var parent = element;
       while ( parent ) {
          x += parent.offsetLeft;
          y += parent.offsetTop;
          parent = parent.offsetParent;
       }

       parent = element;
       while ( parent &&
               parent != document.body &&
               parent != document.documentElement ) {
          if ( parent.scrollLeft  )
             x -= parent.scrollLeft;
          if ( parent.scrollTop )
             y -= parent.scrollTop;
          parent = parent.parentNode;
       }

       if ( accountForDocScroll ) {
          x -= this.docScrollLeft();
          y -= this.docScrollTop();
       }

       return { x:x, y:y };
    },

    docScrollLeft: function() {
       if ( window.pageXOffset )
          return window.pageXOffset;
       else if ( document.documentElement && document.documentElement.scrollLeft )
          return document.documentElement.scrollLeft;
       else if ( document.body )
          return document.body.scrollLeft;
       else
          return 0;
    },

    docScrollTop: function() {
       if ( window.pageYOffset )
          return window.pageYOffset;
       else if ( document.documentElement && document.documentElement.scrollTop )
          return document.documentElement.scrollTop;
       else if ( document.body )
          return document.body.scrollTop;
       else
          return 0;
    },

    // fetches the current value for a property, even if there wasn't one explicitly set.
    // styleProp should be of the form "font-size" not "fontSize"
    getStyle: function(el,styleProp) {
	if (el.currentStyle){
		var y = el.currentStyle[styleProp];
	}else if (window.getComputedStyle){
		var y = document.defaultView.getComputedStyle(el,null).getPropertyValue(styleProp);
        }

        if (y === undefined){
            // must be internet explorer
            var words = styleProp.split('-');
            styleProp=words[0];
            for(var i=1; i < words.length; i++){
                styleProp = styleProp + words[i].substr(0,1).toUpperCase() + words[i].substr(1);
            }
            return this.getStyle(el,styleProp);
        } else {
            return y;
        }
    },
    
    constrainToRange: function (val, min, max) {
    	if(val < min) { return min; }
    	if(val > max) { return max; }
    	return val;
    },

    cumulativeOffsetWithBorders: function(element) {
        var valueT = 0, valueL = 0;
        do {
            valueT += element.offsetTop  || 0;
            valueT += Utils.chopPx(Utils.getStyle(element,'border-top-width'))  || 0;
            valueL += element.offsetLeft || 0;
            valueL += Utils.chopPx(Utils.getStyle(element,'border-left-width'))  || 0;
            element = element.offsetParent;
        } while (element);
        return [valueL, valueT];
    },

    // chops any 'px' or '%' from the end of the string and returns a number
    chopPx: function (str) {
        return Number(str.replace(/[a-z%]+/i, ''));
    },

    // TODO refactor everything to use this
    getEventPosition: function(e){
        // get the start point
        var posx = 0;
        var posy = 0;
        if (!e) var e = window.event;
        if (e.pageX || e.pageY) {
            posx = e.pageX;
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft;
            posy = e.clientY + document.body.scrollTop;
        }
        return {x: posx, y: posy};
    },

    // Gets the size of the given text, in the given font
    getTextWidth: function(text, font_size, font_family, font_style){
        // Create the dummy span we will use for checking the size of the text.
        // The idea is that spans size themselves automatically, so it should
        // be possible to set the text in the span (and set the font of the
        // span to the right size), and then check the size of the span.

        // cache for memoization
        if(!Utils.__getTextWidthCache){
            Utils.__getTextWidthCache = {};
        }

        // Replace spaces with &nbsp; so that the browser doesn't collapse the
        // spaces, and thus, stops counting the spaces in the overall width.

        text = text.replace(/ /g, "&nbsp;");

        var cache_key = text + "|" + font_size + "|" + font_family + "|" + font_style;

        if(Utils.__getTextWidthCache[cache_key] !== undefined ){
            return Utils.__getTextWidthCache[cache_key];
        }

        if(Utils.textSizingBox === undefined){
            Utils.textSizingBox = document.createElement('span');
            Utils.textSizingBox.innerHTML = 'a';
            // put it way off the left side of the page so it's not visible
            var body = document.getElementsByTagName('body')[0];
            body.appendChild(Utils.textSizingBox);
            Utils.textSizingBox.style.position = 'absolute';
            Utils.textSizingBox.style.right = '-100px';
            Utils.textSizingBox.style.top = '-500px';
            Utils.textSizingBox.style.border = '1px solid red';
        }
        Utils.textSizingBox.style.fontSize = font_size;
        Utils.textSizingBox.style.fontFamily = font_family;
        Utils.textSizingBox.style.fontStyle = font_style;
        Utils.textSizingBox.innerHTML = text;
        var width = Utils.textSizingBox.offsetWidth;
        Utils.__getTextWidthCache[cache_key] = width;
        return width;
    },

    // returns the widht of the text in a given input field
    getInputTextWidth: function(field, value){
        return Utils.getTextWidth(value || field.value,
                                  Utils.getStyle(field, 'font-size'),
                                  Utils.getStyle(field, 'font-family'),
                                  Utils.getStyle(field, 'font-style'));
    },

    get_agent: function () {
        return navigator.userAgent.toLowerCase();
    },

    is_gecko: function () {
        var agt=this.get_agent();
        return (agt.indexOf('gecko') != -1);
    },

    is_mac: function () {
        var agt=this.get_agent();
        return (agt.indexOf("mac")!=-1);
    },

    is_ie: function () {
        var agt=this.get_agent();
        return (agt.indexOf("msie")!=-1);
    },

    mousex: function(e) {
        // get the start point
        var posx = 0;
        if (!e) var e = window.event;
        if (e.pageX || e.pageY) {
            posx = e.pageX;
        }
        else if (e.clientX || e.clientY) {
            posx = e.clientX + document.body.scrollLeft;
        }
        return posx;
    },

    mousey: function(e) {
        // get the start point
        var posy = 0;
        if (!e) var e = window.event;
        if (e.pageX || e.pageY) {
            posy = e.pageY;
        }
        else if (e.clientX || e.clientY) {
            posy = e.clientY + document.body.scrollTop;
        }
        return posy;
    }
};

function log() {
  // TODO(scotty): Change this to pass any number of arguments using apply()
  if (window.console) {
      console.debug.apply(this, arguments);
  }
}

function stack_trace(skip) {
    var a = stack_trace.caller;
    for(var i = 0; i < skip; i = i + 1) {
        a = a.caller;
    }
    var s = "";  // This is the string we'll return.
    var i = 0;
    for(; a != null; a = a.caller) {
        args = Prototype.argumentsToArray(a.arguments);
        args = args.join(', ');
        func = a.toString();
        func = func.substr(0,func.indexOf('\n',func.indexOf('\n')+1));
        s += ' - '+func+ '(' + args + ")\n";
        if (a.caller == a) break;
        i += 1;
        if (i > 4) break;
    }
    return s;
}

if (!window.console || !console.firebug)
{
    var names = ["log", "debug", "info", "warn", "error", "assert", "dir", "dirxml",
    "group", "groupEnd", "time", "timeEnd", "count", "trace", "profile", "profileEnd"];

    window.console = {};
    for (var i = 0; i < names.length; ++i)
        window.console[names[i]] = function() {}
}
