// ViewKernel is the class for the current view.  It is not directly resizable
// or draggable. (though it is usually contained within a browser window that
// is).

var ViewKernel = Class.create();
ViewKernel.prototype = new KernelObject();
ViewKernel.prototype.extend( {
    initialize: function(id, htmlElement) {
        this.__kernel_id = id;
        KernelObject.prototype.initialize.call(this,htmlElement);
        this.__kernel_id = id;
        window.onresize = this.layoutResize.bindAsEventListener(this);
        this.layoutNamefield();
    },

    // dummy method - this is used by resizeChildren.
    collapsed: function() {
        return false;
    },

    kernel: function() {
        if(!this.__kernel && this.__kernel_id){
            this.__kernel = Kernel.retrieve(this.__kernel_id.toString());
        }

        return this.__kernel;
    },

    fetchElements: function () {
        this.bodyElement = this.htmlElement;
        this.namefield = $('viewname');
    },

    registerHandlers: function() {
        KernelObject.prototype.registerHandlers.call(this);
        this.observe(this.namefield,'blur', this.updateName.bind(this));
    },

    updateName: function() {
        this.kernel().name(this.namefield.value);
        this.kernel().update();
    },

    layoutResize: function() {
        this.layoutNamefield();
        this.body.layoutChildren();
    },

    layoutNamefield: function() {
        this.namefield.style.width = (this.namefield.parentNode.clientWidth - 130) + 'px';
    },

    realize: function() {
        var children = this.kernel().children();
        for(var i=0;i<children.length; i++){
            var child = children[i];
            if (child.__elementTag == "visiblekernel") {
                var visible_kernel_controller = new VisibleKernelController();
                visible_kernel_controller.setModel(child);
                visible_kernel_controller.realize($('viewkernel'));
                visible_kernel_controller.newlyCreated(false);
                objectCache[child.idString()] = visible_kernel_controller;
            } else {
                child.realize($('viewkernel'));
                child.newlyCreated(false);
                objectCache[child.idString()] = child;
            }
        }

        var notes = this.kernel().notes();
        for(var i=0;i<notes.length; i++){
            var note = notes[i];
            objectCache[note.idString()] = note;
            note.realize($('viewkernel'));
        }

        var rels = this.kernel().visible_relationships();
        for(var i=0;i<rels.length; i++){
            var rel = rels[i];
            rel.realize(this.kernel().id());
        }

        this.body = new KernelBody(this.bodyElement, this.kernel());

        var kernel_id = this.kernel_id();
        window.setTimeout(function () {new Ajax.Updater('parents_content',
                         '/kernel/parentshtml/' + kernel_id,
                         {
                             evalScripts: 1,
                             method: 'get',
                             asynchronous: true
                         });},100);

    },

    destroy: function() {
        this.unregisterHandlers();
        this.kernel().destroy();
        window.history.back();
    },

    kernel_id: function() {
        return this.__kernel_id;
    }
});


// make this kernel into the current view (ie, switch the url to this kernel)
ViewKernel.makeView = function(kernel_id) {
    dhtmlHistory.add(''+kernel_id,{}); // TODO add in username or kernel title here
    ViewKernel.doMakeView(kernel_id);
};

// make this kernel into the current view (ie, switch the url to this kernel),
// but don't add it to the history.  Should only be called when we were
// notified of a change in history from the browser (ie, the user hit the back
// button).
ViewKernel.doMakeView = function(kernel_id){
    var date = new Date();
    time = date.getTime();
    // wipe existing view
    if(view){
        view.unregisterHandlers();
    }
    $('viewname').value = 'Loading...';
    $('parents_content').innerHTML = 'Loading...';
    $('viewkernel').innerHTML = '';
    window.setTimeout(function() {ViewKernel.finishMakeView(kernel_id)}, 10);
};

ViewKernel.finishMakeView = function(kernel_id){
    var date = new Date();
    // setup new view
    view = new ViewKernel(kernel_id, $('viewkernel'));
    view.realize();
    $('viewname').value = view.kernel().name();
    document.title = view.kernel().name() + " - Notewise.com";

    date = new Date();
    $('mysearchfield').focus();

    // Track action using analytics
    if (window.pageTracker) {
        if (user_type == 'tutorial_user') {
            pageTracker._trackPageview('/tracking/tutorial_user/kernel/view/' + view.kernel().name());
        } else {
            pageTracker._trackPageview('/tracking/' + (user_type || 'unknown_user_type') + '/kernel/view');
        }
    }
};

JSDBI.on_start_update = function () {
    Element.show($('saving_indicator'));
}

JSDBI.on_end_update = function () {
    new Effect.Fade($('saving_indicator'),{duration: 0.5});
}
