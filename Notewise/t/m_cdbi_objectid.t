use Test::More tests => 6;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::M::CDBI::ObjectId');
use_ok('Notewise::M::CDBI::User');

my $user = Notewise::M::CDBI::User->find_or_create({email=>'fred@flintstone.com'});
$user->name('Fred Flintstone2');
$user->password('password');
$user->update;
my $object_id = Notewise::M::CDBI::ObjectId->create({type=>'kernel',user=>$user->id});

ok($object_id->id > 0);
is($object_id->user,$user);
is($object_id->type,'kernel');

$user->delete;
$object_id->delete;
1;

# vim:ft=perl
