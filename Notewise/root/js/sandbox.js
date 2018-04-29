//TODO(scotty) Convert this to use KernelBody

var Sandbox = Class.create();

Sandbox.prototype = (new Dropzone()).extend( {

   initialize: function( htmlElement, id ) {
        this.type        = 'Sandbox';
        this.htmlElement = htmlElement;
        this.bodyElement = htmlElement;
        this.id          = id;
        dndMgr.registerDropZone( this );
   },

   accept: function(draggableObjects) {
       for(var i=0;i<draggableObjects.length;i++){
           if(draggableObjects[i].type != 'vkernel' && draggableObjects[i].type != 'note'){
               continue;
           }
           draggableObjects[i].reparent(this);
       }
   },

   // XXX showHover and hideHover are all broken, because rico dnd doesn't understand layers
   showHover: function() {
//        Element.addClassName(this.htmlElement,'activated');
   },

   hideHover: function() {
//        Element.removeClassName(this.htmlElement,'activated');
   },

   activate: function() {
   },

   deactivate: function() {
   },

   kernel_id: function() {
       return this.id;
   }
});
