#! /usr/bin/perl

use Notewise;

foreach (Notewise::M::CDBI::Kernel->retrieve_all) {
    print $_->id, " ",$_->is_useless, "\n";
    $_->delete if $_->is_useless;
} 
