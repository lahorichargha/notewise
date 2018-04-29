#! /usr/bin/perl

use lib qw(blib/lib blib/arch);
use strict;
use warnings;
use Template;
use FindBin;

compile_javascript();

sub compile_javascript {
    my $self = shift;

    my $pwd = $FindBin::Bin;

    my $template = Template->new({
        INCLUDE_PATH => "$pwd/../root",
        EVAL_PERL => 1
    });

    warn "Compiling javascript to javascript.js\n";
    $template->process('javascript.tt', {}, 'root/js/javascript.js') or die $template->error();
    warn "Minifying to javascript-min.js\n";
    system("java -jar $pwd/custom_rhino.jar -c js/javascript.js > js/javascript-min.js");
}
