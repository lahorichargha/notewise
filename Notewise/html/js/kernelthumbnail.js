// A visible kernel is a normal kernel on a view that's draggable and renameable.

var KernelThumbnail = function(id, htmlElement) {
    this.htmlElement = htmlElement;
    this.fetchElements();
    this.registerHandlers();

    this.model = Kernel.retrieve(id);
    this.body = new KernelBody(this.bodyElement);
};

KernelThumbnail.prototype.fetchElements = function () {
    this.bodyElement = Utils.getElementsByClassName(this.htmlElement,
                                                    'body')[0];
    this.namelinkElement = Utils.getElementsByClassName(this.htmlElement,
                                                        'namelink')[0];
};

KernelThumbnail.prototype.registerHandlers = function() {
    var thumbnail = this;
    Event.observe(this.htmlElement,'dblclick', function (e) {
        e = e || window.event;
        Utils.terminateEvent(e);
        Utils.preventDefault(e);
        ViewKernel.makeView(thumbnail.model.id());
    });
},

    // Rico draggable stuff

    // Select this object and terminate the event
KernelThumbnail.prototype.selectAndTerminate = function(e) {
    dndMgr.clearSelection();
    dndMgr.updateSelection(this,false);
    Utils.terminateEvent(e)
};

    // Returns whether or not this object is currently selected
KernelThumbnail.prototype.isSelected = function() {
    return Element.hasClassName(this.htmlElement,'selected');
};

    // Select this object
KernelThumbnail.prototype.select = function() {
    if( !this.isSelected() ){
        Element.removeClassName(this.htmlElement,'notselected');
        Element.addClassName(this.htmlElement,'selected');
    }
};

    // Mark this object as not selected
KernelThumbnail.prototype.deselect = function() {
    if( this.isSelected()){
        Element.removeClassName(this.htmlElement,'selected');
        Element.addClassName(this.htmlElement,'notselected');
    }
};
