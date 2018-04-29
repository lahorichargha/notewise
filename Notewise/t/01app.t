use Test::More tests => 2;
use Test::WWW::Mechanize::Catalyst 'Notewise';

my $mech = Test::WWW::Mechanize::Catalyst->new;
$mech->get_ok('http://localhost/');

# XXX this probably will change in the future, as not everything will require you to login
$mech->content_contains('Login',"check we get a login page when we're not logged in");
