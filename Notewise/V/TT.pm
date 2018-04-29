package Notewise::V::TT;

use strict;
use base 'Catalyst::View::TT';
__PACKAGE__->config->{EVAL_PERL} = 1;
__PACKAGE__->config->{TIMER} = 0;
__PACKAGE__->config->{RECURSION} = 1;
__PACKAGE__->config->{PRE_CHOMP} = 2; # collapse whitespace before tags to 1 space
__PACKAGE__->config->{POST_CHOMP} = 2; # collapse whitespace after tags to 1 space
__PACKAGE__->config->{COMPILE_EXT} = '.ttc';

=head1 NAME

Notewise::V::TT - TT View Component

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

TT View Component.

=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software . You can redistribute it and/or modify
it under the same terms as perl itself.

=cut

1;
