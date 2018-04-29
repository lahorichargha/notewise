package Notewise::SchemaLoader::DBIC::RelationshipType;

use base qw/DBIx::Class/;

__PACKAGE__->load_components(qw/ResultSetManager PK::Auto::MySQL Core/);
__PACKAGE__->table('relationship_type');
__PACKAGE__->add_columns(qw/type_id relationship_type/);
__PACKAGE__->set_primary_key('type_id');

1;
