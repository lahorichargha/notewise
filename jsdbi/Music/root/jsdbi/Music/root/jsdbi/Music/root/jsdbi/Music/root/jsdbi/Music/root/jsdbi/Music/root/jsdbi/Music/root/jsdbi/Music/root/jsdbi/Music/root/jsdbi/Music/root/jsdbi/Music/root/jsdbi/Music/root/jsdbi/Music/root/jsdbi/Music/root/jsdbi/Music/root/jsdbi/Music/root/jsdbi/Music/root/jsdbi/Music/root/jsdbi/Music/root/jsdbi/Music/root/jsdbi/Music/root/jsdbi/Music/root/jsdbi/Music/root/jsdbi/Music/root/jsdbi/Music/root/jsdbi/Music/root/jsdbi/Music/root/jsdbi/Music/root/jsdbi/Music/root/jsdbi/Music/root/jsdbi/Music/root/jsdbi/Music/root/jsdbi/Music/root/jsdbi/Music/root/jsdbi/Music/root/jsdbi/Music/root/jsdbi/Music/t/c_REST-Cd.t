
use Test::More tests => 6;
use Test::WWW::Mechanize::Catalyst 'Music';
use Test::XML;
use_ok( Catalyst::Test, 'Music' );
use_ok('Music::C::REST::Cd');

ok( request('rest/cd')->is_success );

my $mech = Test::WWW::Mechanize::Catalyst->new;

# Test creating a new object
$req = new_request('PUT', 'http://localhost/rest/cd', {title=>'Jail House Rock', year=> '1954', artist=>5});
$mech->request($req);

is($mech->status,201,'Status of PUT is 201');

$mech->content =~ m#cdid="(\d+)"#;
my $cdid=$1;
ok($cdid  > 0, 'cd id is greater than zero');

is_xml($mech->content, qq#<response><cd artist="5" title="Jail House Rock" year="1954" cdid="$cdid"/></response>#);

Music::M::CDBI::Cd->retrieve($cdid)->delete;

## Test retrieving an object
#$req = new HTTP::Request("GET", "http://localhost/rest/artist/$artistid");
#$mech->request($req);
#$mech->content_is(
#"<response>
#  <artist name=\"U2\" artistid=\"$artistid\" />
#</response>
#");
#is($mech->status,200,'Status of GET is 200');
#
## Test updating an object
#$req = new_request('POST', "http://localhost/rest/artist/$artistid", {name=>'U3'});
#$mech->request($req);
#$mech->content_is(
#"<response>
#  <artist name=\"U3\" artistid=\"$artistid\" />
#</response>
#");
#$req = new HTTP::Request("GET", "http://localhost/rest/artist/$artistid");
#$mech->request($req);
#$mech->content_is(
#"<response>
#  <artist name=\"U3\" artistid=\"$artistid\" />
#</response>
#");
#
## Test updating an object that doesn't exist
#$req = new_request('POST', "http://localhost/rest/artist/0", {name=>'U3'});
#$mech->request($req);
#is($mech->status,404,'Status of POST is 404 on nonexistant object');
#
## Test delete an object
#$req = new HTTP::Request('DELETE', "http://localhost/rest/artist/$artistid");
#$mech->request($req);
#$mech->content_is('OK');
#is($mech->status,200,'Status of DELETE is 200');
#
#$req = new HTTP::Request("GET", "http://localhost/rest/artist/$artistid");
#$mech->request($req);
#is($mech->status,404,'Status after delete is 404');
#
#
sub new_request {
    my($type,$url,$params) = @_;
    $req = new HTTP::Request($type, $url);
    if($params){
        $req->header('Content-Type' => 'application/x-www-form-urlencoded');
        my $content;
        foreach my $key (keys %$params){
            if($content){
                $content .= "&$key=$params->{$key}";
            } else {
                $content .= "$key=$params->{$key}";
            }
        }
        $req->content($content);
        $req->header('Content-Length' => length($content));
    }
    return $req;
}

## vim:ft=perl
