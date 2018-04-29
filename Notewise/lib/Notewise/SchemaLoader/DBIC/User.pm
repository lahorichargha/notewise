package Notewise::SchemaLoader::DBIC::User;

use base qw/DBIx::Class/;

__PACKAGE__->load_components(qw/ResultSetManager PK::Auto::MySQL Core +Notewise::UpdateFromForm/);
__PACKAGE__->load_resultset_components(qw/+Notewise::CreateFromForm/);
__PACKAGE__->table('user');
__PACKAGE__->add_columns(qw/id name email username password user_type/);
__PACKAGE__->belongs_to(user_type => 'Notewise::SchemaLoader::DBIC::UserType');
__PACKAGE__->set_primary_key('id');

sub insert {
    my $self = shift;

    my $result =  $self->next::method( @_ );

    # create starting kernel
    my $kernel = $self->resultset('Kernel')->create({name=>''});
    $kernel->user($self->id);
    $kernel->update();

    # Create sandbox
    my $sandbox = $self->resultset('ObjectId')->create({type=>'sandbox',
                                                       user=>$self->id});

    return $result;
}

sub resultset {
    $self = shift;
    return $self->result_source->schema->resultset(shift);
}

sub kernel_count {
    my $self = shift;
    return scalar($self->resultset('ObjectId')->search({user=>$self->id, type=>'kernel'}));
    my @relationships1 = $self->resultset('Relationship')->search({part1 => $self->id});
}

sub note_count {
    my $self = shift;
    return scalar($self->resultset('ObjectId')->search({user=>$self->id, type=>'note'}));
}

sub relationship_count {
    my $self = shift;
    return scalar($self->resultset('ObjectId')->search({user=>$self->id, type=>'relationship'}));
}

# clears the kernels, notes, and relationships for this user
sub clear {
    my $self = shift;
    # delete kernels first, as they have cascaded deletes to other objects. If
    # we don't do this, then we get errors trying to delete objects that have
    # already been deleted, because we try to delete them twice (once as part
    # of the cascade, and once because we found them in the search).
    my @kernels = $self->resultset('ObjectId')->search({user => $self->id, type=>'kernel'});
    foreach my $object_id (@kernels){
        next if ref($object_id) =~ /Has::Been::Deleted/;
        if($object_id->object){
            $object_id->object->delete;
        } else {
            $object_id->delete;
        }
    }

    # delete everything else
    my @object_ids = $self->resultset('ObjectId')->search({user => $self->id});
    foreach my $object_id (@object_ids){
        if($object_id->object){
            $object_id->object->delete;
        } else {
            $object_id->delete;
        }
    }
}

sub set_column {
    my ($self,$name,$value)=@_;
    if ($name eq 'password') {
        $value = Digest::MD5::md5_hex($value);
    }
    my $result =  $self->next::method( $name, $value );
    return $result;
}


# returns true if the given password matches the user's password
sub check_password {
    my ($self, $password) = @_;
    return $self->password eq Digest::MD5::md5_hex($password); #XXX this will change when passwords get encrypted
}

sub authentication_hash {
    my $self = shift;
    return $self->username . ':' . Digest::MD5::md5_hex("s3kr3tw0rd".$self->username);
}

sub kernels {
    my $self = shift;
    my @kernels = $self->resultset('Kernel')->search({'object_id.user' => $self->id}, { join => 'object_id' });
    return @kernels;
}

sub notes {
    my $self = shift;
    my @notes = $self->resultset('Note')->search({'object_id.user' => $self->id}, { join => 'object_id' });
    return @notes;
}

sub relationships {
    my $self = shift;
    my @notes = $self->resultset('Relationship')->search({'relationship_id.user' => $self->id}, { join => 'relationship_id' });
    return @notes;
}

# Creates a copy of this user and all of their objects and returns it, with the new username and email
# given (since all usernames and emails have to be unique);
sub fullcopy {
    my $self = shift;
    my $username = shift;
    my $email = shift;

    my $user = $self->copy({id=>undef,
                            email=>$email,
                            username=>$username});

    # maps from old user's object ids to new user object ids
    my %object_map;
    foreach my $old_kernel ($self->kernels){
        my $new_kernel = $old_kernel->copy({object_id=>undef});
        $new_kernel->user($user);
        $new_kernel->update();
        $object_map{$old_kernel->get_column('object_id')} = $new_kernel->get_column('object_id');
    }

    warn Data::Dumper::Dumper(\%object_map);

    # have to do second pass here, so we're sure that all the container objects
    # have been created first.
    foreach my $old_kernel ($self->kernels){
        my @contained = $self->resultset('ContainedObject')->search({contained_object => $old_kernel->get_column('object_id')});
        foreach my $old_contained (@contained){
            warn "container_object: ".$old_contained->get_column('container_object')." => ".$object_map{$old_contained->get_column('container_object')};
            warn "contained_object: ".$old_contained->get_column('contained_object')." => ".$object_map{$old_contained->get_column('contained_object')};
            my $new_contained = $old_contained->copy({id=>undef,
                                                      container_object=>$object_map{$old_contained->get_column('container_object')},
                                                      contained_object=>$object_map{$old_contained->get_column('contained_object')}
                                                    });
        }
     }

    foreach my $old_note ($self->notes){
        my $new_note = $old_note->copy({object_id=>undef,container_object=>$object_map{$old_note->get_column('container_object')}});
        $new_note->user($user);
        $new_note->update();
        $object_map{$old_note->get_column('object_id')} = $new_note->get_column('object_id');
    }

    foreach my $old_object ($self->notes, $self->kernels){
        my @old_rels = $self->resultset('Relationship')->search({part1=>$old_object->object_id});
        push @old_rels, $self->resultset('Relationship')->search({part2=>$old_object->object_id});
        foreach my $old_rel (@old_rels) {
            # we see every relationship twice, so skip it if we've already seen it
            next if $object_map{$old_rel->relationship_id->id};
            my $new_rel = $old_rel->copy({relationship_id=>undef,
                                          part1=>$object_map{$old_rel->part1},
                                          part2=>$object_map{$old_rel->part2},
                                          user=>$user,
                                        });
            my $new_rel_id = $new_rel->relationship_id;
            $object_map{$old_rel->relationship_id->id} = $new_rel_id;
        }
    }
    return $user;
}

1;
