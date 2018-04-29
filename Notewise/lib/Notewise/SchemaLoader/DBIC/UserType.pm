package Notewise::SchemaLoader::DBIC::UserType;

use base qw/DBIx::Class/;

__PACKAGE__->load_components(qw/ResultSetManager Core/);
__PACKAGE__->table('user_type');
__PACKAGE__->add_columns(qw/id name description/);
__PACKAGE__->set_primary_key('id');

1;
