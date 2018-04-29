package Notewise::C::REST;

use strict;
use warnings;
use base 'Catalyst::Controller';

=head1 NAME

Notewise::C::REST - Catalyst Controller

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

Catalyst Controller.

=head1 METHODS

=cut

sub ok: Private {
    my ( $self, $c) = @_;
    $c->res->status(200); # Ok
    return $c->res->output('OK');
}

sub error: Private {
    my ( $self, $c, $message) = @_;
    if($message){
        $message="ERROR - $message";
    } else {
        $message="ERROR";
    }
    $c->forward('do_error',[400,$message]);
}

sub forbidden: Private {
    my ( $self, $c, $message) = @_;
    if($message){
        $message="FORBIDDEN - $message";
    } else {
        $message="FORBIDDEN";
    }
    $c->forward('do_error',[403,$message]);
}

sub notfound: Private {
    my ( $self, $c, $message) = @_;
    if($message){
        $message="ERROR - $message";
    } else {
        $message="ERROR";
    }
    $c->forward('do_error',[404,$message]);
}

sub do_error : Private {
    my ( $self, $c, $status_code, $message) = @_;
    $c->res->status($status_code);
    $c->log->info($message);
    $c->res->output($message);
}


=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software, you can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

1;
