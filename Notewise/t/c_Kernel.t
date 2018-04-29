use Test::More tests => 6;
use Test::WWW::Mechanize::Catalyst 'Notewise';
use Notewise::TestUtils;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::C::Kernel');

my $mech;
my $user;

# login
($mech, $user) = login_user('test@tester.scottyallen.com','password','test');
my $user_id=$user->id;

# create a dummy kernel
my $kernel = Notewise::M::CDBI::Kernel->create({name=>'foo',user=>$user_id});
my $kernel_id = $kernel->id;

### try looking at a kernel
$req = new_request('GET', "http://localhost/test/foo");
$mech->request($req);
is($mech->status,200,'Status of GET is 200');

# login as a different user
my $user2;
($mech, $user2) = login_user('test2@tester.scottyallen.com','password');

### try looking at another user's kernel
$req = new_request('GET', "http://localhost/test/foo");
$mech->request($req);
is($mech->status,403,'Status of GET is 403');


# cleanup
$kernel->delete;
$user->delete;
$user2->delete;

# vim:ft=perl
