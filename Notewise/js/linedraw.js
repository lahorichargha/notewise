var LineDraw = {};
LineDraw.Line = Class.create();

LineDraw.Line.prototype = {
    
    // Accepts the two endpoints of the line, and the parent element that this line should be added to (and be relative to).  Positioning will be done absolutely based on the parent.
    initialize: function(parent, x1, y1, x2, y2){
         this.x1 = x1;
         this.y1 = y1;
         this.x2 = x2;
         this.y2 = y2;
         this.img = document.createElement('img');
         this.img.style.position = 'absolute';
         this.parent = parent;
         parent.appendChild(this.img);
         this.update();
    },

    setP1: function (x1,y1){
        this.x1 = x1;
        this.y1 = y1;
        this.update();
    },

    setP2: function (x2,y2){
        this.x2 = x2;
        this.y2 = y2;
        this.update();
    },

    setX1: function (x){
        this.x1 = x;
        this.update();
    },

    setY1: function (y){
        this.y1 = y;
        this.update();
    },

    setX2: function (x){
        this.x2 = x;
        this.update();
    },

    setY2: function (y){
        this.y2 = y;
        this.update();
    },

    // removes the image from the html document
    destroy: function() {
        if(this.img != undefined){
            this.img.parentNode.removeChild(this.img);
            this.img=undefined;
        }
    },

    splitCoord: function(coord) {
        var regex=/([\d\.]+)\s*([a-z\%]+)/i;
        var results = regex.exec(coord);
        if(results !== null){
            return {value: Number(results[1]), units: results[2]};
        } else {
            return null;
        }
    },

    // direction should be 'x' or 'y'
    percentToPx: function(percentage, direction){
        var parentDimension;
        if(direction == 'x'){
            parentDimension = this.parent.clientWidth;
        } else {
            parentDimension = this.parent.clientHeight;
        }
        return parentDimension*percentage/100;
    },

    toPx: function(coord, direction){
        var splitCoord = this.splitCoord(coord);
        if(splitCoord !== null){
            if(splitCoord.units == '%'){
                return this.percentToPx(splitCoord.value,direction);
            } else {
                return splitCoord.value;
            }
        } else {
            return null;
        }
    }, 

    update: function(){
        var x1Px = this.toPx(this.x1,'x');
        var x2Px = this.toPx(this.x2,'x');
        var y1Px = this.toPx(this.y1,'y');
        var y2Px = this.toPx(this.y2,'y');
        
        if(x1Px === null || x2Px === null || y1Px === null || y2Px === null){
            return;
        }

//        window.status = "x1Px: "+x1Px+" x2Px: "+x2Px+" y1Px: "+y1Px+" y2Px: "+y2Px;

        var wPx = Math.abs(x1Px - x2Px);
        var hPx = Math.abs(y1Px - y2Px);

        var x1Coord = this.splitCoord(this.x1);
        var x2Coord = this.splitCoord(this.x2);
        var y1Coord = this.splitCoord(this.y1);
        var y2Coord = this.splitCoord(this.y2);

        var w = Math.abs(x1Coord.value - x2Coord.value)+x1Coord.units;
        var h = Math.abs(y1Coord.value - y2Coord.value)+y1Coord.units;
        var x = Math.min(x1Coord.value, x2Coord.value)+x1Coord.units;
        var y = Math.min(y1Coord.value, y2Coord.value)+y1Coord.units;

        var direction;
        if( (x2Coord.value > x1Coord.value && y2Coord.value < y1Coord.value)
            || (x2Coord.value < x1Coord.value && y2Coord.value > y1Coord.value) ){
            direction = 'l';
        } else {
            direction = 'r';
        }
        var imageName;
        var smallerDim = Math.min(wPx,hPx);
        if(smallerDim<5){
            if(wPx < hPx) {
                w='1px';
                x = ((x1Coord.value+x2Coord.value)/2) + x1Coord.units;
                imageName='l1x5.png';
            } else {
                h='1px';
                y = ((y1Coord.value+y2Coord.value)/2) + x1Coord.units;
                imageName='l5x1.png';
            }
        } else if(smallerDim<14){ imageName=direction+'11x11.png';
        } else if(smallerDim<18){ imageName=direction+'14x14.png';
        } else if(smallerDim<23){ imageName=direction+'18x18.png';
        } else if(smallerDim<29){ imageName=direction+'23x23.png';
        } else if(smallerDim<37){ imageName=direction+'29x29.png';
        } else if(smallerDim<48){ imageName=direction+'37x37.png';
        } else if(smallerDim<62){ imageName=direction+'48x48.png';
        } else if(smallerDim<80){ imageName=direction+'62x62.png';
        } else if(smallerDim<104){ imageName=direction+'80x80.png';
        } else if(smallerDim<135){ imageName=direction+'104x104.png';
        } else if(smallerDim<175){ imageName=direction+'135x135.png';
        } else if(smallerDim<227){ imageName=direction+'175x175.png';
        } else if(smallerDim<295){ imageName=direction+'227x227.png';
        } else if(smallerDim<383){ imageName=direction+'295x295.png';
        } else if(smallerDim<497){ imageName=direction+'383x383.png';
        } else if(smallerDim<646){ imageName=direction+'497x497.png';
        } else { imageName=direction+'646x646.png'; }
        this.img.src = "/images/"+imageName;
        this.img.style.left=x;
        this.img.style.top=y;
        this.img.style.width=w;
        this.img.style.height=h;
     }
}


// precache images

var dims = [
    [11,11],
    [14,14],
    [18,18],
    [23,23],
    [29,29],
    [37,37],
    [48,48],
    [62,62],
    [80,80],
    [104,104],
    [135,135],
    [175,175],
    [227,227],
    [295,295],
    [383,383],
    [497,497],
    [646,646]
];

var image_cache=[];

function precache(imageName){
    var i = image_cache.length;
    image_cache[i] = new Image();
    image_cache[i].src="/images/"+imageName;
}

function do_image_precache() {
    for(var i=0; i<dims.length; i++){
        var directions = ['r','l'];
        for(var j=0; j<2; j++){
            var direction = directions[j];
            precache(direction+dims[i][0]+'x'+dims[i][1]+'.png');
            precache(direction+dims[i][1]+'x'+dims[i][0]+'.png');
        }
    }
    precache('l1x5.png');
    precache('l5x1.png');
}
