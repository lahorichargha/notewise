function getNode(id){
    if (window.XMLHttpRequest) {
        var url = 'http://home.scottyallen.com/know-web/canvas/ajax.cgi?id='+id;
        req = new XMLHttpRequest();
        req.open("GET", url, false);
        req.send(null);
        var response  = req.responseXML.documentElement;
        // parse the xml
        var id = response.attributes.getNamedItem("id").value;
        var name = response.attributes.getNamedItem("name").value;
        var x = response.attributes.getNamedItem("x").value;
        var y = response.attributes.getNamedItem("y").value;
        var w = response.attributes.getNamedItem("w").value;
        var h = response.attributes.getNamedItem("h").value;
        return new node(id,name,x,y,w,h);
    }
}

function node(id,name,x,y,w,h) {
    this.id=id;

    this.div = document.createElement('div');

    this.nameField = document.createElement('input');
    this.nameField.size = 4;
    this.nameField.className = "nameField";
    this.nameField.value = name;
    this.div.appendChild(this.nameField);

    this.contentArea = document.createElement('div');
    this.contentArea.className = "contentArea";
    this.div.appendChild(this.contentArea);

    this.div.className="box";
    this.div.id="node"+id;
    document.body.appendChild(this.div);

    //ADD_DHTML(this.div.id+CURSOR_MOVE+RESIZABLE);
    this.div.style.left=x+"px";
    this.div.style.top=y+"px";
    this.contentArea.style.width=w+"px";
    this.contentArea.style.height=h+"px";

    this.setX = function (x){
        return this.div.style.left=x;
    }

    this.setY = function (y){
        return this.div.style.top=y;
    }

    this.getX = function (){
        return this.div.offsetLeft;
    }

    this.getY = function (){
        return this.div.offsetTop;
    }

    this.getWidth = function (){
        return this.div.clientWidth;
    }

    this.getHeight = function (){
        return this.div.clientHeight;
    }



    this.revalidate = function (){
        this.contentArea.style.height=this.div.clientHeight - this.nameField.clientHeight;
//	window.status = 'height: ' + this.contentArea.style.height;
    }

    var mouseOffsetX;
    var mouseOffsetY;
    var inDrag=0;
    var myNode = this;
    this.contentArea.onmousedown = function(event){
        mouseOffsetX=event.clientX;//-myNode.div.style.left;
        mouseOffsetY=event.clientY;//-myNode.div.style.top;
        //window.status=mouseOffsetX;
        inDrag=1;
    }
    this.contentArea.onmouseup = function(event){
        inDrag=0;
    }
    this.contentArea.onmouseover = function(event){
        //window.status="mouse entered "+myNode.div.id;
    }

    this.contentArea.onmousemove = function(event){
        if(inDrag == 1){
            myNode.div.style.left=(event.clientX-50)+"px";
            myNode.div.style.top=(event.clientY-50)+"px";
            line.validate();
        }
//        window.status=myNode.div.style.left+"x"+myNode.div.style.top;
    }
}
