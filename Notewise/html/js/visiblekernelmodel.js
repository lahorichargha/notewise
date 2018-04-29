// A visible kernel is a normal kernel on a view that's draggable and renameable.

var VisibleKernelModel = Class.create();
VisibleKernelModel.extend(JSDBI);

// multiple inheritance from both JSDBI and Draggable
VisibleKernelModel.prototype = {};
JSDBI.inherit(VisibleKernelModel,new JSDBI());

// Setup the JSDBI data access
VisibleKernelModel.fields(['container_object',
                           'contained_object',
                           'collapsed',
                           'height',
                           'width',
                           'x',
                           'y']);
VisibleKernelModel.primaryKeys(['container_object', 'contained_object']);
VisibleKernelModel.url('rest/vkernel');
VisibleKernelModel.elementTag('visiblekernel');
VisibleKernelModel.has_a('contained_object','Kernel');
VisibleKernelModel.has_a('container_object','Kernel');


VisibleKernelModel.prototype.extend({
    // returns the id in the form '1/2' where the first number is the
    // container_id and the second number is the contained_id
    idString: function() {
        var id = this.id().join('/');
        return id;
    },

    kernel_id: function() {
        return this.__getField('contained_object');
    }
});
