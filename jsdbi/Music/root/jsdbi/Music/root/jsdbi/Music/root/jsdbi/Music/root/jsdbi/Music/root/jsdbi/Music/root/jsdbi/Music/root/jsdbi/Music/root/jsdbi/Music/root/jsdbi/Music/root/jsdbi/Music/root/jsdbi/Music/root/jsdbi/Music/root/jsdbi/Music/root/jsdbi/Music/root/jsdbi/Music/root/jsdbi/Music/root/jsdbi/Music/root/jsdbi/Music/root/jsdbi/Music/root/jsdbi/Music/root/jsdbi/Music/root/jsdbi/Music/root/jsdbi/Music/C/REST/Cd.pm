package Music::C::REST::Cd;

use strict;
use base 'Catalyst::Base';

=head1 NAME

Music::C::REST::Cd - REST Controller Component

=head1 SYNOPSIS

See L<Music>

=head1 DESCRIPTION

REST Controller Component.

=cut

sub default : Private {
    my ( $self, $c) = @_;
    $c->res->output('Congratulations, Music::C::REST::Cd is on Catalyst!');
}

sub cd : Path('/rest/cd') {
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

    my $cd = Music::M::CDBI::Cd->retrieve($id);
    unless($cd){
        $c->response->status(404);
        $c->res->output('ERROR');
        return;
    }
    my %cd_hash;
    foreach my $column (Music::M::CDBI::Cd->columns) {
        $cd_hash{$column} = $cd->$column;
    }
    $c->stash->{cd}=\%cd_hash;
    $c->forward('Music::V::XML');
}

sub add : Private {
    my ( $self, $c) = @_;

    $c->form( optional => [ Music::M::CDBI::Cd->columns ] );
    if ($c->form->has_missing) {
        $c->res->status(400); # Bad Request
    } elsif ($c->form->has_invalid) {
        $c->res->status(400); # Bad Request
    } else {
        my $cd = Music::M::CDBI::Cd->create_from_form( $c->form );
        $c->res->status(201); # Created
    	return $c->forward('view',[$cd->id]);
    }
}

sub update : Private {
    my ( $self, $c, $id) = @_;

    $c->form( optional => [ Music::M::CDBI::Cd->columns ] );
    if ($c->form->has_missing) {
        $c->res->status(400); # Bad Request
        $c->res->output('ERROR');
    } elsif ($c->form->has_invalid) {
        $c->res->status(400); # Bad Request
        $c->res->output('ERROR');
    } else {
        my $cd = Music::M::CDBI::Cd->retrieve($id);
        unless($cd){
            $c->res->status(404); # Not found
            return $c->res->output('ERROR');
        }
        $cd->update_from_form( $c->form );
        $c->res->status(200); # OK
    	return $c->forward('view',[$id]);
    }
}

sub delete : Private {
    my ( $self, $c, $id) = @_;

    my $cd = Music::M::CDBI::Cd->retrieve($id);
    if($cd){
        $cd->delete();
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
