var CustomDraggable = Class.create();

CustomDraggable.prototype = (new Rico.Draggable()).extend( {

   initialize: function( htmlElement, name ) {
      this.type        = 'Custom';
      this.htmlElement = $(htmlElement);
      this.name        = name;
   },

   startDrag: function() {
   },

   endDrag: function() {
   },

   cancelDrag: function() {
   },

   select: function() {
   }

} );

var CustomDropzone = Class.create();

CustomDropzone.prototype = (new Rico.Dropzone()).extend( {

   accept: function(draggableObjects) {
      n = draggableObjects.length;
      for ( var i = 0 ; i < n ; i++ )
         var el = draggableObjects[i].htmlElement;
         var dragObjectStyle = el.style;
         //dragObjectStyle.left = "200px";
         //dragObjectStyle.top  = "200px";
   },

   showHover: function() {
   },

   hideHover: function() {
   },

   activate: function() {
   },

   deactivate: function() {
   }
});
