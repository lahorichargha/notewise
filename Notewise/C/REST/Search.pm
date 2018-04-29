package Notewise::C::REST::Search;

use strict;
use warnings;
use base 'Catalyst::Controller';

=head1 NAME

Notewise::C::REST::Search - Catalyst Controller

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

Catalyst Controller.

=head1 METHODS

=head2 default

=cut

sub search : Path {
    my ( $self, $c, $searchstring ) = @_;

    my $max_results = 1000;

    my @objects = $c->model('DBIC::Kernel')->search({
                            name => { 'like', $searchstring."%" }
                        });
    if(@objects < $max_results){
        # if we didn't get enough, get some more
        push @objects, $c->model('DBIC::Kernel')->search({
                            name => { 'like', "% ".$searchstring."%" }
                        });
    }

    if(@objects < $max_results){
        # if we didn't get enough, get some more
        push @objects, $c->model('DBIC::Note')->search({
                            content => { 'like', $searchstring."%" }
                        });
    }

    if(@objects < $max_results){
        # if we didn't get enough, get some more
        push @objects, $c->model('DBIC::Note')->search({
                            content => { 'like', "% ".$searchstring."%" }
                        });
    }

    # only show up to max_results
    my %objects_to_return;
    foreach my $object (@objects){
        last if(keys %objects_to_return >= $max_results);
        next unless $object->has_permission($c->user->user->id,'view');
        $objects_to_return{get_type($object).$object->id} = $object;
    }

    #TODO unify these two loops

    foreach my $object (values %objects_to_return){
        my $type = get_type($object);
        $c->stash->{$type} ||= [];
        push @{$c->stash->{$type}}, $object->to_xml_hash;
    }
    $c->forward('Notewise::V::XML');
}

# returns the type of the object, such as 'kernel', or 'note'
sub get_type {
    my $object = shift;
    my ($type) = (ref $object) =~ /:(\w+)$/;
    $type = lc($type);
}

# TODO make sure we're not returning duplicates - use a hash


=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software, you can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

1;
