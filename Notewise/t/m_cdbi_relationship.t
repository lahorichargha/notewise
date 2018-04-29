use Test::More tests => 4;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::M::CDBI::Relationship');

# delete any stale test users
map $_->delete, Notewise::M::CDBI::User->search({email=>'fred@flintstone.com'});

my $user = Notewise::M::CDBI::User->create({name=>'Fred Flintstone1',email=>'fred@flintstone.com',password=>'password',username=>'fred'});

my $kernel = Notewise::M::CDBI::Kernel->create({name=>'foo',user=>$user});
my $kernel2 = Notewise::M::CDBI::Kernel->create({name=>'bar',user=>$user});

my $relationship = Notewise::M::CDBI::Relationship->create({part1=>$kernel->object_id,part2=>$kernel2->object_id,user=>$user,nav=>'bi',type=>1});

$relationship = Notewise::M::CDBI::Relationship->retrieve($relationship->id);

is($relationship->user,$user);
is($relationship->user->id,$user->id);

$relationship->delete;
$kernel->delete;
$kernel2->delete;
$user->delete;

# vim:ft=perl
