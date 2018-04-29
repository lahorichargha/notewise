
use Test::More tests => 3;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::C::Admin::Account');

ok( request('admin/account')->is_success );

