use Test::More tests => 25;
use Test::XML;
use Test::WWW::Mechanize::Catalyst 'Notewise';
use Notewise::TestUtils;
use_ok('Notewise::C::REST::ContainedObject');
use_ok('Notewise::C::REST::VKernel');

my $mech;
my $user;
# login
($mech, $user) = login_user('test@tester.scottyallen.com','password','test');
my $user_id=$user->id;

# create a dummy kernel
my $container = Notewise::M::CDBI::Kernel->create({user=>$user_id});
my $container_id = $container->id;

# Create a contained object
$req = new_request('PUT', "http://localhost/rest/vkernel",
                    {container_object=>$container_id,
                     x=>100,
                     y=>200,
                     width=>300,
                     height=>400,
                     collapsed=>1});
$mech->request($req);
$mech->content_like(qr/<kernel.+id="(\d+)"/);

my ($kernel_id) = $mech->content =~ /<kernel.+id="(\d+)"/;

isnt($kernel_id,0,"kernel id isn't zero");

$mech->get_ok("http://localhost/rest/vkernel/$container_id/$kernel_id");
($created) = $mech->content =~ /<kernel.+created="(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"/;
($lastmodified) = $mech->content =~ /<kernel.+lastmodified="(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})"/;
is_xml($mech->content,qq#<response><visiblekernel collapsed="1" contained_object="$kernel_id" container_object="$container_id" height="400" width="300" x="100" y="200">
<kernel name="" created="$created" id="$kernel_id" lastmodified="$lastmodified" source="" uri="" user="$user_id" object_url="http://localhost/test//$kernel_id" has_children="0"/>
</visiblekernel></response># );

# Try updating it

$req = new_request('POST', "http://localhost/rest/vkernel/$container_id/$kernel_id",
                    { container_object=>$container_id,
                      contained_object=>$kernel_id,
                      x=>400,
                      y=>500,
                      width=>600,
                      height=>700,
                      collapsed=>0});
$mech->request($req);
is($mech->status,200,'Status of POST is 200');
$mech->content_is('OK');

### Test permissions
# login a different user
($mech, $user2) = login_user('test2@tester.scottyallen.com','password');
my $user2_id=$user2->id;

# Try adding to a kernel that isn't owned by this user
$req = new_request('PUT', "http://localhost/rest/vkernel",
                    {container_object=>$container_id,
                     x=>100,
                     y=>200,
                     width=>300,
                     height=>400,
                     collapsed=>1});
$mech->request($req);
is($mech->status,403,'Status of PUT is 403');
$mech->content_is("FORBIDDEN - You can't create that contained object because you do not have permission to modify $container_id", "adding to other users' kernels is forbidden");

# Try modifying a kernel that isn't owned by this user
$req = new_request('POST', "http://localhost/rest/vkernel/$container_id/$kernel_id",
                    {container_object=>$container_id,
                     contained_object=>$kernel_id,
                     x=>100,
                     y=>200,
                     width=>300,
                     height=>400,
                     collapsed=>1});
$mech->request($req);
is($mech->status,403,'Status of POST is 403');
$mech->content_is("FORBIDDEN - You do not have permission to modify $container_id", "updating other users' contained objects is forbidden");

# Try adding someone else's kernel to your own kernel
my $container2 = Notewise::M::CDBI::Kernel->create({user=>$user2_id});
my $container2_id = $container2->id;
$req = new_request('PUT', "http://localhost/rest/vkernel",
                    {container_object=>$container2_id,
                     contained_object=>$kernel_id,
                     x=>100,
                     y=>200,
                     width=>300,
                     height=>400,
                     collapsed=>1});
$mech->request($req);
is($mech->status,403,'Status of PUT is 403');
$mech->content_is("FORBIDDEN - You can't create that contained object because you do not have permission to view $kernel_id", "adding someone else's kernel to your own is forbidden (currently)");
$container2->delete;

# test view permissions
$req = new_request('GET', "http://localhost/rest/vkernel/$container_id/$kernel_id");
$mech->request($req);
is($mech->status,403,'Status of GET is 403');
$mech->content_is("FORBIDDEN - You do not have access to view contained object $container_id/$kernel_id", "viewing other users' contained objects is forbidden");

# test deletion permissions
$req = new_request('DELETE', "http://localhost/rest/vkernel/$container_id/$kernel_id");
$mech->request($req);
is($mech->status,403,'Status of DELETE is 403');
$mech->content_is("FORBIDDEN - You do not have permission to delete $container_id/$kernel_id", "deleting other users' kernels is forbidden");

### test allowed deletion
($mech, $user) = login_user('test@tester.scottyallen.com','password');
$req = new_request('DELETE', "http://localhost/rest/vkernel/$container_id/$kernel_id");
$mech->request($req);
is($mech->status,200,'Status of DELETE is 200');
$mech->content_is("OK", "delete our own kernel");

# try getting it again
$req = new_request('GET', "http://localhost/rest/vkernel/$container_id/$kernel_id");
$mech->request($req);
is($mech->status,404,'Status of GET is 404');
$mech->content_is("ERROR - contained object $container_id/$kernel_id was not found", "object is truely deleted");

# Cleanup

map $_->delete, Notewise::M::CDBI::ContainedObject->search(contained_object=>$kernel_id);
$container->delete;
$user->delete;
$user2->delete;

# vim:ft=perl
