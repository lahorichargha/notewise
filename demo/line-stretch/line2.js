function myLine(node1, node2){
    this.node1 = node1;
    this.node2 = node2;
    this.img = document.createElement('img');
    this.img.id="line";
    this.img.className="newline";
    this.img.src="line.png";
    this.img.style.position="absolute";
    document.body.appendChild(this.img);

    this.validate = function validate(){
                     var x1 = node1.getX() + node1.getWidth()/2;
                     var y1 = node1.getY() + node1.getHeight()/2;
                     var x2 = node2.getX() + node2.getWidth()/2;
                     var y2 = node2.getY() + node2.getHeight()/2;

                     var w = Math.abs(x1-x2);
                     var h = Math.abs(y2-y1);
                     var x;
                     var y;
                     if(x2<x1){
                         x = x2;
                     } else {
                         x = x1;
                     }
                     if(y2<y1){
                         y = y2;
                     } else {
                         y = y1;
                     }

                     var ratio = w/h;
                     if(ratio < 2.5){
                         this.img.src="line.png";
                     } else if(ratio < 6){
                         this.img.src="line3.png";
                     } else if(ratio < 15){
                         this.img.src="line2.png";
                     } else if(ratio < 60){
                         this.img.src="line4.png";
                     } else {
                         this.img.src="horizline.png";
                         h=1;
                         y = (y1+y2)/2;
                     }
                     this.img.style.left=x+"px";
                     this.img.style.top=y+"px";
                     this.img.style.width=w+"px";
                     this.img.style.height=h+"px";
                     window.status = "ratio: "+ratio+" width: "+w+" height: "+h;
                 }
}

