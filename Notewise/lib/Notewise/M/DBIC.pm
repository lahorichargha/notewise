package Notewise::M::DBIC;

use strict;
use base 'Catalyst::Model::DBIC::Schema';

use DBIx::Class::Storage::DBI::mysql;
use DateTime::Format::Builder::Parser;
use DateTime::Format::Builder::Parser::Regex;
use DateTime::Format::MySQL;
use Digest::MD5;

#__PACKAGE__->config(
#    schema_class => 'Notewise::SchemaLoader::DBIC',
#    connect_info => [
#        'dbi:mysql:notewise_beta',
#        'root',
#        '',
#        { AutoCommit => 1 },
#    ],
#);

sub inflate_datetime { return _inflate_dt('datetime',@_) }
sub inflate_timestamp { return _inflate_dt('timestamp',@_) }

sub _inflate_dt { 
    my $type = shift;
    my $dt;
    if($type eq 'datetime'){
        $dt = DateTime::Format::MySQL->parse_datetime( shift );
    } elsif ($type eq 'timestamp'){
        $dt = DateTime::Format::MySQL->parse_timestamp( shift );
    }
    return $dt;
};

sub deflate_datetime { return _deflate_dt('datetime',@_) }
sub deflate_timestamp { return _deflate_dt('timestamp',@_) }

sub _deflate_dt {
    my $type = shift;
    my $dt = shift;
    if(ref $dt){
        if($type eq 'datetime'){
            return DateTime::Format::MySQL->format_datetime($dt);
        } elsif ($type eq 'timestamp'){
            return DateTime::Format::MySQL->format_datetime($dt);
        }
    } else {
        return $dt;
    }
}

=head1 NAME

Notewise::M::DBIC - Catalyst DBIC Schema Model

=head1 SYNOPSIS

See L<Notewise>

=head1 DESCRIPTION

L<Catalyst::Model::DBIC::Schema> Model using L<DBIx::Class::Schema::Loader>
generated Schema: L<Notewise::SchemaLoader::DBIC>

=head1 AUTHOR

Scotty Allen

=head1 LICENSE

This library is free software, you can redistribute it and/or modify
it under the same terms as Perl itself.

=cut

1;
