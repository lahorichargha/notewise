var Kernel = Class.create();
Kernel.extend(JSDBI);
Kernel.prototype = (new JSDBI()).extend( {

});
Kernel.fields(['id', 'name', 'uri', 'object_url', 'source', 'created',
               'lastModified', 'lastViewed', 'has_children']);
Kernel.url('rest/kernel');
Kernel.has_many('children', 'VisibleKernelModel', 'container_object',
                '/rest/kernel/$/children');
Kernel.has_many('visible_relationships', 'Relationship', 'container_object',
                '/rest/kernel/$/visible_relationships');
Kernel.has_many('notes', 'Note', 'object_id', '/rest/kernel/$/notes');
