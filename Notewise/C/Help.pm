package Notewise::C::Help;

use strict;
use base 'Catalyst::Base';

sub help : Path {
    my ( $self, $c ) = @_;
    $c->stash->{template} = 'help.tt';
}

sub quick : Local {
    my ( $self, $c ) = @_;
    $c->stash->{template} = 'quickhelp.tt';
}

1;
