new Ajax.Autocompleter('mysearchfield', 'mysearchresults', '/s',
                        {frequency: .2,
                         min_chars: 2,
                         indicator: 'searchindicator',
                         on_select: function (selected_element){
                            value = Element.collectTextNodesIgnoreClass(selected_element, 'informal').unescapeHTML();
                            var link=selected_element.getElementsByTagName('a')[0];
                            var matches=link.href.match(/^http:\/\/.*\/(\d+)$/);
                            if(matches && matches[1] == 0){
                                name = $('mysearchfield').value;
                                new_view(name);
                            } else if(matches){
                                ViewKernel.makeView(matches[1]);
                            } else {
                                window.location=link.href;
                            }
                            $('mysearchfield').value = '';
                         },
                         on_complete: function(autocompleter){
                            if(autocompleter.entry_count == 1){
                                // if there were no actual search results, then "new..." should be
                                // the default selection
                                autocompleter.index = 0;
                            } else {
                                // The first actual search result should be selected
                                autocompleter.index = 1;
                            }
                         },
                         before_complete: function (autocompleter,request) {
                             match = request.responseText.match(/>new '(.*?)'</);
                             if(match && match[1] == $('mysearchfield').value){
                                 // show the results
                                 return 1;
                             } else {
                                 // don't show the results - they're too old
                                 return 0;
                             }
                         },

                         on_inactive_select: function (autocompleter) {
                            window.location=base_url+'search/find_or_create/'+$('mysearchfield').value;
                         }
});
$('mysearchfield').focus();

function new_view(kernel_name){
    var kernel;
    if(kernel_name){
        kernel = Kernel.insert({name: kernel_name});
    } else {
        kernel = Kernel.insert({});
    }
    ViewKernel.makeView(kernel.id());
    if(!kernel_name){
        window.setTimeout(function(){$('viewname').focus();},500);
    }
}
