#! /usr/bin/perl

package SeleniumResultsServer;

use HTTP::Server::Simple::CGI;
use base qw(HTTP::Server::Simple::CGI);

my $output_filename = $ARGV[0] || die "The first argument must be the name of an output file";

sub handle_request {
  my $self = shift;
  my $cgi = shift;
  
  open (FILE, '>', $output_filename) or die "Couldn't open $output_filename: $!";
  foreach my $param ($cgi->param) {
    print FILE "$param: ", $cgi->param($param), "\n";
  }
  close FILE;
  print '\n';
  exit;
}

SeleniumResultsServer->new(8000)->run();
