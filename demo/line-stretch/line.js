function myLine(node1, node2){
    this.node1 = node1;
    this.node2 = node2;
    this.div = document.createElement('div');
    this.div.id="line";
    this.div.className="line";
    document.body.appendChild(this.div);
    this.canvas = new jsGraphics("line");

    this.paint = function paint(){
                     this.canvas.clear();
                     this.canvas.setColor("black");
                     this.canvas.setStroke(2);
                     var x1 = node1.getX() + node1.getWidth()/2;
                     var y1 = node1.getY() + node1.getHeight()/2;
                     var x2 = node2.getX() + node2.getWidth()/2;
                     var y2 = node2.getY() + node2.getHeight()/2;
                     this.canvas.drawLine(x1,y1,x2,y2);
                     this.canvas.paint();
                 }
}

