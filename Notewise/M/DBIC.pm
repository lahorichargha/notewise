package Notewise::SchemaLoader::DBIC;

use strict;
use base qw/DBIx::Class::Schema/;

__PACKAGE__->load_classes(qw/ContainedObject Kernel Note ObjectId Relationship RelationshipType User UserType/);

sub to_xml {
    my $self = shift;
    my $label = shift;
    if ($label){
        return XMLout({$label => $self->to_xml_hash_deep},KeepRoot=>1);
    } else {
        return XMLout($self->to_xml_hash_deep,KeepRoot=>1);
    }
}

sub strf_format : ResultSet {
    return '%Y-%m-%d %H:%M:%S';
}

1;
