
use Test::More tests => 3;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::C::REST::VKernel');

ok( request('rest/vkernel')->is_success );

