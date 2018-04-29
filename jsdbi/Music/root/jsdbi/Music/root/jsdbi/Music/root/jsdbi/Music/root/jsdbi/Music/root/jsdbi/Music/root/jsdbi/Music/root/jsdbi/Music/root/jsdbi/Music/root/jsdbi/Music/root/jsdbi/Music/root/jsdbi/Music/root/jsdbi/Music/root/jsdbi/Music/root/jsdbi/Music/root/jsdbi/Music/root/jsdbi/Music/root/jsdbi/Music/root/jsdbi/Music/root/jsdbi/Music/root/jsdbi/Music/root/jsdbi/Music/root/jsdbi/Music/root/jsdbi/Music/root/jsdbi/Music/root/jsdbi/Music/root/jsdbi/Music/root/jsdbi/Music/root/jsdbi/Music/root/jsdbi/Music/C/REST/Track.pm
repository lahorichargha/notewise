package Music::C::REST::Track;

use strict;
use base 'Catalyst::Base';

=head1 NAME

Music::C::REST::Track - REST Controller Component

=head1 SYNOPSIS

See L<Music>

=head1 DESCRIPTION

REST Controller Component.

=cut

sub default : Private {
    my ( $self, $c) = @_;
    $c->res->output('Congratulations, Music::C::REST::Track is on Catalyst!');
}

sub track : Path('/rest/track') {
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
    my ( $self, $c, $id) = @_;

    my $track = Music::M::CDBI::Track->retrieve($id);
    unless($track){
        $c->response->status(404);
        $c->res->output('ERROR');
        return;
    }
    my %track_hash;
    foreach my $column (Music::M::CDBI::Track->columns) {
        if($column eq 'title'){
            $track_hash{'content'} = $track->$column;
        } else {
            $track_hash{$column} = $track->$column;
        }
    }
    $c->stash->{track}=\%track_hash;
    $c->forward('Music::V::XML');
}

sub add : Private {
    my ( $self, $c) = @_;

    $c->form( optional => [ Music::M::CDBI::Track->columns ] );
    if ($c->form->has_missing) {
        $c->res->status(400); # Bad Request
    } elsif ($c->form->has_invalid) {
        $c->res->status(400); # Bad Request
    } else {
        my $track = Music::M::CDBI::Track->create_from_form( $c->form );
        $c->res->status(201); # Created
    	return $c->forward('view',[$track->id]);
    }
}

sub update : Private {
    my ( $self, $c, $id) = @_;

    $c->form( optional => [ Music::M::CDBI::Track->columns ] );
    if ($c->form->has_missing) {
        $c->res->status(400); # Bad Request
        $c->res->output('ERROR');
    } elsif ($c->form->has_invalid) {
        $c->res->status(400); # Bad Request
        $c->res->output('ERROR');
    } else {
        my $track = Music::M::CDBI::Track->retrieve($id);
        unless($track){
            $c->res->status(404); # Not found
            return $c->res->output('ERROR');
        }
        $track->update_from_form( $c->form );
        $c->res->status(200); # OK
    	return $c->forward('view',[$id]);
    }
}

sub delete : Private {
    my ( $self, $c, $id) = @_;

    my $track = Music::M::CDBI::Track->retrieve($id);
    if($track){
        $track->delete();
        $c->res->status(200);
    } else {
        $c->res->status(404);
    }
    $c->res->output('OK');
}

=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software . You can redistribute it and/or modify
it under the same terms as perl itself.

=cut

1;
