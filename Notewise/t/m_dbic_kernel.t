use Test::More tests => 15;
use_ok( Catalyst::Test, 'Notewise' );
use Data::Dumper;
local $Data::Dumper::Maxdepth = 3;
use strict;
use warnings;

# setup

# delete any stale test users
map $_->delete, Notewise->model('DBIC::User')->search({email=>'fred@flintstone.com'})->all;
map $_->delete, Notewise->model('DBIC::User')->search({email=>'fred2@flintstone.com'})->all;

my $user = Notewise->model('DBIC::User')->create({name=>'Fred Flintstone1',email=>'fred@flintstone.com',password=>'password',username=>'fred'});
my $user2 = Notewise->model('DBIC::User')->create({name=>'Fred Flintstone2',email=>'fred2@flintstone.com',password=>'password',username=>'fred2'});
my $kernel = Notewise->model('DBIC::Kernel')->create({name=>'foo', user=>$user});

#tests

isnt($kernel->object_id, 0, 'object exists');
$kernel = Notewise->model('DBIC::Kernel')->find($kernel->object_id->id);
is($kernel->user->id, $user->id, 'user id is correct after kernel rehydration');


# Test that when a kernel is deleted, so is the object_id

my $kernel_to_delete = Notewise->model('DBIC::Kernel')->create({name=>'foo',user=>$user->id});
my $kernel_id = $kernel_to_delete->object_id->id;
$kernel_to_delete->delete;
my $object_id = Notewise->model('DBIC::ObjectId')->find($kernel_id);
is($object_id,undef,'object_id is deleted when kernel is deleted');

# test url generation

is($kernel->relative_url, 'fred/foo','test relative_url');
$kernel->name('This is a name with  spaces ');
$kernel->update;
is($kernel->relative_url, 'fred/This_is_a_name_with__spaces','test relative_url 2 - spaces');
$kernel->name('This is a name with /slashes ');
$kernel->update;
is($kernel->relative_url, 'fred/This_is_a_name_with_%2Fslashes','test relative_url 3 - slashes');
$kernel->name('This is a name with ?question marks ');
$kernel->update;
is($kernel->relative_url, 'fred/This_is_a_name_with_%3Fquestion_marks','test relative_url 4 - question marks');
# test permissions
ok($kernel->has_permission($user->id,'view'), "users can view their own kernel");
ok($kernel->has_permission($user->id,'modify'), "users can modify their own kernel");
ok($kernel->has_permission($user->id,'delete'), "users can delete their own kernel");
ok(!$kernel->has_permission($user2->id,'view'), "other users can't view other users' kernels");
ok(!$kernel->has_permission($user2->id,'modify'), "other users can't view other users' kernels");
ok(!$kernel->has_permission($user2->id,'delete'), "other users can't view other users' kernels");


# test visible_relationships
my $kernel2 = Notewise->component('DBIC::Kernel')->create({name=>'onfoo1',user=>$user});
my $kernel3 = Notewise->component('DBIC::Kernel')->create({name=>'onfoo2',user=>$user});
my $note1 = Notewise->component('DBIC::Note')->create({container_object=>$kernel->object_id,
                                             content=>'onfoo3',
                                             x=>10,
                                             y=>10,
                                             width=>10,
                                             height=>10,
                                             user=>$user});
my $kernel4 = Notewise->component('DBIC::Kernel')->create({name=>'offfoo1',user=>$user});
my $note2 = Notewise->component('DBIC::Note')->create({container_object=>$kernel4->object_id,
                                             content=>'offfoo2',
                                             x=>10,
                                             y=>10,
                                             width=>10,
                                             height=>10,
                                             user=>$user});
my $contained_object =
    Notewise->component('DBIC::ContainedObject')->create({container_object=>$kernel->object_id,
                                                contained_object=>$kernel2->object_id,
                                                x=>10,
                                                y=>10,
                                                width=>10,
                                                height=>10});
my $contained_object2 =
    Notewise->component('DBIC::ContainedObject')->create({container_object=>$kernel->object_id,
                                                contained_object=>$kernel3->object_id,
                                                x=>10,
                                                y=>10,
                                                width=>10,
                                                height=>10});

my $rel1 = Notewise->component('DBIC::Relationship')->create({part1=>$kernel2->object_id,
                                                    part2=>$kernel3->object_id,
                                                    nav=>'non'});
my $rel2 = Notewise->component('DBIC::Relationship')->create({part1=>$kernel2->object_id,
                                                    part2=>$note1->object_id,
                                                    nav=>'non'});
my $rel3 = Notewise->component('DBIC::Relationship')->create({part1=>$kernel2->object_id,
                                                    part2=>$kernel4->object_id,
                                                    nav=>'non'});
my $rel4 = Notewise->component('DBIC::Relationship')->create({part1=>$kernel2->object_id,
                                                    part2=>$note2->object_id,
                                                    nav=>'non'});


my @visible_rels = $kernel->visible_relationships;

is_deeply([sort (map $_->id, @visible_rels)],[sort($rel1->id,$rel2->id)]);

# cleanup
$user2->delete;
$user->delete;

# vim:ft=perl
