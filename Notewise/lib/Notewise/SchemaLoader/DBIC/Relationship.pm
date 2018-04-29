package Notewise::SchemaLoader::DBIC::Relationship;

use base qw/DBIx::Class/;
use strict;
use warnings;

__PACKAGE__->load_components(qw/+Notewise::UpdateFromForm ResultSetManager Core/);
__PACKAGE__->load_resultset_components(qw/+Notewise::CreateFromForm/);
__PACKAGE__->table('relationship');
__PACKAGE__->add_columns(qw/relationship_id part1 part2 nav type/);
__PACKAGE__->set_primary_key('relationship_id');
__PACKAGE__->belongs_to(relationship_id => 'Notewise::SchemaLoader::DBIC::ObjectId', undef, { proxy => ['user'] });
__PACKAGE__->belongs_to(part1 => 'Notewise::SchemaLoader::DBIC::ObjectId');
__PACKAGE__->belongs_to(part2 => 'Notewise::SchemaLoader::DBIC::ObjectId');
__PACKAGE__->belongs_to(type => 'Notewise::SchemaLoader::DBIC::RelationshipType');

sub new {
    my $class = shift;
    my ($params) = @_;

    my $user = delete $params->{user};

    my $self = $class->next::method( $params );

    $self->{_temp}->{user}=$user;
    return $self;
}

sub insert {
    my $self = shift;
    my ($params) = @_;

    my $user = $self->{_temp}->{user};
    my $user_id = ref $user ? $user->id : $user;
    my $relationship_id = $self->create_related('relationship_id',{type=>'relationship', user=>$user_id});
    $self->set_from_related(relationship_id => $relationship_id);

    my $result =  $self->next::method( $params );
    return $result;
}

sub update {
    my $self = shift;
    my $result =  $self->next::method( @_ );
    if(exists $self->{_inflated_column}{relationship_id}){
        $self->relationship_id->update();
    }
    return $result;
}

sub to_xml_hash {
    my $self = shift;
    return {
        id => $self->get_column('relationship_id'),
        part1 => $self->get_column('part1'),
        part2 => $self->get_column('part2'),
        type => $self->type->relationship_type,
        nav => $self->nav
    };
}

1;
