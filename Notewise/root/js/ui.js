function expandMenu(button, paneId) {
    var pane = $(paneId);
    var sandbox_container = $('sandbox_container');
    var sandbox = $('sandbox');
    
    var opts = {
        duration: 50,
        onComplete: function () {
            sandbox_container.style.height = "100%";
            sandbox.style.height = "100%"; 
        }
    }
    
//    if(pane.__expand == null) {
//        pane.__expand = new fx.Height(pane, opts);
//    }

//    pane.__expand.toggle();
    if(Element.hasClassName(pane,'open')) {
        Element.removeClassName(pane, 'open');
        Element.addClassName(pane, 'closed');
        Element.removeClassName(button, 'open');
        Element.addClassName(button, 'closed');
    } else {
        Element.removeClassName(pane, 'closed');
        Element.addClassName(pane, 'open');
        Element.removeClassName(button, 'closed');
        Element.addClassName(button, 'open');
    }
    
    window.setTimeout(function() {$('sidebar-bottom').style.height = "100%"; $('sandbox').style.height = "100%"; },100);
}
