package Notewise::C::Admin;

use strict;
use base 'Catalyst::Base';

sub default : Private{
    my ( $self, $c ) = @_;
    $c->res->redirect($c->uri_for('/admin/account'));
}

1;
