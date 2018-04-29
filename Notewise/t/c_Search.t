
use Test::More tests => 3;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::C::Search');

ok( request('search')->is_success );

