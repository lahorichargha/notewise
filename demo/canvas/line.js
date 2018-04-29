function myLine(node1, node2){
    this.node1 = node1;
    this.node2 = node2;
    this.canvas = document.createElement('canvas');
    this.canvas.id="line";
    this.canvas.style.top="0px";
    this.canvas.style.left="0px";
    this.canvas.width="1000";
    this.canvas.height="1000";
    this.canvas.style.border="1px solid black";
    document.body.appendChild(this.canvas);

    this.validate = function paint(){
         var x1 = node1.getX() + node1.getWidth()/2;
         var y1 = node1.getY() + node1.getHeight()/2;
         var x2 = node2.getX() + node2.getWidth()/2;
         var y2 = node2.getY() + node2.getHeight()/2;

         if(this.canvas.getContext("2d")){
             var ctx = this.canvas.getContext("2d");
             // clear where the line was before, plus a little slop on each
             // side to prevent spurious artifacts
             ctx.clearRect(this.prevx-2,this.prevy-2,this.prevw+5,this.prevh+5);
             ctx.beginPath();
             ctx.moveTo(x1,y1);
             ctx.lineTo(x2,y2);
             ctx.stroke();
         }
         if(x1<x2){
             this.prevx=x1;
             this.prevw=x2-x1;
         } else {
             this.prevx=x2;
             this.prevw=x1-x2;
         }
         if(y1<y2){
             this.prevy=y1;
             this.prevh=y2-y1;
         } else {
             this.prevy=y2;
             this.prevh=y1-y2;
         }
//         window.status = "drawing to "+x2+"x"+y2;
    }
}
