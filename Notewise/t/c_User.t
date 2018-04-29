
use Test::More tests => 3;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::C::User');

ok( request('user')->is_success );

