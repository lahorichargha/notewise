package Notewise::C::REST::Kernel;

use strict;
use base 'Catalyst::Base';
use URI::Escape;

=head1 NAME

Notewise::C::REST::Kernel - REST Controller Component

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

REST Controller Component.

=cut

sub default : Private {
    my ( $self, $c) = @_;
    $c->res->output('Congratulations, Notewise::C::REST::Kernel is on Catalyst!');
}

sub kernel : Path {
    my ( $self, $c, $id, $action) = @_;

    my $method = uc($c->req->method);
    if(defined $action && $action){
        $c->forward($action);
    } elsif($method eq 'GET'){
        $c->forward('view');
    } elsif($method eq 'PUT'){
        $c->forward('add');
    } elsif($method eq 'POST'){
        $c->forward('update');
    } elsif($method eq 'DELETE'){
        $c->forward('delete');
    }
}

sub children : Private {
    my ( $self, $c, $id) = @_;

    my $kernel = $c->model('DBIC::Kernel')->find($id);
    unless($kernel){
        $c->detach('/rest/notfound',["couldn't find kernel with id $id"]);
        return;
    }
    # check permissions
    unless ($kernel->has_permission($c->user->user->id,'view')){
        $c->detach('/rest/forbidden',["You do not have access to view object $id"]);
    }
    $c->stash->{visiblekernel}=[map $_->to_xml_hash_deep, $kernel->contained_objects];
    $c->forward('Notewise::V::XML');
}

sub visible_relationships : Private {
    my ( $self, $c, $id) = @_;

    my $kernel = $c->model('DBIC::Kernel')->find($id);
    unless($kernel){
        $c->detach('/rest/notfound',["couldn't find kernel with id $id"]);
        return;
    }
    $c->stash->{relationship}=[map $_->to_xml_hash, $kernel->visible_relationships];
    $c->forward('Notewise::V::XML');
}

sub notes : Private {
    my ( $self, $c, $id) = @_;

    my $kernel = $c->model('DBIC::Kernel')->find($id);
    unless($kernel){
        $c->detach('/rest/notfound',["couldn't find kernel with id $id"]);
        return;
    }
    $c->stash->{note}=[map $_->to_xml_hash, $kernel->notes];
    $c->forward('Notewise::V::XML');
}

sub view : Private {
    my ( $self, $c, $id) = @_;

    my $kernel = $c->model('DBIC::Kernel')->find($id);
    unless($kernel){
        $c->detach('/rest/notfound',["couldn't find kernel with id $id"]);
        return;
    }
    # check permissions
    unless ($kernel->has_permission($c->user->user->id,'view')){
        $c->detach('/rest/forbidden',["You do not have access to view object $id"]);
    }
    $c->stash->{kernel}=$kernel->to_xml_hash_deep($c->req->base);

    $c->forward('Notewise::V::XML');
}

sub add : Private {
    my ( $self, $c) = @_;

    $c->form( optional => [ $c->model('DBIC::Kernel')->result_source->columns ] );
    if ($c->form->has_missing) {
        $c->detach('/rest/error',['missing fields']);
    } elsif ($c->form->has_invalid) {
        $c->detach('/rest/error',['invalid fields']);
    } else {
        my $kernel = $c->model('DBIC::Kernel')->create_from_form( $c->form );
        $kernel->user($c->user->user->id);
        warn "user_id: ".$kernel->object_id->user->id;
        $kernel->update;
        $c->res->status(201); # Created
    	return $c->forward('view',[$kernel->object_id->id]);
    }
}

sub update : Private {
    my ( $self, $c, $id) = @_;

    $c->form( optional => [ $c->model('DBIC::Kernel')->result_source->columns ] );
    if ($c->form->has_missing) {
        $c->detach('/rest/error',['missing fields']);
    } elsif ($c->form->has_invalid) {
        $c->detach('/rest/error',['invalid fields']);
    } else {
        my $kernel = $c->model('DBIC::Kernel')->find($id);
        unless($kernel){
            $c->detach('/rest/notfound',["couldn't find kernel with id $id"]);
        }

        # check permissions
        unless ($kernel->has_permission($c->user->user->id,'modify')){
            $c->detach('/rest/forbidden',["You do not have access to modify object $id"]);
        }

        $kernel->update_from_form( $c->form );
        $c->res->status(200); # OK
    	return $c->forward('view',[$id]);
    }
}

sub delete : Private {
    my ( $self, $c, $id) = @_;

    my $kernel = $c->model('DBIC::Kernel')->find($id);
    if($kernel){
        # check permissions
        unless ($kernel->has_permission($c->user->user->id,'delete')){
            $c->detach('/rest/forbidden',["You do not have access to delete object $id"]);
        }

        $kernel->delete();
        $c->res->status(200);
    } else {
        $c->detach('/rest/notfound',["couldn't find kernel with id $id"]);
    }
    $c->res->output('OK');
}

sub find_or_create : Local {
    my ( $self, $c, $searchstring ) = @_;
    $searchstring = uri_unescape($searchstring);
    my @objects = ($c->controller('Search')->do_search($c, $searchstring,1));

    if(@objects){
        my $object = $objects[0];
        if(ref $object =~ 'Note$'){
            $object = $object->container_object;
        }
        $c->forward('view',[$object->object_id->id]);
    } else {
        $c->req->params->{name}=$searchstring;
        $c->forward('add');
    }
}

=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software . You can redistribute it and/or modify
it under the same terms as perl itself.

=cut

1;
