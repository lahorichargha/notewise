package Music::C::REST::Artist;

use strict;
use base 'Catalyst::Base';

=head1 NAME

Music::C::REST::Artist - Catalyst component

=head1 SYNOPSIS

See L<Music>

=head1 DESCRIPTION

Catalyst component.

=head1 METHODS

=over 4

=item default

=cut

sub default : Private {
    my ( $self, $c) = @_;
    $c->res->output('Congratulations, Music::C::REST::Artist is on Catalyst!');
}

sub artist : Path('/rest/artist') {
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

    my $artist = Music::M::CDBI::Artist->retrieve($id);
    unless($artist){
        $c->response->status(404);
        $c->req->output('ERROR');
        return;
    }
    my %artist_hash;
    foreach my $column (Music::M::CDBI::Artist->columns) {
        $artist_hash{$column} = $artist->$column;
    }
    $c->stash->{artist}=\%artist_hash;
    $c->forward('Music::V::XML');
}

sub find : Local {
    my ( $self, $c, $id, $type) = @_;

    my @cds = Music::M::CDBI::Cd->search({artist=>$id});
    my @cd_hashes;
    foreach my $cd (@cds){
        my %cd_hash;
        foreach my $column (Music::M::CDBI::Cd->columns) {
            $cd_hash{$column} = $cd->$column;
        }
        push @cd_hashes, \%cd_hash;
    }
    $c->stash->{cd}=\@cd_hashes;
    $c->forward('Music::V::XML');
}

sub add : Private {
    my ( $self, $c) = @_;

    $c->form( optional => [ Music::M::CDBI::Artist->columns ] );
    if ($c->form->has_missing) {
        $c->res->status(400); # Bad Request
    } elsif ($c->form->has_invalid) {
        $c->res->status(400); # Bad Request
    } else {
        my $artist = Music::M::CDBI::Artist->create_from_form( $c->form );
        $c->res->status(201); # Created
    	return $c->forward('view',[$artist->id]);
    }
}

sub update : Private {
    my ( $self, $c, $id) = @_;

    $c->form( optional => [ Music::M::CDBI::Artist->columns ] );
    if ($c->form->has_missing) {
        $c->res->status(400); # Bad Request
        $c->res->output('ERROR');
    } elsif ($c->form->has_invalid) {
        $c->res->status(400); # Bad Request
        $c->res->output('ERROR');
    } else {
        my $artist = Music::M::CDBI::Artist->retrieve($id);
        unless($artist){
            $c->res->status(404); # Not found
            return $c->res->output('ERROR');
        }
        $artist->update_from_form( $c->form );
        $c->res->status(200); # OK
    	return $c->forward('view',[$id]);
    }
}

sub delete : Private {
    my ( $self, $c, $id) = @_;

    my $artist = Music::M::CDBI::Artist->retrieve($id);
    if($artist){
        $artist->delete();
        $c->res->status(200);
    } else {
        $c->res->status(404);
    }
    $c->res->output('OK');
}

=back


=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software . You can redistribute it and/or modify
it under the same terms as perl itself.

=cut

1;
