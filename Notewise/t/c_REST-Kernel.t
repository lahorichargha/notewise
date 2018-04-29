use Test::More tests => 22;
use Test::XML;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::C::REST::Kernel');
use Test::WWW::Mechanize::Catalyst 'Notewise';
use Notewise::TestUtils;


my $mech;
my $user;

# login
($mech, $user) = login_user('test@tester.scottyallen.com','password','test');
my $user_id=$user->id;

#test create
$req = new_request('PUT', "http://localhost/rest/kernel",
                    {name=>'harrypotter',
                     uri=>'myuri',
                     source=>'mysource',
                     created=>'2005-01-01 01:02:03'});
$mech->request($req);

is($mech->status,201,'Status of PUT is 201');

my ($kernel_id) = $mech->content =~ /<kernel.+id="(\d+)"/;
my ($lastmodified) = $mech->content =~ /<kernel.+lastmodified="(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"/;

is_xml($mech->content,qq#<response><kernel name="harrypotter" created="2005-01-01 01:02:03" id="$kernel_id" lastmodified="$lastmodified" source="mysource" uri="myuri" object_url="http://localhost/test/harrypotter" has_children="0">
<containedObjects>
</containedObjects>
</kernel></response># );

# Try and get it back again

$mech->get_ok("/rest/kernel/$kernel_id");
diag($mech->content);
is_xml($mech->content,qq#<response><kernel name="harrypotter" created="2005-01-01 01:02:03" id="$kernel_id" lastmodified="$lastmodified" source="mysource" uri="myuri" object_url="http://localhost/test/harrypotter" has_children="0">
<containedObjects>
</containedObjects>
</kernel></response># );

# update it

$req = new_request('POST', "http://localhost/rest/kernel/$kernel_id",
                    {name=>'fred',
                     uri=>'anotheruri',
                     source=>'anothersource',
                     created=>'2004-02-03 02:03:04'});
$mech->request($req);
$mech->content_lacks('ERROR');
$mech->content_lacks('FORBIDDEN');

$mech->get_ok("/rest/kernel/$kernel_id");
($lastmodified) = $mech->content =~ /<kernel.+lastmodified="(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"/;
is_xml($mech->content,qq#<response><kernel name="fred" created="2004-02-03 02:03:04" id="$kernel_id" lastmodified="$lastmodified" source="anothersource" uri="anotheruri" object_url="http://localhost/test/fred" has_children="0">
<containedObjects>
</containedObjects>
</kernel></response># );

# Test find_or_create with spaces

$req = new_request('GET', "http://localhost/rest/kernel/find_or_create/foo%20bar");

$mech->request($req);
$mech->content_lacks('ERROR');
$mech->content_lacks('FORBIDDEN');

$mech->content_like(qr/name="foo bar"/);

$req = new_request('GET', "http://localhost/rest/kernel/find_or_create/foo%2520bar");

$mech->request($req);
$mech->content_lacks('ERROR');
$mech->content_lacks('FORBIDDEN');

$mech->content_like(qr/name="foo%20bar"/);

# login again with a different user
($mech, $user2) = login_user('test2@tester.scottyallen.com','password','test2');
my $user2_id=$user2->id;

# Try to get someone else's kernel
$mech->get("/rest/kernel/$kernel_id");
$mech->content_contains('FORBIDDEN');

# Try to update someone else's kernel
$req = new_request('POST', "http://localhost/rest/kernel/$kernel_id",
                    {name=>'fred2',
                     uri=>'anotheruri2',
                     source=>'anothersource2',
                     created=>'2004-02-03 02:03:04'});

$mech->request($req);
$mech->content_contains('FORBIDDEN');

# Try to get someone else's kernel's children
$mech->get("/rest/kernel/$kernel_id/children");
$mech->content_contains('FORBIDDEN');

# Try to delete someone else's kernel
$req = new_request('DELETE', "http://localhost/rest/kernel/$kernel_id");
$mech->request($req);
$mech->content_contains('FORBIDDEN');

Notewise::M::CDBI::Kernel->retrieve($kernel_id)->delete;
$user->delete;
$user2->delete;

# vim:ft=perl
