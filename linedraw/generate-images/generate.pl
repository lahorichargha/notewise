#! /usr/bin/perl -w

use strict;
use GD;
use Template;
use MIME::Base64;

my $percentage_increase = .3;
my $min_size = 5;
my $max_size = 800;
my $IMAGES_FILE = 'images.js';

open(IMAGES_FILE, '>'.$IMAGES_FILE)
    or die "Couldn't open $IMAGES_FILE: $!"; 
print IMAGES_FILE "LineDraw.Line.images = {};\n";

my @lengths;
my $length=$min_size;
while($length < $max_size){
    push @lengths, $length;
    $length += int($length * .3);

    create_image($length,$length*2,'l','png');
    create_image($length*2,$length,'l','png');
    create_image($length,$length*2,'r','png');
    create_image($length*2,$length,'r','png');
}

# create horizontal and vertical images
create_image(1,5,'l','png');
create_image(5,1,'l','png');

# generate js from template
my $tt = Template->new({
        INCLUDE_PATH => '.',
        EVAL_PERL => 1
});

$tt->process('js.tt', {
    lengths => \@lengths
}, 'imagesel.js') || die $tt->error();

sub create_image {
    my ($width,$height,$direction,$type)=@_;
    my $im = new GD::Image($width,$height);
    my $white = $im->colorAllocate(255,255,255);
    my $black = $im->colorAllocate(0,0,0);
    $im->transparent($white);
    $im->setAntiAliased($black);
    if($direction eq 'r'){
        $im->line(0,0,$width-1,$height-1,gdAntiAliased);
    } else {
        $im->line(0,$height-1,$width-1,0,gdAntiAliased);
    }

    # output
    open(IMG,'>'.$direction.$width.'x'.$height.'.'.$type);
    if($type eq 'gif'){
        print IMG $im->gif;
    } else {
        print IMG $im->png;
    }
    my $base64 = encode_base64($im->png);
    $base64 =~ s/\n//g;
    print IMAGES_FILE "LineDraw.Line.images['".$direction.$width."x$height.$type']='data:image/png;base64,$base64';\n\n";
}
