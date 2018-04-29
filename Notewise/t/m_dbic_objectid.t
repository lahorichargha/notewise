use Test::More tests => 6;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::M::CDBI::ObjectId');
use_ok('Notewise::M::CDBI::User');

my $user = Notewise->model('DBIC::User')->find_or_create({email=>'fred@flintstone.com'});
$user->name('Fred Flintstone2');
$user->password('password');
$user->update;
my $object_id = Notewise->model('DBIC::ObjectId')->create({type=>'kernel',user=>$user->id});

ok($object_id->id > 0);
is($object_id->user->id,$user->id);
is($object_id->type,'kernel');

$user->delete;
$object_id->delete;
1;

# vim:ft=perl
