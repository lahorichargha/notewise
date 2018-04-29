package Notewise::C::REST::ContainedObject;

use strict;
use base 'Catalyst::Base';

=head1 NAME

Notewise::C::REST::ContainedObject - REST Controller Component

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

REST Controller Component.

=cut

sub default : Private {
    my ( $self, $c) = @_;
    $c->res->output('Congratulations, Notewise::C::REST::ContainedObject is on Catalyst!');
}

sub containedobject : Path {
    my ( $self, $c) = @_;

    my $method = $c->req->method;
    if($method eq 'GET'){
        $c->forward('view');
    } elsif($method eq 'PUT'){
        $c->forward('add');
    } elsif($method eq 'POST'){
        $c->forward('update');
    } elsif($method eq 'DELETE'){
        $c->forward('delete');
    }
}

sub view : Private {
    my ( $self, $c, $container_id, $contained_id) = @_;

    my $contained_object = ($c->model('DBIC::ContainedObject')->search(container_object=>$container_id, contained_object=>$contained_id))[0];
    unless($contained_object){
        $c->detach('/rest/notfound',["contained object $container_id/$contained_id was not found"]);
    }

    # check permissions
    unless ($contained_object->has_permission($c->user->user->id,'view')){
        $c->detach('/rest/forbidden',["You do not have access to view contained object $container_id/$contained_id"]);
    }

    # XXX the following hashkey should really be containedobject, no visiblekernel, to allow both /rest/containedobject and /rest/visiblekernel
    $c->stash->{visiblekernel}=$contained_object->to_xml_hash_deep($c->req->base);
    $c->forward('Notewise::V::XML');
}

sub add : Private {
    my ( $self, $c) = @_;

    $c->form( optional => [ $c->model('DBIC::ContainedObject')->result_source->columns ] );
    if ($c->form->has_missing) {
        $c->detach('/rest/error',["missing fields"]);
    } elsif ($c->form->has_invalid) {
        $c->detach('/rest/error',["invalid fields"]);
    }

    # This is a bit of a hack to allow us to add a newly created kernel to
    # this view in one request, instead of two, by allowing the values for
    # the kernel itself to be passed in as well
    $c->form( optional => [ $c->model('DBIC::ContainedObject')->result_source->columns,
                            $c->model('DBIC::Kernel')->result_source->columns] );

    # check permissions
    my $container_object=$c->model('DBIC::Kernel')->find(
                           $c->form->valid('container_object')
                         );
    unless ($container_object->has_permission($c->user->user->id,'modify')){
        $c->detach('/rest/forbidden',["You can't create that contained object because you do not have permission to modify ".$container_object->id]);
    }

    # figure out if we need to create the kernel as well
    unless($c->req->params->{contained_object}){
        my %create_hash;
        foreach my $column ($c->model('DBIC::Kernel')->result_source->columns){
            $create_hash{$column} = $c->form->valid($column);
        }
        $create_hash{user}=$c->user->user->id;
        my $kernel = $c->model('DBIC::Kernel')->create( \%create_hash );
        $c->req->params->{contained_object}=$kernel->id;
    } else {
        my $contained_object=$c->model('DBIC::Kernel')->find(
                               $c->form->valid('contained_object')
                             );
        unless ($contained_object->has_permission($c->user->user->id,'view')){
            $c->detach('/rest/forbidden',["You can't create that contained object because you do not have permission to view ".$contained_object->id]);
        }
    }

    # cause $c->form to be generated again
    $c->form( optional => [ $c->model('DBIC::ContainedObject')->result_source->columns,
                            $c->model('DBIC::Kernel')->result_source->columns
                          ] );

    my $contained_object = $c->model('DBIC::ContainedObject')->create_from_form($c->form);

    $c->res->status(201); # Created
    return $c->forward('view',[$contained_object->get_column('container_object'),
                               $contained_object->get_column('contained_object')]);
}

sub update : Private {
    my ( $self, $c, $container_id, $contained_id) = @_;

    $c->form( optional => [ $c->model('DBIC::ContainedObject')->result_source->columns ] );
    if ($c->form->has_missing) { $c->detach('/rest/error',['missing fields']); }
    elsif ($c->form->has_invalid) { $c->detach('/rest/error',['invalid fields']); }

    # check permissions
    my $container=$c->model('DBIC::ObjectId')->find($container_id);
    unless ($container->has_permission($c->user->user->id,'modify')){
        $c->detach('/rest/forbidden',["You do not have permission to modify $container_id"]);
    }

    # do the update
    my $contained_object = (
        $c->model('DBIC::ContainedObject')->search(container_object=>$container_id,
                                                   contained_object=>$contained_id))[0];
    unless($contained_object){
        $c->detach('/rest/notfound');
    }
    foreach my $column ($c->model('DBIC::ContainedObject')->result_source->columns){
        $contained_object->set_column($column,$c->form->valid($column))
            if defined $c->form->valid($column);
    }
    $contained_object->update();
    $c->detach('/rest/ok');
}

sub delete : Private {
    my ( $self, $c, $container_id, $contained_id) = @_;

    my $containedobject = ($c->model('DBIC::ContainedObject')->search(container_object=>$container_id, contained_object=>$contained_id))[0];

    # check permissions
    unless ($containedobject->container_object->has_permission($c->user->user->id,'modify')){
        $c->detach('/rest/forbidden',["You do not have permission to delete $container_id/$contained_id"]);
    }

    if($containedobject){
        $containedobject->delete();
        $c->detach('/rest/ok');
    } else {
        $c->detach('/rest/notfound');
    }
}

=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software . You can redistribute it and/or modify
it under the same terms as perl itself.

=cut

1;
