
    update: function(){
        var w = Math.abs(this.x1-this.x2);
        var h = Math.abs(this.y2-this.y1);
        var x = Math.min(this.x1,this.x2);
        var y = Math.min(this.y1,this.y2);
        var direction;
        if( (this.x2 > this.x1 && this.y2 < this.y1)
            || (this.x2 < this.x1 && this.y2 > this.y1) ){
            direction = 'l';
        } else {
            direction = 'r';
        }
        var imageName;
        if(x>y){
        
            if(y<5){
                h=1;
                y = (this.y1+this.y2)/2;
                imageName='l5x1.png';
            
            } else if(y<6){
                imageName=direction+'10x5.png';
            
            } else if(y<7){
                imageName=direction+'12x6.png';
            
            } else if(y<9){
                imageName=direction+'14x7.png';
            
            } else if(y<11){
                imageName=direction+'18x9.png';
            
            } else if(y<14){
                imageName=direction+'22x11.png';
            
            } else if(y<18){
                imageName=direction+'28x14.png';
            
            } else if(y<23){
                imageName=direction+'36x18.png';
            
            } else if(y<29){
                imageName=direction+'46x23.png';
            
            } else if(y<37){
                imageName=direction+'58x29.png';
            
            } else if(y<48){
                imageName=direction+'74x37.png';
            
            } else if(y<62){
                imageName=direction+'96x48.png';
            
            } else if(y<80){
                imageName=direction+'124x62.png';
            
            } else if(y<104){
                imageName=direction+'160x80.png';
            
            } else if(y<135){
                imageName=direction+'208x104.png';
            
            } else if(y<175){
                imageName=direction+'270x135.png';
            
            } else if(y<227){
                imageName=direction+'350x175.png';
            
            } else if(y<295){
                imageName=direction+'454x227.png';
            
            } else if(y<383){
                imageName=direction+'590x295.png';
            
            } else if(y<497){
                imageName=direction+'766x383.png';
            
            } else if(y<646){
                imageName=direction+'994x497.png';
            
            } else {
                imageName=direction+'1292x646.png';
            }
        } else {
        
            if(x<5){
                w=1;
                x = (this.x1+this.x2)/2;
                imageName='l1x5.png';
            
            } else if(x<6){
                imageName=direction+'5x10.png';
            
            } else if(x<7){
                imageName=direction+'6x12.png';
            
            } else if(x<9){
                imageName=direction+'7x14.png';
            
            } else if(x<11){
                imageName=direction+'9x18.png';
            
            } else if(x<14){
                imageName=direction+'11x22.png';
            
            } else if(x<18){
                imageName=direction+'14x28.png';
            
            } else if(x<23){
                imageName=direction+'18x36.png';
            
            } else if(x<29){
                imageName=direction+'23x46.png';
            
            } else if(x<37){
                imageName=direction+'29x58.png';
            
            } else if(x<48){
                imageName=direction+'37x74.png';
            
            } else if(x<62){
                imageName=direction+'48x96.png';
            
            } else if(x<80){
                imageName=direction+'62x124.png';
            
            } else if(x<104){
                imageName=direction+'80x160.png';
            
            } else if(x<135){
                imageName=direction+'104x208.png';
            
            } else if(x<175){
                imageName=direction+'135x270.png';
            
            } else if(x<227){
                imageName=direction+'175x350.png';
            
            } else if(x<295){
                imageName=direction+'227x454.png';
            
            } else if(x<383){
                imageName=direction+'295x590.png';
            
            } else if(x<497){
                imageName=direction+'383x766.png';
            
            } else if(x<646){
                imageName=direction+'497x994.png';
            
            } else {
                imageName=direction+'646x1292.png';
            }
        }
        this.img.src = LineDraw.Line.images[imageName];
        this.img.style.left=x+"px";
        this.img.style.top=y+"px";
        this.img.style.width=w+"px";
        this.img.style.height=h+"px";
        window.status = this.img.src + ' height: '+this.img.style.height + ' width: '+this.img.style.width;
     }
