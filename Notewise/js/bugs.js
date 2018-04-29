var Bugs = {};
Bugs.show_window = function(location){
    var iframe = document.createElement('iframe');
    iframe.id = location;
    iframe.className = 'popover';
    iframe.src = location;
    var body=document.getElementsByTagName('body')[0];
    body.appendChild(iframe);
};

Bugs.close_window = function() {
    var iframe = parent.document.getElementsByClassName('popover')[0];
    if(iframe){
        iframe.parentNode.removeChild(iframe);
    }
};
