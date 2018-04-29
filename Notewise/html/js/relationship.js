var Relationship = Class.create();
Relationship.extend(JSDBI);
Relationship.prototype = {};
JSDBI.inherit(Relationship,new JSDBI());

Relationship.fields(['id',
                     'nav',
                     'part1',
                     'part2',
                     'type']);
Relationship.url('rest/relationship');
Relationship.elementTag('relationship');

Relationship.prototype.extend( {
    initialize: function (id,part1,part2,type,nav){
        this.__id=id;
        this.__part1=part1;
        this.__part2=part2;
        this.__type=type;
        this.__nav=nav;
        JSDBI.prototype.initialize.call(this);
    },

    realize: function(parent_id){
        this.part1ContainedObject=objectCache[parent_id+'/'+this.part1()];
        this.part2ContainedObject=objectCache[parent_id+'/'+this.part2()];
        if(!this.part1ContainedObject){
            alert("Couldn't find "+parent_id+'/'+this.part1());
        }
        if(!this.part2ContainedObject){
            alert("Couldn't find "+parent_id+'/'+this.part2());
        }
        this.intersect1={x:0, y:0}; // in percentage
        this.intersect2={x:0, y:0}; // in percentage
        this.midx;  // center of line, in terms of pixels relative to image
        this.midy;  // center of line, in terms of pixels relative to image
        this.htmlElement = document.createElement('div');
        this.htmlElement.className='relationship relationship-notselected';
        this.htmlElement.id=this.idString();
        this.htmlElement.relationship=this;
        this.part1ContainedObject.htmlElement.parentNode.appendChild(this.htmlElement);
        this.line = new LineDraw.Line(this.part1ContainedObject.htmlElement.parentNode,
                                      (Number(this.part1ContainedObject.x())+this.part1ContainedObject.currentWidth()/2)+'%',
                                      (Number(this.part1ContainedObject.y())+this.part1ContainedObject.currentHeight()/2)+'%',
                                      (Number(this.part2ContainedObject.x())+this.part2ContainedObject.currentWidth()/2)+'%',
                                      (Number(this.part2ContainedObject.y())+this.part2ContainedObject.currentHeight()/2)+'%');
        this.createLabel();
        this.createButtons();
        this.createArrows();
        this.registerListeners();
        this.updateMiddle();

        this.layoutLabel();

        this.over1 = false;
        this.over2 = false;

        this.cache();
    },

    // caches relationship in it's endpoints, so they can remove the relationship if they get removed or reparented
    cache: function() {
        this.part1ContainedObject.cacheRelationship(this);
        this.part2ContainedObject.cacheRelationship(this);
    },

    idString: function() {
        return 'relationship'+this.part1ContainedObject.id()+'/'+this.part2ContainedObject.id();
    },

    createLabel: function() {
        // this div holds the label and associated buttons, so they can be easily moved as a single unit
        this.labelDiv = document.createElement('div');
        this.labelDiv.className='labelDiv';
        this.htmlElement.appendChild(this.labelDiv);

        this.label = document.createElement('input');
        this.label.value = this.type();
        if(this.type() == null || this.type() == ''){
            Element.hide(this.label);
        }
        this.label.className = 'relationshipLabel';
        this.labelDiv.appendChild(this.label);
    },

    createButtons: function() {
        this.removeButton = document.createElement('div');
        this.removeButton.className='removebutton';
        this.labelDiv.appendChild(this.removeButton);
    },

    createArrows: function() {
        this.arrowCanvasElements = [];
        this.arrowCanvases = [];
        this.arrowClickBoxen = [];
        this.arrowDivs = [];
        for(var i=0; i < 2; i++){
            this.arrowDivs[i] = document.createElement('div');
            this.arrowDivs[i].className='arrowdiv';
            this.htmlElement.appendChild(this.arrowDivs[i]);

            this.arrowCanvasElements[i] = document.createElement('div');
            this.arrowCanvasElements[i].id='canvas'+i+'/'+this.idString();
            this.arrowCanvasElements[i].className='arrowcanvas';
            this.arrowDivs[i].appendChild(this.arrowCanvasElements[i]);
            this.arrowCanvases[i] = new jsGraphics('canvas'+i+'/'+this.idString());

            this.arrowClickBoxen[i] = document.createElement('div');
            this.arrowClickBoxen[i].className='arrowclickbox';
            this.arrowDivs[i].appendChild(this.arrowClickBoxen[i]);
        }
        this.updateArrows();
    },

    layoutLabel: function() {
        var width = Math.max(Utils.getInputTextWidth(this.label),20);
        this.label.style.width = width+'px';
        this.label.style.left = (-1*width/2)+'px';
        this.removeButton.style.left = (width/2+5)+'px';

        // scroll the text field all the way to the left again - apparently
        // setting the value of a text input field again causes it to properly
        // scroll all the way to the left
        this.label.value = this.label.value;
    },

    layoutResize: function() {
        this.updateArrows();
        this.updatePosition1();
        this.updatePosition2();
//        this.line.update();
    },

    updatePosition1: function(object,x,y){
        if(x == null || y == null){
            x = Number(this.part1ContainedObject.x());
            y = Number(this.part1ContainedObject.y());
        } else {
            x = Number(Utils.chopPx(x));
            y = Number(Utils.chopPx(y));
        }
        x = (x + this.part1ContainedObject.currentWidth(this.part1ContainedObject.oldParentNode)/2)+'%';
        y = (y + this.part1ContainedObject.currentHeight(this.part1ContainedObject.oldParentNode)/2)+'%';
        this.line.setP1(x,y);
    },

    updatePosition2: function(object,x,y){
        if(x == null || y == null){
            x = Number(this.part2ContainedObject.x());
            y = Number(this.part2ContainedObject.y());
        } else {
            x = Number(Utils.chopPx(x));
            y = Number(Utils.chopPx(y));
        }
        x = (x + this.part2ContainedObject.currentWidth(this.part2ContainedObject.oldParentNode)/2)+'%';
        y = (y + this.part2ContainedObject.currentHeight(this.part2ContainedObject.oldParentNode)/2)+'%';
        this.line.setP2(x,y);
    },

    updateArrows: function() {
        this.moveArrows();
        this.arrowCanvases[0].clear();
        this.arrowCanvases[1].clear();

        var vkernel1Pos = Utils.toViewportPosition(this.part1ContainedObject.htmlElement);
        var vkernel2Pos = Utils.toViewportPosition(this.part2ContainedObject.htmlElement);

        var angle = Math.atan2(vkernel2Pos.y+this.part2ContainedObject.htmlElement.clientHeight/2
                               - (vkernel1Pos.y+this.part1ContainedObject.htmlElement.clientHeight/2),
                               vkernel1Pos.x + this.part1ContainedObject.htmlElement.clientWidth/2
                               - (vkernel2Pos.x+this.part2ContainedObject.htmlElement.clientWidth/2));

        if(this.nav() == 'fromleft'
           || this.nav() == 'bi'
           || this.over1){
            if(this.nav() == 'fromleft'
               || this.nav() == 'bi'){
                this.arrowCanvases[0].setColor('#000000');
            } else {
                this.arrowCanvases[0].setColor('#2CA6E9');
            }
            this.drawArrow(this.arrowCanvases[0],17,17,angle);
            this.arrowCanvases[0].paint();
        }
        if(this.nav() == 'fromright'
           || this.nav() == 'bi'
           || this.over2){
            if(this.nav() == 'fromright'
               || this.nav() == 'bi'){
                this.arrowCanvases[1].setColor('#000000');
            } else {
                this.arrowCanvases[1].setColor('#2CA6E9');
            }
            this.drawArrow(this.arrowCanvases[1],17,17,angle+Math.PI);
            this.arrowCanvases[1].paint();
        }
        this.moveClickBoxes(angle);
        this.justUpdatedArrows=true;
        this.needUpdateArrows=false;
    },

    moveLabelDiv: function(x,y) {
        this.labelDiv.style.left=(x)+'%';
        this.labelDiv.style.top=(y)+'%';
    },

    moveArrows: function() {
        // figure out the intersection between each box and the line between them
        var rect1 = new Rectangle(this.part1ContainedObject.x(),
                                  this.part1ContainedObject.y(),
                                  this.part1ContainedObject.currentWidth(),
                                  this.part1ContainedObject.currentHeight());
        var rect2 = new Rectangle(this.part2ContainedObject.x(),
                                  this.part2ContainedObject.y(),
                                  this.part2ContainedObject.currentWidth(),
                                  this.part2ContainedObject.currentHeight());

        line = [{x: Number(this.part1ContainedObject.x())+Number(this.part1ContainedObject.currentWidth())/2,
                 y: Number(this.part1ContainedObject.y())+Number(this.part1ContainedObject.currentHeight())/2},
                {x: Number(this.part2ContainedObject.x())+Number(this.part2ContainedObject.currentWidth())/2,
                 y: Number(this.part2ContainedObject.y())+Number(this.part2ContainedObject.currentHeight())/2}];

        // intersects denote where the line intersects the edge of each object
        // - used to place the label and arrows
        this.intersect1 = rect1.getLineIntersect(line);
        this.intersect2 = rect2.getLineIntersect(line);

        if(this.intersect1){
            this.arrowDivs[0].style.left=(this.intersect1.x)+'%';
            this.arrowDivs[0].style.top=(this.intersect1.y)+'%';
        }
        if(this.intersect2){
            this.arrowDivs[1].style.left=(this.intersect2.x)+'%';
            this.arrowDivs[1].style.top=(this.intersect2.y)+'%';
        }
        if(this.intersect1 && this.intersect2){
            var x=Math.min(this.intersect1.x,this.intersect2.x)+Math.abs(this.intersect2.x-this.intersect1.x)/2;
            var y=Math.min(this.intersect1.y,this.intersect2.y)+Math.abs(this.intersect2.y-this.intersect1.y)/2;
            this.moveLabelDiv(x,y);
        }
    },

    moveClickBoxes: function(angle) {
        var extents1 = this.getExtents(this.getArrowCoords(17,17,angle));
        var extents2 = this.getExtents(this.getArrowCoords(17,17,angle+Math.PI));
        this.arrowClickBoxen[0].style.left=(extents1.minX-17)+'px';
        this.arrowClickBoxen[0].style.top=(extents1.minY-17)+'px';
        this.arrowClickBoxen[0].style.width=(extents1.maxX - extents1.minX)+'px';
        this.arrowClickBoxen[0].style.height=(extents1.maxY - extents1.minY)+'px';
        this.arrowClickBoxen[1].style.left=(extents2.minX-17)+'px';
        this.arrowClickBoxen[1].style.top=(extents2.minY-17)+'px';
        this.arrowClickBoxen[1].style.width=(extents2.maxX - extents2.minX)+'px';
        this.arrowClickBoxen[1].style.height=(extents2.maxY - extents2.minY)+'px';
    },

    getExtents: function(coords) {
        var minX=900;
        var minY=900;
        var maxX=0;
        var maxY=0;
        for(var i=0; i<coords[0].length; i++){
            if(coords[0][i] < minX){ minX = coords[0][i]; }
            if(coords[0][i] > maxX){ maxX = coords[0][i]; }
            if(coords[1][i] < minY){ minY = coords[1][i]; }
            if(coords[1][i] > maxY){ maxY = coords[1][i]; }
        }
        return {minX: minX, minY: minY, maxX: maxX, maxY: maxY};
    },

    // draws an arrow with the point of the arow at the x and y coordinates specified, with the angle specified.  A zero angle means the arrow is pointing to the right
    drawArrow: function(canvas, x, y, theta) {
        var coords = this.getArrowCoords(x,y,theta);
        canvas.fillPolygon(coords[0], coords[1]);
    },

    getArrowCoords: function(x,y,theta){
        var coords = [[-15,0,-15], [-7,0,7]];
        this.rotate(coords,theta);
        this.translate(coords,x,y);
        return coords;
    },

    translate: function(coords,x,y){
        for(var i=0; i<coords[0].length; i++){
            coords[0][i] += x;
            coords[1][i] += y;
        }
        return coords;
    },

    rotate: function(coords,theta){
        for(var i=0; i<coords[0].length; i++){
            var cos = Math.cos(theta);
            var sin = Math.sin(theta);
            var x = coords[0][i];
            var y = coords[1][i];
            coords[0][i]=cos*x + sin*y;
            coords[1][i]=-sin*x + cos*y;
        }
        return coords;
    },

    registerListeners: function() {
        Event.observe(this.label,
                                    'mousedown',
                                    Utils.terminateEvent.bindAsEventListener(this));
        Event.observe(this.label,
                                    'dblclick',
                                    Utils.terminateEvent.bindAsEventListener(this));

        Event.observe(this.label,
                                    'click',
                                    this.selectAndTerminate.bindAsEventListener(this));
        Event.observe(this.label,
                                    'blur',
                                    this.labelBlur.bindAsEventListener(this));

        Event.observe(this.label,
                                    'mouseover',
                                    this.showLabel.bindAsEventListener(this));
        Event.observe(this.label,
                                    'mouseout',
                                    this.labelOut.bindAsEventListener(this));
        Event.observe(this.line.img,
                                    'mousemove',
                                    this.mouseMove.bindAsEventListener(this));

        Event.observe(this.removeButton,
                                    'mousedown',
                                    Utils.terminateEvent.bindAsEventListener(this));
        Event.observe(this.removeButton,
                                    'dblclick',
                                    Utils.terminateEvent.bindAsEventListener(this));
        Event.observe(this.removeButton,
                                    'click',
                                    this.removeButtonClick.bindAsEventListener(this));

        Event.observe(this.arrowCanvasElements[0],
                                    'mousedown',
                                    Utils.terminateEvent.bindAsEventListener(this));
        Event.observe(this.arrowCanvasElements[0],
                                    'dblclick',
                                    Utils.terminateEvent.bindAsEventListener(this));
        Event.observe(this.arrowCanvasElements[0],
                                    'click',
                                    Utils.terminateEvent.bindAsEventListener(this));

        Event.observe(this.arrowCanvasElements[1],
                                    'mousedown',
                                    Utils.terminateEvent.bindAsEventListener(this));
        Event.observe(this.arrowCanvasElements[1],
                                    'dblclick',
                                    Utils.terminateEvent.bindAsEventListener(this));
        Event.observe(this.arrowCanvasElements[1],
                                    'click',
                                    Utils.terminateEvent.bindAsEventListener(this));

        Event.observe(this.arrowClickBoxen[0],
                                    'click',
                                    this.arrow1click.bindAsEventListener(this));
        Event.observe(this.arrowClickBoxen[0],
                                    'mouseover',
                                    this.arrowOver1.bindAsEventListener(this));
        Event.observe(this.arrowClickBoxen[0],
                                    'mouseout',
                                    this.arrowOut1.bindAsEventListener(this));

        Event.observe(this.arrowClickBoxen[1],
                                    'click',
                                    this.arrow2click.bindAsEventListener(this));
        Event.observe(this.arrowClickBoxen[1],
                                    'mouseover',
                                    this.arrowOver2.bindAsEventListener(this));
        Event.observe(this.arrowClickBoxen[1],
                                    'mouseout',
                                    this.arrowOut2.bindAsEventListener(this));

        Event.observe(this.label,'keyup', this.layoutLabel.bind(this));

        this.pos1listener = this.updatePosition1.bind(this);
        this.pos2listener = this.updatePosition2.bind(this);
        this.startListener = this.startChange.bind(this);
        this.endListener = this.endChange.bind(this);

        this.part1ContainedObject.addMoveListener(this.pos1listener);
        this.part1ContainedObject.addSizeListener(this.pos1listener);
        this.part2ContainedObject.addMoveListener(this.pos2listener);
        this.part2ContainedObject.addSizeListener(this.pos2listener);
        this.part1ContainedObject.addStartChangeListener(this.startListener);
        this.part2ContainedObject.addStartChangeListener(this.startListener);
        this.part1ContainedObject.addEndChangeListener(this.endListener);
        this.part2ContainedObject.addEndChangeListener(this.endListener);

    },

    showLabel: function(){
        Element.show(this.label);
        this.label.style.border='1px solid black';
    },

    labelOut: function(){
        if(!this.isSelected()){
            this.label.style.border='1px solid white';
            if(!this.label.value){
                Element.hide(this.label);
            }
        }
    },

    labelBlur: function(){
        this.label.style.border='1px solid white';
        if(!this.label.value){
            Element.hide(this.label);
        }
        this.recordLabel();
    },

    updateMiddle: function (){
        if(this.intersect1 == null || this.intersect2 == null){
            return; // XXX this is a hack - we need to figure out what's causing this
        }
        var midx=Math.min(this.intersect1.x,this.intersect2.x)
                    +Math.abs(this.intersect2.x-this.intersect1.x)/2;
        var midy=Math.min(this.intersect1.y,this.intersect2.y)
                    +Math.abs(this.intersect2.y-this.intersect1.y)/2;
        var offsetLeft;
        var offsetTop;
        var offsetWidth;
        var offsetHeight;
        if(this.part1ContainedObject.x() < this.part2ContainedObject.x()){
            offsetLeft = this.part1ContainedObject.x();
            offsetWidth = this.part1ContainedObject.currentWidth();
        } else {
            offsetLeft = this.part2ContainedObject.x();
            offsetWidth = this.part2ContainedObject.currentWidth();
        }
        if(this.part1ContainedObject.y() < this.part2ContainedObject.y()){
            offsetTop = this.part1ContainedObject.y();
            offsetHeight = this.part1ContainedObject.currentHeight();
        } else {
            offsetTop = this.part2ContainedObject.y();
            offsetHeight = this.part2ContainedObject.currentHeight();
        }
        midx = midx - offsetLeft - offsetWidth/2;
        midy = midy - offsetTop - offsetHeight/2;
        this.midx = (midx * this.htmlElement.parentNode.clientWidth)/100;
        this.midy = (midy * this.htmlElement.parentNode.clientHeight)/100;
    },

    // checks to see if we're roughly in the middle of the relationship.  If we are, show the relationship label
    mouseMove: function(e){
        var offset = Position.cumulativeOffset(this.line.img);
        var x = Event.pointerX(e) - offset[0];
        var y = Event.pointerY(e) - offset[1];
        if( x > (this.midx - 20) &&
            x < (this.midx + 20) &&
            y > (this.midy - 20) &&
            y < (this.midy + 20) ){

            // yay, we're in the middle
            this.showLabel();
        } else {
            this.labelOut();
        }
    },

    removeButtonClick: function(e){
        this.destroy();
    },

    arrow1click: function(e){
        if(this.nav() == 'fromleft'){
            this.nav('non');
        } else if(this.nav() == 'non'){
            this.nav('fromleft');
        } else if(this.nav() == 'fromright'){
            this.nav('bi');
        } else if(this.nav() == 'bi'){
            this.nav('fromright');
        }
        this.updateArrows();
        this.update();
    },

    arrow2click: function(e){
        if(this.nav() == 'fromright'){
            this.nav('non');
        } else if(this.nav() == 'non'){
            this.nav('fromright');
        } else if(this.nav() == 'fromleft'){
            this.nav('bi');
        } else if(this.nav() == 'bi'){
            this.nav('fromleft');
        }
        this.updateArrows();
        this.update();
    },

    arrowOver1: function(e){
        this.over1 = true;
        this.updateArrows();
    },

    arrowOut1: function(e){
        this.over1 = false;
        this.updateArrows();
    },

    arrowOver2: function(e){
        this.over2 = true;
        this.updateArrows();
    },

    arrowOut2: function(e){
        this.over2 = false;
        this.updateArrows();
    },

    recordLabel: function(){
        this.type(this.label.value);
        this.update();
    },

    startChange: function(vkernel) {
        //hide arrows and label
        this.labelDiv.style.display='none';
        this.arrowCanvasElements[0].style.display='none';
        this.arrowCanvasElements[1].style.display='none';
    },

    endChange: function(vkernel) {
        this.updatePosition1();
        this.updatePosition2();

        this.labelDiv.style.display='inline';
        this.updateArrows();
        this.updateMiddle();
        this.arrowCanvasElements[0].style.display='block';
        this.arrowCanvasElements[1].style.display='block';
    },

    selectAndTerminate: function(e) {
        dndMgr.updateSelection(this,false);
        this.label.focus();
        Utils.terminateEvent(e);
    },

    // Select this relationship
    select: function () {
        this.showLabel();
        if( !this.isSelected() ){
          Element.removeClassName(this.htmlElement, 'relationship-notselected');
          Element.addClassName(this.htmlElement, 'relationship-selected');
        }
    },

    // Mark this relationship as not selected
    deselect: function () {
        if( this.isSelected()){
            Element.removeClassName(this.htmlElement, 'relationship-selected');
            Element.addClassName(this.htmlElement, 'relationship-notselected');
        }
    },

    // Returns whether or not this relationship is currently selected
    isSelected: function () {
        return Element.hasClassName(this.htmlElement, 'relationship-selected');
    },

    removeFromView: function () {
        if(this.htmlElement.parentNode){
            this.htmlElement.parentNode.removeChild(this.htmlElement);
        }
        this.line.destroy();
        this.part1ContainedObject.removeMoveListener(this.pos1listener);
        this.part1ContainedObject.removeSizeListener(this.pos1listener);
        this.part2ContainedObject.removeMoveListener(this.pos2listener);
        this.part2ContainedObject.removeSizeListener(this.pos2listener);
        this.part1ContainedObject.removeStartChangeListener(this.startListener);
        this.part2ContainedObject.removeStartChangeListener(this.startListener);
        this.part1ContainedObject.removeEndChangeListener(this.endListener);
        this.part2ContainedObject.removeEndChangeListener(this.endListener);
    },

    uncache: function () {
        // remove it from both object caches
        this.part1ContainedObject.uncacheRelationship(this);
        this.part2ContainedObject.uncacheRelationship(this);
    },

    destroy: function () {
        this.removeFromView();
        this.uncache();
        return JSDBI.prototype.destroy.call(this);
    }
});

var Rectangle = Class.create();
Rectangle.prototype = {
    initialize: function(x,y,w,h){
        this.x=Number(x);
        this.y=Number(y);
        this.w=Number(w);
        this.h=Number(h);
    },

    getCenter: function (){
        return {x: this.x+this.w/2,
                y: this.y+this.h/2};
    },

    // line should be of the form [{x:0,y:0},{x:10,y:10}]
    // returns intersect point of the form {x: 2, y:4}
    getLineIntersect: function(line) {
        // deal with perfectly vertical lines
        if(line[0].x == line[1].x){
            var side = this.y;
            var lineMinY = Math.min(line[0].y,line[1].y);
            var lineMaxY = Math.max(line[0].y,line[1].y);
            if(lineMinY < side
               && lineMaxY >= side){
                return {x: line[0].x, y: side};
            }
            side = this.y+this.h;
            if(lineMinY <= side
               && lineMaxY >= side){
                return {x: line[0].x, y: side};
            }
            return undefined; // no intersection
        }

        // figure out equation for line y=ax+b
        var a = (line[1].y - line[0].y)/(line[1].x - line[0].x);
        var b = line[0].y - a*line[0].x;

        var lineMinX = Math.min(line[0].x,line[1].x);
        var lineMaxX = Math.max(line[0].x,line[1].x);
        var lineMinY = Math.min(line[0].y,line[1].y);
        var lineMaxY = Math.max(line[0].y,line[1].y);

        // look at vertical sides first
        var side = this.x;
        var y = a*side+b;
        if(lineMinX <= side
           && lineMaxX >= side
           && y >= this.y && y <= (this.y + this.h)){
            // line intersects left side
            var intersect = {x: side, y: y};
            return intersect;
        }

        side = this.x+this.w;
        y = a*(side)+b;
        if(lineMinX <= side
           && lineMaxX >= side
           && y >= this.y && y <= (this.y + this.h)){
            // line intersects right side
            var intersect = {x: side, y: y};
            return intersect;
        }

        // look at the horizontal sides
        side=this.y;
        var x=(side-b)/a;
        if(lineMinY <= side
           && lineMaxY >= side
           && x >= this.x && x <= (this.x + this.w)){
            // line intersects top
            var intersect = {x: x, y: this.y};
            return intersect;
        }
        side=this.y+this.h;
        var x=(side-b)/a;
        if(lineMinY <= side
           && lineMaxY >= side
           && x >= this.x && x <= (this.x + this.w)){
            // line intersects bottom
            var intersect = {x: x, y: side};
            return intersect;
        }
        return undefined;
    }
};

