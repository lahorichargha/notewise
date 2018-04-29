package Music::M::CDBI;

use strict;
use base 'Catalyst::Model::CDBI';

__PACKAGE__->config(
    dsn           => 'dbi:SQLite:sqlite-db',
    user          => '',
    password      => '',
    options       => {},
    relationships => 1,
    additional_base_classes => [qw/Class::DBI::FromForm Class::DBI::AsForm Class::DBI::AbstractSearch/]
);

=head1 NAME

Music::M::CDBI - CDBI Model Component

=head1 SYNOPSIS

See L<Music>

=head1 DESCRIPTION

CDBI Model Component.

=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software . You can redistribute it and/or modify
it under the same terms as perl itself.

=cut

1;
