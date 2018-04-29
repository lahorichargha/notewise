use Test::More tests => 9;
use Notewise::TestUtils;
use Test::WWW::Mechanize::Catalyst 'Notewise';
use_ok( Catalyst::Test, 'Notewise' );
use_ok('Notewise::M::CDBI::ContainedObject');

($mech, $user) = login_user('test@tester.scottyallen.com','password','test');
my $kernel = Notewise::M::CDBI::Kernel->create({user=>$user->id});
my $kernel2 = Notewise::M::CDBI::Kernel->create({user=>$user->id});
my $kernel2_id = $kernel2->id;
my $contained_object = Notewise::M::CDBI::ContainedObject->create({container_object => $kernel->object_id,
                                                                   contained_object => $kernel2->object_id});

$contained_object->delete();                                                           
my $kernel2 = Notewise::M::CDBI::Kernel->retrieve($kernel2_id);
is($kernel2, undef, 'Useless kernels get deleted when only contained object is deleted');

# notes

$kernel2 = Notewise::M::CDBI::Kernel->create({user=>$user->id});
$kernel2_id = $kernel2->id;

my $note = Notewise::M::CDBI::Note->create({container_object=>$kernel2->object_id,
                                            content=>'foo',
                                            user=>$user});
$contained_object = Notewise::M::CDBI::ContainedObject->create({container_object => $kernel->object_id,
                                                                contained_object => $kernel2->object_id});

$contained_object->delete();                                                           
my $kernel2 = Notewise::M::CDBI::Kernel->retrieve($kernel2_id);
isnt($kernel2, undef, "Kernels don't get deleted when contained object is deleted if they have notes");

# rels

$kernel3 = Notewise::M::CDBI::Kernel->create({user=>$user->id});
$kernel3_id = $kernel3->id;

my $rel = Notewise::M::CDBI::Relationship->create({user=>$user->id,
                                                   part1=>$kernel3->object_id,
                                                   part2=>$kernel2->object_id});

$contained_object = Notewise::M::CDBI::ContainedObject->create({container_object => $kernel->object_id,
                                                                contained_object => $kernel3->object_id});

$contained_object->delete();                                                           
my $kernel3 = Notewise::M::CDBI::Kernel->retrieve($kernel3_id);
isnt($kernel3, undef, "Kernels don't get deleted when contained object is deleted if they have rels");

# other parents

$kernel4 = Notewise::M::CDBI::Kernel->create({user=>$user->id});
$kernel4_id = $kernel4->id;

$contained_object = Notewise::M::CDBI::ContainedObject->create({container_object => $kernel->object_id,
                                                                contained_object => $kernel4->object_id});

my $contained_object2 = Notewise::M::CDBI::ContainedObject->create({container_object => $kernel2->object_id,
                                                                contained_object => $kernel4->object_id});

$contained_object->delete();                                                           
my $kernel4 = Notewise::M::CDBI::Kernel->retrieve($kernel4_id);
isnt($kernel4, undef, "Kernels don't get deleted when contained object is deleted if they have other parents");

# a name

$kernel5 = Notewise::M::CDBI::Kernel->create({user=>$user->id,name=>'foo'});
$kernel5_id = $kernel5->id;

$contained_object = Notewise::M::CDBI::ContainedObject->create({container_object => $kernel->object_id,
                                                                contained_object => $kernel5->object_id});
$contained_object->delete();                                                           
my $kernel5 = Notewise::M::CDBI::Kernel->retrieve($kernel5_id);
isnt($kernel5, undef, "Kernels don't get deleted when contained object is deleted if they have a name");

# children

$kernel6 = Notewise::M::CDBI::Kernel->create({user=>$user->id});
$kernel6_id = $kernel6->id;

$contained_object = Notewise::M::CDBI::ContainedObject->create({container_object => $kernel->object_id,
                                                                contained_object => $kernel6->object_id});

$contained_object2 = Notewise::M::CDBI::ContainedObject->create({container_object => $kernel6->object_id,
                                                                contained_object => $kernel2->object_id});

$contained_object->delete();                                                           
my $kernel6 = Notewise::M::CDBI::Kernel->retrieve($kernel6_id);
isnt($kernel6, undef, "Kernels don't get deleted when contained object is deleted if they have children");

# cleanup

#$user->delete;

# vim:ft=perl
