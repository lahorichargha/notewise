package Notewise::C::REST::Note;

use strict;
use base 'Catalyst::Base';
use DateTime::Format::DateParse;

=head1 NAME

Notewise::C::REST::Note - REST Controller Component

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

REST Controller Component.

=cut

sub default : Private {
    my ( $self, $c) = @_;
    $c->res->output('Congratulations, Notewise::C::REST::Note is on Catalyst!');
}

sub note : Path {
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

    my $note = $c->model('DBIC::Note')->find($id);
    unless($note){
        $c->detach('/rest/notfound',["Couldn't find note $id"]);
    }
    $c->stash->{note}=$note->to_xml_hash;
    $c->forward('Notewise::V::XML');
}

sub add : Private {
    my ( $self, $c) = @_;

    $c->form( optional => [ $c->model('DBIC::Note')->result_source->columns ],
              field_filter_regexp_map => {
                  qr/^created|lastmodified|lastviewed$/i => sub { return DateTime::Format::DateParse->parse_datetime(shift); },
              },
              defaults => {
                  content => '',
              },
              missing_optional_valid=>1,
            );
    if ($c->form->has_missing) {
        $c->detach('/rest/error',['missing fields']);
    } elsif ($c->form->has_invalid) {
        $c->detach('/rest/error',['invalid fields']);
    } else {
        # check permissions
        my $container_object=$c->model('DBIC::Kernel')->find($c->form->valid('container_object'));
        if (check_user_is_owner($c, $container_object)){
            my $note = $c->model('DBIC::Note')->create({});
            foreach my $column ($c->model('DBIC::Note')->result_source->columns){
                $note->$column($c->form->valid($column))
                    if defined $c->form->valid($column);
            }
            $note->user($c->user->user->id);
            $note->update;
            $c->res->status(201); # Created
            return $c->forward('view',[$note->object_id->id]);
        }
    }
}

sub update : Private {
    my ( $self, $c, $id) = @_;

    $c->form( optional => [ $c->model('DBIC::Note')->result_source->columns ] );
    if ($c->form->has_missing) {
        $c->detach('/rest/error',['missing fields']);
    } elsif ($c->form->has_invalid) {
        $c->detach('/rest/error',['invalid fields']);
    } else {
        my $note = $c->model('DBIC::Note')->find($id);
        unless($note){
            $c->detach('/rest/notfound',["couldn't find note $id"]);
            return $c->res->output('ERROR');
        }
        if(check_user_is_owner($c, $note)){
            $note->update_from_form($c->form);
            $c->res->status(200); # OK
            return $c->forward('view',[$id]);
        }
    }
}

sub check_user_is_owner {
    my ($c,$object) = @_;

    # check permissions
    if ($object->user->id != $c->user->user->id){
        $c->detach('/rest/forbidden',["user ".$c->user->user->id." isn't the owner of object ".$object->id]);
    }
    return 1;
}

sub delete : Private {
    my ( $self, $c, $id) = @_;

    my $note = $c->model('DBIC::Note')->find($id);
    if(check_user_is_owner($c, $note)){
        if($note){
            $note->delete();
            $c->res->status(200);
        } else {
            $c->detach('/rest/notfound',["couldn't find note $id"]);
        }
        $c->res->output('OK');
    }
}

=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software . You can redistribute it and/or modify
it under the same terms as perl itself.

=cut

1;
