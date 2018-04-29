use Test::More tests => 2;
use_ok( Catalyst::Test, 'Music' );

ok( request('/')->is_success );
