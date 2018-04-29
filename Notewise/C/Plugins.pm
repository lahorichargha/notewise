package Notewise::C::Plugins;

use strict;
use base 'Catalyst::Base';

sub firefox : Path('/plugins/notewise.src') {
    my ( $self, $c ) = @_;
    $c->stash->{template} = 'plugins/firefox-search.tt';
}

1;
