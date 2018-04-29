
use Test::More tests => 3;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::C::REST');

ok( request('rest')->is_success );

