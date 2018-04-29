use Test::More tests => 7;
use Test::WWW::Mechanize::Catalyst 'Notewise';
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::C::REST::Search');
use Notewise::TestUtils;
use Test::XML;
use XML::Simple;

ok( request('rest/search')->is_success );

my $mech;
my $user;
my $req;

# login
($mech, $user) = login_user('test@tester.scottyallen.com','password');
my $user_id=$user->id;

# Setup some search results
my @kernels;
push @kernels, Notewise->model('DBIC::Kernel')->create({name=>'asdf',user=>$user->id});
push @kernels, Notewise->model('DBIC::Kernel')->create({name=>'asdffoo',user=>$user->id});
push @kernels, Notewise->model('DBIC::Kernel')->create({name=>'foo asdf',user=>$user->id});
push @kernels, Notewise->model('DBIC::Kernel')->create({name=>'foo asdffoo',user=>$user->id});
is(get_type($kernels[-1]),'kernel', "Kernel has type 'kernel'");

my @notes;
push @notes, Notewise->model('DBIC::Note')->create({container_object=>$kernels[-1]->object_id,content=>'asdf',user=>$user->id});
push @notes, Notewise->model('DBIC::Note')->create({container_object=>$kernels[-1]->object_id,content=>'asdffoo',user=>$user->id});
push @notes, Notewise->model('DBIC::Note')->create({container_object=>$kernels[-1]->object_id,content=>'foo asdf',user=>$user->id});
push @notes, Notewise->model('DBIC::Note')->create({container_object=>$kernels[-1]->object_id,content=>'foo asdffoo',user=>$user->id});
is(get_type($notes[-1]),'note', "Note has type 'note'");

# generated expected xml
my %xml;
foreach my $object (@kernels,@notes){
    my $type = get_type($object);
    $xml{$type} ||= [];
    push @{$xml{$type}}, $object->to_xml_hash;
}
my $xml = XMLout(\%xml, RootName => 'response');


# these shouldn't match
push @kernels, Notewise->model('DBIC::Kernel')->create({name=>'bar baz',user=>$user->id});
push @notes, Notewise->model('DBIC::Note')->create({container_object=>$kernels[-1]->object_id,content=>'bar baz',user=>$user->id});

$req = new_request('GET', 'http://localhost/rest/search/asdf');
$mech->request($req);

$results=sort_inner_alpha($mech->content);
$xml=sort_inner_alpha($xml);
is_xml($results,$xml);

foreach my $object (@notes,@kernels){
    $object->delete;
}
$user->delete;

sub get_type {
    return Notewise::C::REST::Search::get_type(@_);
}

# sort inner lines alphabetically
sub sort_inner_alpha {
    my $text = shift;
    chomp $text;
    my @lines = split /\n/,$text;
    my @inner_lines = @lines[1..($#lines-1)];
    @inner_lines = sort $a cmp $b, @inner_lines;

    return join "\n", ($lines[0],@inner_lines,$lines[-1]);
}

# vim:ft=perl
