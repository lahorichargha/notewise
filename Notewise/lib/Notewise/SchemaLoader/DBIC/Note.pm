package Notewise::SchemaLoader::DBIC::Note;

use base qw/DBIx::Class/;

__PACKAGE__->load_components(qw/ResultSetManager Core +Notewise::UpdateFromForm/);
__PACKAGE__->table('note');
__PACKAGE__->add_columns(qw/container_object object_id content source created lastModified x y width height/);
__PACKAGE__->set_primary_key('object_id');
__PACKAGE__->belongs_to(object_id => 'Notewise::SchemaLoader::DBIC::ObjectId');
__PACKAGE__->belongs_to(container_object => 'Notewise::SchemaLoader::DBIC::ObjectId');
__PACKAGE__->inflate_column(created => {inflate=> \&Notewise::M::DBIC::inflate_datetime,
                                        deflate=> \&Notewise::M::DBIC::deflate_datetime});
__PACKAGE__->inflate_column(lastModified => {inflate=> \&Notewise::M::DBIC::inflate_timestamp,
                                             deflate=> \&Notewise::M::DBIC::deflate_timestamp});

sub user {
    my ($self, $user) = @_;
    if(defined $user){
        $self->object_id->user($user);
        $self->object_id->update;
    }
    return $self->object_id->user;
}

sub new {
    my $class = shift;
    my ($params) = @_;

    my $user = delete $params->{user};

    if(!defined $params->{created}){
        $params->{created} = DateTime->now();
    }
    if(!defined $params->{lastModified}){
        $params->{lastModified} = DateTime->now();
    }
    my $self = $class->next::method( $params );

    $self->{_temp}->{user}=$user;
    return $self;
}

sub insert {
    my $self = shift;

    my $user = $self->{_temp}->{user};
    my $user_id = ref $user ? $user->id : $user;
    $object_id = $self->create_related('object_id',{type=>'note', user=>$user_id});
    $self->set_from_related(object_id => $object_id);

    my $result =  $self->next::method( $params );
    return $result;
}

sub delete {
    my $self = shift;
    my ($params) = @_;

    my $result =  $self->next::method( $params );
    $self->object_id->delete;
    return $result;
}

sub to_xml_hash {
    my $self = shift;
    return {
        id => $self->get_column('object_id'),
        container_object => $self->get_column('container_object'),
        content => $self->content,
        source => $self->source,
        created => $self->created->strftime($self->strf_format),
        lastmodified => $self->lastModified->strftime($self->strf_format),
        x => $self->x,
        y => $self->y,
        width => $self->width,
        height => $self->height,
    };
}

sub has_permission {
    my $self = shift;
    return $self->object_id->has_permission(@_);
}

sub kernel {
    my $self = shift;
    return $self->container_object->object;
}

sub strf_format {
    return '%Y-%m-%d %H:%M:%S';
}

1;
