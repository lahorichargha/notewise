package Notewise::C::Javascript;

use strict;
use warnings;
use base 'Catalyst::Base';

=head1 NAME

Notewise::C::Javascript - Catalyst component

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

Catalyst component.

=head1 METHODS

=over 4

=item default

=cut

sub default : Private {
    my ( $self, $c ) = @_;

    $c->stash->{template}='javascript.tt';
}

=back


=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software, you can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

1;
