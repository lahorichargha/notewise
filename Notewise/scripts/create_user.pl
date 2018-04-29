#! /usr/bin/perl

use strict;
use warnings;

use PAR 'par_files/*.par';
use lib qw(lib DBD-mysql/blib/lib DBD-mysql/blib/arch);
use Notewise;

local $|;
my ($username,$name,$email,$password);

print "\n\n\n";
while (!$username){
    print "Username: ";
    $username = <>;
    chomp $username;
}
while (!$name){
    print "Full name: ";
    $name = <>;
    chomp $name;
}
while (!$email){
    print "Email: ";
    $email = <>;
    chomp $email;
}
while (!$password){
    print "Password: ";
    $password = <>;
    chomp $password;
}


my $user = Notewise::M::CDBI::User->insert({username=>$username,
                                            name    =>$name,
                                            email   =>$email,
                                            password   =>$password,
                                           });

my $kernel = Notewise::M::CDBI::Kernel->insert({name=>'start',
                                                user=>$user});

if ($user && $kernel){
    print "User was successfully created\n";
    exit(0);
} else {
    print "Error creating user!\n";
    exit(1);
}
