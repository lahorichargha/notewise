// A visible kernel is a normal kernel on a view that's draggable and renameable.

var VisibleKernelController = Class.create();

// multiple inheritance from both JSDBI and Draggable
VisibleKernelController.prototype = {};
JSDBI.inherit(VisibleKernelController,new WiseObject());
JSDBI.inherit(VisibleKernelController,new KernelObject());

VisibleKernelController.prototype.extend({
    initialize: function(container_object, contained_object, htmlElement, 
                         x, y, width, height, collapsed) {
        this.type = 'vkernel';
        model = new VisibleKernelModel();
        model.container_object(container_object);
        model.contained_object(contained_object);
        model.x(x);
        model.y(y);
        model.width(width);
        model.height(height);
        model.collapsed(collapsed);
        // TODO(scotty): It's not quite clear why internalUrl is required in
        // the first place, or why we need to set it here.  This should be
        // removed.
        model.internalUrl(model.url());
        this.__model = model;
        this.superclass = VisibleKernelController.superclass;

        WiseObject.prototype.initialize.call(this);
        KernelObject.prototype.initialize.call(this, htmlElement);

        var func_names = [];

        // Note that destroy() is inherited from wiseobject, which calls
        // JSDBI.prototype.destroy.call(this).  Ewww....
        for (var i = 0; i < func_names.length; i++) {
            this.addProxyFunction(this, func_names[i]);
            this.addProxyFunction(this.superclass, func_names[i]);
        }
    },

    model: function() {
        return this.__model;
    },

    setModel: function(model) {
        this.__model = model;
    },

    x: function() {
        return this.model().x();
    },

    y: function() {
        return this.model().y();
    },

    width: function() {
        return this.model().width();
    },

    height: function() {
        return this.model().height();
    },

    id: function() {
        return this.model().id();
    },

    idString: function() {
        return this.model().idString();
    },

    internalUrl: function() {
        return this.model().internalUrl();
    },

    // TODO(scotty): This exposes a model directly to some other caller, which probably isn't good.
    container_object: function() {
        return this.model().container_object();
    },

    // TODO(scotty): This exposes a model directly to some other caller, which probably isn't good.
    contained_object: function() {
        return this.model().contained_object();
    },

    addProxyFunction: function(object, func_name) {
        object[func_name] = function(arg1, arg2, arg3) {
            return this.model()[func_name](arg1, arg2, arg3);
        }
    },

    setup: function () {
        KernelObject.prototype.setup.call(this);

        // Setup autocomplete on the namefield.  TODO figure out how to factor this up to kernelobject
        this.autocompleter = new Ajax.Autocompleter(this.namefield, this.searchresults, JSDBI.base_url()+'ac',
                                                    {frequency: .1,
                                                     min_chars: 2,
                                                     on_select: this.on_autocomplete_select.bind(this),
                                                     on_blur: this.onNamefieldBlur.bind(this),
                                                     before_complete: this.on_autocomplete_load.bind(this),
                                                     on_complete: this.on_autocomplete_complete.bind(this),
                                                     on_inactive_select: this.on_inactive_select.bind(this)});

        this.headerDivs = new Array(this.leftbackground,
                                    this.midleftbackground,
                                    this.midrightbackground,
                                    this.rightbackground);
    },

    on_inactive_select: function (autocompleter) {
        var url = base_url+"rest/kernel/find_or_create/"+encodeURIComponent(this.namefield.value);
        var new_kernel = new Kernel();
        var request = new Ajax.Request(url,
                                       { method: 'get',
                                         asynchronous: false } );
        new_kernel.__populate(request.transport.responseXML);
        this.newlyCreated(false);
        this.swap_kernels(new_kernel);
        dndMgr.clearSelection();
        dndMgr.giveSearchBoxFocus();
    },

    on_autocomplete_load: function (autocompleter,request) {
        match = request.responseText.match(/'(.*?)'</);
        if(match && match[1] == this.namefield.value){
            // show the results
            return 1;
        } else {
            // don't show the results - they're too old
            return 0;
        }
    },

    on_autocomplete_select: function (selected_element) {
        var id=selected_element.getElementsByTagName('a')[0].getAttribute('href');
        var results = id.match(/\/(\d+)/);
        if(results){
            id = results[1];
        }
        if(Number(id) == 0){
            this.newlyCreated(false);
            this.kernel().name(this.namefield.value);
            this.updateNamelinkText();
            this.kernel().update(this.updateNamelinkUrl.bind(this));
        } else {
            this.swap_kernels(Kernel.retrieve(id));
            this.newlyCreated(false);
        }
        
        dndMgr.clearSelection();
        dndMgr.giveSearchBoxFocus();
    },

    on_autocomplete_complete: function (autocompleter) {
        if(this.newlyCreated()){
            if(autocompleter.entry_count == 1){
                // if there were no actual search results, then "new..." should be
                // the default selection
                autocompleter.index = 0;
            } else {
                // The first actual search result should be selected
                autocompleter.index = 1;
            }
        } else {
            // we're doing rename, not new
            autocompleter.index = 0;
        }
    },

    swap_kernels: function (kernel) {
        var old_contained_object = this.contained_object();
        var old_id_string = this.idString();
        this.model().contained_object(kernel);
        this.namefield_object.setValue(kernel.name());
        this.layout();
        this.updateNamelink();
        this.model().update();
        objectCache[this.idString()]=this;
        window.setTimeout(this.after_swap_kernels.bindWithParams(this,old_contained_object,old_id_string),500);
    },

    // This contains all the things that can happen asynchronously after we
    // swap out the kernel, in an attempt to make the swap feel more snappy
    after_swap_kernels: function(old_contained_object,old_id_string){
        this.hydrateChildren();
        this.hydrateRelationships();
        delete objectCache[old_id_string];
        if(this.newlyCreated()){
            this.contained_object().destroy();
        }
    },

    newlyCreated: function(value) {
        if(value !== undefined){
            this.__newlyCreated = value;
            if(value === false){
                // change the url of the autocompleter to show the rename
                // results instead of autocomplete results.  This is kind of a
                // hack, but seems easier than trying to remove the first
                // autocompleter and install a second one.
                this.autocompleter.url = JSDBI.base_url()+'rename';
            }
        }
        return this.__newlyCreated;
    },

    // creates the actual html for this kernel
    // XXX this is a bunch of garbage - need to unify this html with the stuff in root/Kernel/kernel.tt.  Maybe think about shipping the html as part of the xml?  Or maybe a seperate ajax call?
    realize: function(parent) {
        this.htmlElement = document.createElement('div');
        this.htmlElement.className="vkernel vkernel-notselected vkernel-notedit vkernel-collapsed vkernel-nothighlighted vkernel-contains";
        var expandButtonLabel = this.collapsed() ? '+' : '-';
        var name;
        if(this.kernel().name() === undefined){
            name = '';
        } else {
            name = this.kernel().name();
        }
        var startClasses = new Array("collapsed","collapsed-nothighlighted-notcontains");
        var innerHTML =
           "<div class=\"expandbutton\"></div>"
           +"<a title='Remove kernel' class=\"removebutton\"></a>"
           +"<a title='Rename kernel' class=\"editbutton\"></a>"
           +"<div class='relationshiphalo'>"
               +"<div class='newrelationshiparrow'></div>"
               +"<div class='halo-top-left'></div>"
               +"<div class='halo-top'></div>"
               +"<div class='halo-top-right'></div>"
               +"<div class='halo-left'></div>"
               +"<div class='halo-right'></div>"
               +"<div class='halo-bottom-left'></div>"
               +"<div class='halo-bottom'></div>"
               +"<div class='halo-bottom-right'></div>"
           +"</div>"
           +"<div class='vkernel-leftbackground "+"vkernel-leftbackground-"+startClasses.join(" vkernel-leftbackground-")+"'></div>"
           +"<div class='vkernel-mid-leftbackground "+"vkernel-mid-leftbackground-"+startClasses.join(" vkernel-mid-leftbackground-")+"'></div>"
           +"<div class='vkernel-mid-rightbackground "+"vkernel-mid-rightbackground-"+startClasses.join(" vkernel-mid-rightbackground-")+"'></div>"
           +"<div class='vkernel-rightbackground "+"vkernel-rightbackground-"+startClasses.join(" vkernel-rightbackground-")+"'></div>"
           +"<input value=\"\" type=\"text\" class=\"namefield\" autocomplete=\"off\" name=\"s\" value=\""+name+"\"/>"
           +"<a class=\"namelink\" href=\""+this.kernel().object_url()+"\">"
           +name+"</a>"
           +"<div class=\"body\"></div>"
           +"<div class=\"corner\"></div>";
        
        this.htmlElement.innerHTML = innerHTML;
        WiseObject.prototype.realize.call(this,parent);

        this.body = new KernelBody(this.bodyElement, this.contained_object());

        this.namefield_object.setValue(this.kernel().name());
        this.layout();
        this.updateContains();

        // This is a horrible, horrible hack to get the kernel to show up as properly expanded.
        if (!this.model().collapsed() ||
            this.model().collapsed() == "0") {
            this.collapsed(0);
        }
        this.setFixedSize(this.collapsed());
    },

    // create html elements for the child objects
    hydrateChildren: function() {
        var url = JSDBI.base_url()+'kernel/innerhtml/'+this.kernel_id();
        new Ajax.Request(url, {onSuccess: this.insertChildren.bind(this), evalScripts: true});
    },

    insertChildren: function(t) {

        this.bodyElement.innerHTML = t.responseText;
        this.updateContains();

        var match    = new RegExp(Ajax.Updater.ScriptFragment, 'img');
        var scripts  = t.responseText.match(match);
        if(scripts){
            match = new RegExp(Ajax.Updater.ScriptFragment, 'im');

            setTimeout((function() {
                for (var i = 0; i < scripts.length; i++)
                    eval(scripts[i].match(match)[1]);
            }).bind(this), 10);
        }
    },

    kernel: function() {
        return this.contained_object();
    },

    kernel_id: function() {
        return this.model().__getField('contained_object');
    },

    // retrieves references to all the relevant html elements and stores them
    // as properties in this object
    fetchElements: function () {
        KernelObject.prototype.fetchElements.call(this);
        WiseObject.prototype.fetchElements.call(this);
        this.namelink = Utils.getElementsByClassName(this.htmlElement, 'namelink')[0];
        this.searchresults = document.getElementById('visiblekernelsearchresults');
        if(!this.searchresults){
            this.searchresults = document.createElement('div');
            this.searchresults.id = 'visiblekernelsearchresults';
            this.searchresults.className = 'searchresults';
            Element.hide(this.searchresults);
            var body=document.getElementsByTagName('body')[0];
            body.appendChild(this.searchresults);
        }
        this.expandbutton = Utils.getElementsByClassName(this.htmlElement, 'expandbutton')[0];
        this.editbutton = Utils.getElementsByClassName(this.htmlElement, 'editbutton')[0];
        this.leftbackground = Utils.getElementsByClassName(this.htmlElement, 'vkernel-leftbackground')[0];
        this.midleftbackground = Utils.getElementsByClassName(this.htmlElement, 'vkernel-mid-leftbackground')[0];
        this.midrightbackground = Utils.getElementsByClassName(this.htmlElement, 'vkernel-mid-rightbackground')[0];
        this.rightbackground = Utils.getElementsByClassName(this.htmlElement, 'vkernel-rightbackground')[0];
    },

    onNamefieldBlur: function(selected_element) {
        this.on_autocomplete_select(selected_element);
    },

    // setup all the event listeners
    registerHandlers: function() {
        KernelObject.prototype.registerHandlers.call(this);

        WiseObject.prototype.registerHandlers.call(this);

        // TODO(scotty): move this into realize()
        this.namefield_object = new ExpandingTextField(this.namefield);
        this.namefield_object.registerResizeListener(function() {
          this.setFixedSize(this.collapsed());
        }.bind(this));

        // TODO check to see if all these terminate event listeners are necessary

        // setup the click handlers
        Event.observe(this.namelink,'click', Utils.terminateEvent.bindAsEventListener(this));
        Event.observe(this.namelink,'mousedown', Utils.terminateEvent.bindAsEventListener(this));
        
        // setup the collapsed button
        Event.observe(this.expandbutton,
                                   'click',
                                   this.toggleCollapsed.bind(this));

        // setup the edit button
        Event.observe(this.editbutton,
                                   'click',
                                   this.edit.bindWithParams(this,true));

        // TODO DRY - consolidate these into a big list of element/event pairs
        // Setup action terminators
        // dragging on any of the buttons shouldn't drag the object
        Event.observe(this.expandbutton,
                                   'mousedown',
                                   Utils.terminateEvent.bindAsEventListener(this));

        // doubleclicking on any of the buttons shouldn't do anything
        Event.observe(this.expandbutton,
                                   'dblclick',
                                   Utils.terminateEvent.bindAsEventListener(this));

        Event.observe(this.editbutton,
                      'mouseover',function(){Element.addClassName(this.editbutton,'editbutton-hover')}.bind(this));
        Event.observe(this.editbutton,
                      'mouseout',function(){Element.removeClassName(this.editbutton,'editbutton-hover')}.bind(this));

        // Fix ff bug that causes cursor to disappear sometimes - see bug #273
        Event.observe(this.namefield,'blur', function() {
            this.namefield.style.display = "block";
            window.setTimeout(function(){this.namefield.style.display = "";}.bind(this),100);
        }.bind(this));

        var model = this.model();
        Event.observe(this.htmlElement,'dblclick', function (e) {
            e = e || window.event;
            Utils.terminateEvent(e);
            Utils.preventDefault(e);
            ViewKernel.makeView(model.kernel_id());
        });
    },

    // Select this object and terminate the event
    selectAndTerminate: function(e) {
        WiseObject.prototype.selectAndTerminate.call(this);
        this.namefield.focus();
    },

    // performs internal visual layout of the html elements for this kernel
    layout: function(){
        WiseObject.prototype.layout.call(this);
    },

    // causes the internal elements to resize if necessary
    layoutResize: function() {
        WiseObject.prototype.layoutResize.call(this);
        if(this.htmlElement){
            this.midleftbackground.style.width = (this.htmlElement.clientWidth -
                                                 this.leftbackground.clientWidth -
                                                 this.rightbackground.clientWidth -
                                                 this.midrightbackground.clientWidth + 1) + 'px';
//            this.resizeChildren();
        }
    },

    // Toggles whether the kernel is fixed width or not, and updates the width if it is.
    // Accepts:
    //   fixed - a boolean indicating whether the kernel should be fixed width
    setFixedSize: function(fixed){
        width = this.namefield_object.getWidth() + 50;
        if(fixed){
            this.htmlElement.style.width = width+'px';
            this.htmlElement.style.height = '';
        } else {
            this.htmlElement.style.width = this.width() + '%';
            this.htmlElement.style.height = this.height() + '%';
        }

        this.layoutResize();
    },

    // Toggles whether the kernel is collapsed or not
    toggleCollapsed: function() {
        if(this.collapsed()){
            this.collapsed(false);
        } else {
            this.collapsed(true);
        }
        this.model().update();
    },

    // Just sets the internal collapsed value but don't change the display
    setCollapsed: function(collapsed) {
        return VisibleKernelController.superclass.collapsed.call(this, collapsed);
    },

    // Set whether the kernel is collapsed
    // TODO(scotty): there are a ton of calls to this.  Maybe split this into an isCollapsed() call to avoid confusion.
    collapsed: function(collapsed) {
        var results;
        if(collapsed == undefined) {
            // skip it
            var result = this.model().collapsed();
            return result;
        } else if (collapsed && collapsed != "0") {
            results = this.model().collapsed(1);
            if(this.htmlElement){
                this.changeClass('collapsed');
                this.setFixedSize(true);
                dndMgr.moveToFront(this.htmlElement);
            }
            this.notifyEndChangeListeners();
        } else {
            results = this.model().collapsed(0);
            if(this.htmlElement){
                this.changeClass('expanded');
                this.setFixedSize(false);
                dndMgr.moveToFront(this.htmlElement);

                var vkernels = Utils.getElementsByClassName(this.bodyElement,'vkernel');
                var notes = Utils.getElementsByClassName(this.bodyElement,'note');
                if(this.kernel().has_children() &&
                   vkernels.length == 0 && notes.length == 0){        
                    this.hydrateChildren();
                }
            }
            this.notifyEndChangeListeners();
        }
        this.layoutResize();
        return results;
    },

    getMinHeight: function() {
        return 100;
    },

    getMinWidth: function() {
        var nameFieldWidth =  this.namefield_object.getWidth() + 50;
        return Math.max(nameFieldWidth,100);
    },

    edit: function(edit) {
        if(edit){
            this.changeClass('edit');
            this.namefield.focus();
        } else {
            this.changeClass('notedit');
        }
    },

    // Select this object
    select: function () {
        // make sure the newrelationshiparrow is hidden to start with
        Element.hide(this.newrelationshiparrow);
        if( !this.isSelected() ){
            this.changeClass('selected');
        }
        dndMgr.moveToFront(this.htmlElement);
    },

    // Mark this object as not selected
    deselect: function () {
        if( this.isSelected()){
            this.changeClass('notselected');
        }
        this.edit(false);
    },
});

