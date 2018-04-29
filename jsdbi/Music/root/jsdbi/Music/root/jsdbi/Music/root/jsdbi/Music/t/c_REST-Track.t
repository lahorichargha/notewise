
use Test::More tests => 3;
use_ok( Catalyst::Test, 'Music' );
use_ok('Music::C::REST::Track');

ok( request('rest/track')->is_success );

