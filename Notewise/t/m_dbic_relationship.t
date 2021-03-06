use Test::More tests => 3;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::M::CDBI::Relationship');

# delete any stale test users
map $_->delete, Notewise->model('DBIC::User')->search({email=>'fred@flintstone.com'});

my $user = Notewise->model('DBIC::User')->create({name=>'Fred Flintstone1',email=>'fred@flintstone.com',password=>'password',username=>'fred'});

my $kernel = Notewise->model('DBIC::Kernel')->create({name=>'foo',user=>$user});
my $kernel2 = Notewise->model('DBIC::Kernel')->create({name=>'bar',user=>$user});

my $relationship = Notewise->model('DBIC::Relationship')->create({part1=>$kernel->object_id,part2=>$kernel2->object_id,user=>$user,nav=>'bi',type=>1});

diag "relationship_id: ".$relationship->id;
$relationship = Notewise->model('DBIC::Relationship')->find($relationship->id);

is($relationship->user->id,$user->id);

$relationship->delete;
$kernel->delete;
$kernel2->delete;
$user->delete;

# vim:ft=perl
