package Notewise::SchemaLoader::DBIC::Kernel;

use base qw/DBIx::Class/;
use URI::Escape;
use strict;
use warnings;

__PACKAGE__->load_components(qw/ResultSetManager Core +Notewise::UpdateFromForm/);
__PACKAGE__->load_resultset_components(qw/+Notewise::CreateFromForm/);
__PACKAGE__->table('kernel');
__PACKAGE__->add_columns(qw/object_id name uri source created lastModified lastViewed/);
__PACKAGE__->set_primary_key('object_id');
__PACKAGE__->belongs_to(object_id => 'Notewise::SchemaLoader::DBIC::ObjectId', undef, { proxy => ['user'],
                                                                                        cascade_copy=>0 });
__PACKAGE__->has_many(notes => 'Notewise::SchemaLoader::DBIC::Note', 'container_object',{cascade_copy=>0});
__PACKAGE__->has_many(contained_objects => 'Notewise::SchemaLoader::DBIC::ContainedObject', 'container_object',{cascade_copy=>0});
__PACKAGE__->inflate_column(created => {inflate=> \&Notewise::M::DBIC::inflate_datetime,
                                        deflate=> \&Notewise::M::DBIC::deflate_datetime});
__PACKAGE__->inflate_column(lastModified => {inflate=> \&Notewise::M::DBIC::inflate_timestamp,
                                             deflate=> \&Notewise::M::DBIC::deflate_timestamp});
__PACKAGE__->inflate_column(lastViewed => {inflate=> \&Notewise::M::DBIC::inflate_timestamp,
                                           deflate=> \&Notewise::M::DBIC::deflate_timestamp});

sub new {
    my $class = shift;
    my ($params) = @_;


    my $user = delete $params->{user};

    if(!defined $params->{created}){
        $params->{created} = DateTime->now();
    }
    if(!defined $params->{lastViewed}){
        $params->{lastViewed} = DateTime->now();
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
    my ($params) = @_;

    my $user = $self->{_temp}->{user};
    my $user_id = ref $user ? $user->id : $user;
    my $object_id = $self->create_related('object_id',{type=>'kernel', user=>$user_id});
    $self->set_from_related(object_id => $object_id);

    my $result =  $self->next::method( $params );
    return $result;
}

sub delete {
    my $self = shift;

    my $result =  $self->next::method( @_ );
    map $_->delete(), $self->result_source->schema->resultset('ContainedObject')->search({contained_object=>$self->get_column('object_id')});
    $self->object_id->delete;
    return $result;
}

sub update {
    my $self = shift;
    my $result =  $self->next::method( @_ );
    if(exists $self->{_inflated_column}{object_id}){
        $self->object_id->update();
    }
    return $result;
}

sub relative_url {
    my $self = shift;
    my $name = defined $self->name ? $self->name : '';
    if($name){
        $name =~ s/\s+$//;
        $name =~ s/\s/_/g;
    }
    my $unsafe = '^A-Za-z0-9_\-.!~*\'()';
    if($name eq ''){
        return uri_escape($self->user->username,$unsafe)."//".$self->get_column('object_id');
    } elsif($self->result_source->resultset->count_kernels_with_name($name,$self->object_id->get_column('user')) > 1){
        return uri_escape($self->user->username,$unsafe)."/".uri_escape($name,$unsafe)."/".$self->get_column('object_id');
    } else {
        return uri_escape($self->user->username,$unsafe)."/".uri_escape($name,$unsafe);
    }
}

# url that includes id
sub full_url {
    my $self = shift;
    my $name = defined $self->name ? $self->name : '';
    if($name){
        $name =~ s/\s+$//;
        $name =~ s/\s/_/g;
    }
    my $unsafe = '^A-Za-z0-9_\-.!~*\'()';
    return uri_escape($self->user->username,$unsafe)."/".uri_escape($name,$unsafe)."/".$self->get_column('object_id');
}

sub count_kernels_with_name : ResultSet {
    my $class = shift;
    my $name = shift;
    my $user_id = shift;

    $name =~ s/_/ /g;

    my $count = $class->count({
                                    'me.name'=>$name,
                                    'user.id'=>$user_id
                                },
                                {
                                    join => {
                                        'object_id' => 'user'
                                    }
                                });
    return $count;
}

sub kernels_with_name : ResultSet {
    my $class = shift;
    my $name = shift;
    my $user_id = shift;

    $name =~ s/_/ /g;

    my @kernels = $class->search({
                                    'me.name'=>$name,
                                    'user.id'=>$user_id
                                },
                                {
                                    join => {
                                        'object_id' => 'user'
                                    }
                                });
    return @kernels;
}

sub has_permission {
    my $self = shift;
    return $self->object_id->has_permission(@_);
}

# returns all the relationships that are visible on this kernel - all
# relationships for which both endpoints are on this kernel
sub visible_relationships {
    my $self = shift;
    # allow the user to pass these in to prevent fetching them twice if they already have them (yes, it's a hack).
    my $contained_objects = shift;
    my $notes = shift;

    # get all the child ids for this view
    if(!defined $contained_objects){
        $contained_objects = [$self->contained_objects];
    }
    if(!defined $notes){
        $notes = [$self->notes];
    }
    my @kernel_ids = map $_->get_column('contained_object'), @{$contained_objects};
    my @note_ids = map $_->get_column('object_id'), @{$notes};
    my @child_ids = (@note_ids,@kernel_ids);

    if(@child_ids > 0){
        # select all the rels that have endpoints that are one of the children
        my @relationships = $self->result_source->schema->resultset('Relationship')->search({
            part1 => \@child_ids,
            part2 => \@child_ids,
        });

        return @relationships;
    } else {
        return ();
    }
}

sub to_xml_hash {
    return to_xml_hash_shallow(@_);
}

sub to_xml_hash_shallow {
    my $self = shift;
    my $base_url = shift || '';
    return {
            id => $self->object_id->id,
            user => $self->user->id,
            name => $self->name,
            uri => $self->uri,
            object_url => $base_url . $self->relative_url,
            source => $self->source,
            created => $self->created ? $self->created->strftime($self->strf_format) : '',
            lastmodified => $self->lastModified ? $self->lastModified->strftime($self->strf_format): '',
            has_children => $self->has_children
    };
}

# TODO merge this with to_xml_hash_shallow - DRY
sub to_xml_hash_deep {
    my $self = shift;
    my $base_url = shift;
    my @contained_kernels = map $_->to_xml_hash_deep(), $self->contained_objects;
    my @contained_notes = map $_->to_xml_hash, $self->notes;
    my @contained_relationships = map $_->to_xml_hash, $self->visible_relationships;
    return {kernel=>{
                id => $self->get_column('object_id'),
                name => $self->name,
                uri => $self->uri,
                object_url => $base_url . $self->relative_url,
                source => $self->source,
                created => $self->created ? $self->created->strftime($self->strf_format) : '',
                lastmodified => $self->lastModified ? $self->lastModified->strftime($self->strf_format): '',
                has_children => $self->has_children,
                children => {
                    visiblekernel => [ @contained_kernels ],
                },
                notes => {
                    note => [ @contained_notes ],
                },
                relationships => {
                    relationship => [ @contained_relationships ],
                },
            }
    };
}

sub most_recently_viewed_kernel : ResultSet {
    my ($class,$user_id,$max_returned) = @_;
    return $class->_most_recently_kernel($user_id, $max_returned, 'lastViewed');
}

sub most_recently_created_kernel : ResultSet {
    my ($class,$user_id,$max_returned) = @_;
    return $class->_most_recently_kernel($user_id, $max_returned, 'created');
}

sub most_recently_modified_kernel : ResultSet {
    my ($class,$user_id,$max_returned) = @_;
    return $class->_most_recently_kernel($user_id, $max_returned, 'lastModified');
}

sub _most_recently_kernel : ResultSet {
    my ($class,$user_id,$max_returned,$sort_column) = @_;

    my $rs = $class->search(
        { 'object_id.user' => $user_id,
          'object_id.type' => 'kernel' },
        { join => 'object_id',
          order_by => "me.$sort_column DESC"}
    );
    my @kernels;
    for(my $i=0;$i<$max_returned && (my $kernel = $rs->next);$i++){
        push @kernels, $kernel;
    }
    return @kernels;
}

sub strf_format {
    return '%Y-%m-%d %H:%M:%S';
}

# return true if this kernel has notes or children on it
# XXX candidate for optimization
sub has_children {
    my $self = shift;
    return ($self->children > 0) || ($self->notes > 0) || 0;
}

sub children {
    return shift->contained_objects;
}

sub relationships {
    my $self = shift;
    my @relationships1 = $self->result_source->schema->resultset('Relationship')->search(part1 => $self->id);
    my @relationships2 = $self->result_source->schema->resultset('Relationship')->search(part2 => $self->id);
    my @rels = (@relationships1,@relationships2);
    return @rels;
}

sub related_kernels {
    my $self = shift;
    my @relationships1 = $self->result_source->schema->resultset('Relationship')->search({part1 => $self->id});
    my @relationships2 = $self->result_source->schema->resultset('Relationship')->search({part2 => $self->id});
    my @related_objects = ((map $_->part2->object, @relationships1),(map $_->part1->object, @relationships2));
    @related_objects = grep {ref($_) =~ /::Kernel$/} @related_objects;
    return @related_objects;
}

sub related_objects {
    my $self = shift;
    my @relationships1 = $self->result_source->schema->resultset('Relationship')->search({part1 => $self->id});
    my @relationships2 = $self->result_source->schema->resultset('Relationship')->search({part2 => $self->id});
    my @related_objects = ((map $_->part2->object, @relationships1),(map $_->part1->object, @relationships2));
    return @related_objects;
}

sub parents {
    my $self = shift;
    my @contained_ids = $self->result_source->schema->resultset('ContainedObject')->search({contained_object => $self->id});
    my @parents = map $_->container_kernel, @contained_ids;
    return @parents;
}

1;
