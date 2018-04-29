use Test::More tests => 23;
use Test::XML;
use Test::WWW::Mechanize::Catalyst 'Notewise';
use Notewise::TestUtils;
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::C::REST::Note');

ok( request('rest/note')->is_success );


my $mech;
my $user;

# login
($mech, $user) = login_user('test@tester.scottyallen.com','password');
my $user_id=$user->id;

my $req;

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

#test create

$req = new_request('PUT', "http://localhost/rest/note",
                    {container_object=>$kernel_id,
                     content=>"a test note\na new line",
                     source=>'myuri',
                     created=>'2005-01-01 01:02:03',
                     lastModified=>'2005-02-02 03:04:05',
                     x=>100,
                     y=>200,
                     width=>300,
                     height=>400 });
$mech->request($req);

is($mech->status,201,'Status of PUT is 201');

my ($note_id) = $mech->content =~ /<note.+id="(\d+)"/;

is_xml($mech->content,qq#<response><note id="$note_id" container_object="$kernel_id" created="2005-01-01 01:02:03" height="400" lastmodified="2005-02-02 03:04:05" source="myuri" width="300" x="100" y="200">a test note\na new line
</note>
</response>#,"check PUT result");

# Try and get it back again

$mech->get_ok("/rest/note/$note_id");
is_xml($mech->content,qq#<response><note id="$note_id" container_object="$kernel_id" created="2005-01-01 01:02:03" height="400" lastmodified="2005-02-02 03:04:05" source="myuri" width="300" x="100" y="200">a test note\na new line
</note>
</response>#,"check PUT result");

#test create with no created date or lastmodified

$req = new_request('PUT', "http://localhost/rest/note",
                    {container_object=>$kernel_id,
                     content=>"another test note\na new line",
                     source=>'myuri',
                     x=>100,
                     y=>200,
                     width=>300,
                     height=>400 });
$mech->request($req);

is($mech->status,201,'Status of PUT is 201');

my ($note2_id) = $mech->content =~ /<note.+id="(\d+)"/;
my ($created) = $mech->content =~ /<note.+created="(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"/;
my ($lastmodified) = $mech->content =~ /<note.+lastmodified="(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"/;

is_xml($mech->content,qq#<response><note id="$note2_id" container_object="$kernel_id" created="$created" height="400" lastmodified="$lastmodified" source="myuri" width="300" x="100" y="200">another test note\na new line
</note>
</response>#,"check PUT result with no created or lastmodified");
$req = new_request('DELETE', "http://localhost/rest/note/$note2_id");

#test create with no content

$req = new_request('PUT', "http://localhost/rest/note",
                    {container_object=>$kernel_id,
                     source=>'myuri',
                     x=>100,
                     y=>200,
                     width=>300,
                     height=>400 });
$mech->request($req);

is($mech->status,201,'Status of PUT is 201');

my ($note3_id) = $mech->content =~ /<note.+id="(\d+)"/;
my ($created) = $mech->content =~ /<note.+created="(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"/;
my ($lastmodified) = $mech->content =~ /<note.+lastmodified="(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"/;

is_xml($mech->content,qq#<response><note id="$note3_id" container_object="$kernel_id" created="$created" height="400" lastmodified="$lastmodified" source="myuri" width="300" x="100" y="200"></note>
</response>#,"check PUT result with no content");
$req = new_request('DELETE', "http://localhost/rest/note/$note3_id");

# update it

$req = new_request('POST', "http://localhost/rest/note/$note_id",
                    {container_object=>$kernel2_id,
                     content=>"a test note\nwith a new line",
                     source=>'myuri2',
                     x=>500,
                     y=>600,
                     width=>700,
                     height=>800 });
$mech->request($req);
$mech->content_lacks('ERROR');
$mech->content_lacks('FORBIDDEN');

$mech->get_ok("/rest/note/$note_id");

($lastmodified) = $mech->content =~ /<note.+lastmodified="(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"/;

is_xml($mech->content,qq#<response><note id="$note_id" container_object="$kernel2_id" created="2005-01-01 01:02:03" height="800" lastmodified="$lastmodified" source="myuri2" width="700" x="500" y="600">a test note\nwith a new line
</note>
</response>#,"check PUT result");

# TODO test attempt to update created or last modified

### Test permissions
# login a different user
$mech = Test::WWW::Mechanize::Catalyst->new; #wipe our cookies
($mech, $user2) = login_user('test2@tester.scottyallen.com','password','test2');
my $user2_id=$user2->id;

$req = new_request('PUT', "http://localhost/rest/note",
                    {container_object=>$kernel_id,
                     content=>"a test note\na new line",
                     source=>'myuri',
                     created=>'2005-01-01 01:02:03',
                     lastmodified=>'2005-02-02 03:04:05',
                     x=>100,
                     y=>200,
                     width=>300,
                     height=>400 });
$mech->request($req);
is($mech->status,403,'Status of PUT is 403');
$mech->content_is("FORBIDDEN - user $user2_id isn't the owner of object $kernel_id", "adding notes to other users' kernels is forbidden");

$req = new_request('POST', "http://localhost/rest/note/$note_id",
                    {container_object=>$kernel_id,
                     content=>"a test note\nwith a new line",
                     source=>'myuri',
                     created=>'2005-01-01 01:02:03',
                     lastmodified=>'2005-02-02 03:04:05',
                     x=>100,
                     y=>200,
                     width=>300,
                     height=>500 });
$mech->request($req);
is($mech->status,403,'Status of POST is 403');
$mech->content_is("FORBIDDEN - user $user2_id isn't the owner of object $note_id", "updating notes to other users' kernels is forbidden");

$req = new_request('DELETE', "http://localhost/rest/note/$note_id");
$mech->request($req);
is($mech->status,403,'Status of DELETE is 403');
$mech->content_is("FORBIDDEN - user $user2_id isn't the owner of object $note_id", "deleting other users' notes is forbidden");

# Cleanup

Notewise::M::CDBI::Note->retrieve($note_id)->delete;
Notewise::M::CDBI::Kernel->retrieve($kernel_id)->delete;
Notewise::M::CDBI::Kernel->retrieve($kernel2_id)->delete;
$user->delete;
$user2->delete;

# vim:filetype=perl
