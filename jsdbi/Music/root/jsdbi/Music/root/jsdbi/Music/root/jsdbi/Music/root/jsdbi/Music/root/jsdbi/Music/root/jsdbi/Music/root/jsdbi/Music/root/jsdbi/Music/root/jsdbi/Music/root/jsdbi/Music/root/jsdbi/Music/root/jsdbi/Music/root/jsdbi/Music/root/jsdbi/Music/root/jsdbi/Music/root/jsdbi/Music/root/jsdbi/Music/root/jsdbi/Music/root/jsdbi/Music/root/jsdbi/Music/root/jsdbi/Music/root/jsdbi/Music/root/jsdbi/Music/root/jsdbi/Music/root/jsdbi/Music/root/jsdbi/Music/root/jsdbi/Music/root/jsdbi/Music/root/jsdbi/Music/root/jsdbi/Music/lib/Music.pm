package Music;

use strict;
use Catalyst qw/-Debug FormValidator/;

our $VERSION = '0.01';

Music->config( name => 'Music' );

Music->setup( qw/Static::Simple/ );
Music->config->{static}->{ignore_extensions} = [];

=head1 NAME

Music - Catalyst based application

=head1 SYNOPSIS

    script/music_server.pl

=head1 DESCRIPTION

Catalyst based application.

=head1 METHODS

=over 4

=item default

=cut

sub default : Private {
    my ( $self, $c ) = @_;
    $c->res->output('Congratulations, Music is on Catalyst!');
}

=back

=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software . You can redistribute it and/or modify
it under the same terms as perl itself.

=cut

1;
