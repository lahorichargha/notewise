
use Test::More tests => 3;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::C::Javascript');

ok( request('javascript')->is_success );

