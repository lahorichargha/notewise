var NewRelationship = Class.create();
NewRelationship.prototype = {
    initialize: function () {
        this.inDrag = false;
    },

    initializeEventHandlers: function () {
        if ( typeof document.implementation != "undefined" &&
            document.implementation.hasFeature("HTML",   "1.0") &&
            document.implementation.hasFeature("Events", "2.0") &&
            document.implementation.hasFeature("CSS",    "2.0") ) {
            document.addEventListener("mouseup",   this._mouseUpHandler.bindAsEventListener(this),  false);
            document.addEventListener("mousemove", this._mouseMoveHandler.bindAsEventListener(this), false);
        }
        else {
            document.attachEvent( "onmouseup",   this._mouseUpHandler.bindAsEventListener(this) );
            document.attachEvent( "onmousemove", this._mouseMoveHandler.bindAsEventListener(this) );
        }
    },

    startDrag: function(e,start_object) {
        this.inDrag=true;
        this.startObject=start_object;
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
        // the visible kernel coords are probably off - they need the parent's screen position not the relative coords
        var startX = start_object.htmlElement.offsetLeft + start_object.htmlElement.clientWidth/2;
        var startY = start_object.htmlElement.offsetTop + start_object.htmlElement.clientHeight/2;
        var parent = this.startObject.htmlElement.parentNode;
        var parentPos = Utils.toViewportPosition(parent);
        var parentX = start_object.htmlElement.parentNode.offsetLeft;
        var parentY = start_object.htmlElement.parentNode.offsetTop;
        this.line = new LineDraw.Line(start_object.htmlElement.parentNode,
                                      startX+'px',
                                      startY+'px',
                                      (posx-parentPos.x)+'px',
                                      (posy-parentPos.y)+'px'
                                     );
        this.line.img.style.zIndex = 100;
    },

    _mouseUpHandler: function (e) {
        if(this.inDrag){
            this.inDrag = false;
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

            var siblings = this.startObject.htmlElement.parentNode.childNodes;
            for(var i=0; i<siblings.length; i++){
                var element = siblings[i];
                if( (Element.hasClassName(element,'vkernel')||
                     Element.hasClassName(element,'note'))
                   ){
                    var pos = Utils.toViewportPosition(element);
                    var top = pos.y;
                    var left = pos.x;
                    var bottom = pos.y + element.offsetHeight;
                    var right = pos.x + element.offsetWidth;
                    if(posx > left && posx < right
                       && posy > top && posy < bottom){
                        var part1;
                        if(this.startObject.type == 'vkernel'){
                            part1 = this.startObject.kernel_id();
                        } else if(this.startObject.type == 'note') {
                            part1 = this.startObject.id();
                        }
                        var part2;
                        if(element.kernel){
                            part2 = element.kernel.kernel_id();
                        } else if(element.note) {
                            part2 = element.note.id();
                        }
                        if(part2 == part1){
                            // trying to make a relationship with ourselves
                            break;
                        }
                        this.line.destroy();
                        var relationship = new Relationship;
                        relationship.part1(part1);
                        relationship.part2(part2);
                        relationship.type('');
                        relationship.nav('fromright');
                        relationship.insert({asynchronous: true});
                        relationship.realize(this.startObject.container_object().id());
                        dndMgr.updateSelection(relationship,false);
                        relationship.label.focus();
                        return;
                    }
                }
            }

            this.line.destroy();
        }
    },

    _mouseMoveHandler: function (e) {
        if(!this.inDrag){
            return;
        }
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
        var parent = this.startObject.htmlElement.parentNode;
        var parentPos = Utils.toViewportPosition(parent);
        var x = posx-parentPos.x;
        var y = posy-parentPos.y;
        x = Math.max(0,x);
        x = Math.min(x,parent.clientWidth);
        y = Math.max(0,y);
        y = Math.min(y,parent.clientHeight);
        this.line.setP2(x+"px",y+"px");
        Utils.terminateEvent(e);
        Utils.preventDefault(e);
    }
}

var newRelationship = new NewRelationship();
newRelationship.initializeEventHandlers();
