use Test::More tests => 12;
use Test::WWW::Mechanize::Catalyst 'Notewise';
use Test::XML;
use Notewise::TestUtils;

use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::C::REST::Relationship');

ok( request('rest/relationship')->is_success );

my $req;
my $mech;

# login
my $user;
($mech, $user) = login_user('test@tester.scottyallen.com','password');
my $user_id=$user->id;

# setup some dummy kernels

$req = new_request('PUT', "http://localhost/rest/kernel",
                    {name=>'harrypotter',
                     uri=>'myuri',
                     source=>'mysource',
                     created=>'2005-01-01 01:02:03'});
$mech->request($req);
my ($kernel_id) = $mech->content =~ /<kernel.+id="(\d+)"/;

$req = new_request('PUT', "http://localhost/rest/kernel",
                    {name=>'harrypotter',
                     uri=>'myuri',
                     source=>'mysource',
                     created=>'2005-01-01 01:02:03'});
$mech->request($req);
my ($kernel2_id) = $mech->content =~ /<kernel.+id="(\d+)"/;

# create a new relationship
# TODO need to test type stuff
$req = new_request('PUT', "http://localhost/rest/relationship",
                    {part1=> $kernel_id,
                     part2=> $kernel2_id,
                     nav => 'fromleft',
                     type => 'asdf'
                    });
$mech->request($req);
is($mech->status,201,'Status of PUT is 201');

my ($relationship_id) = $mech->content =~ /<relationship.*\sid="(\d+)"/;
is_xml($mech->content, qq#<response><relationship nav="fromleft" part1="$kernel_id" part2="$kernel2_id" id="$relationship_id" type="asdf" /></response>#);

my $relationship = Notewise::M::CDBI::Relationship->retrieve($relationship_id);
is($relationship->user->id,$user_id, 'user id matches');

# fetch it again

$req = new_request('GET', "http://localhost/rest/relationship/$relationship_id");
$mech->request($req);

is($mech->status,200,'Status of GET is 201');
is_xml($mech->content, qq#<response><relationship nav="fromleft" part1="$kernel_id" part2="$kernel2_id" id="$relationship_id" type="asdf" /></response>#);

# update it

$req = new_request('POST', "http://localhost/rest/relationship/$relationship_id",
                    {part1=> $kernel2_id,
                     part2=> $kernel_id,
                     nav => 'fromright',
                     type => 'asdfoo'
                    });
$mech->request($req);
is($mech->status,200,'Status of POST is 200');

# fetch it again

$req = new_request('GET', "http://localhost/rest/relationship/$relationship_id");
$mech->request($req);

is($mech->status,200,'Status of GET is 200');
is_xml($mech->content, qq#<response><relationship nav="fromright" part1="$kernel2_id" part2="$kernel_id" id="$relationship_id" type="asdfoo" /></response>#);

# vim:filetype=perl
