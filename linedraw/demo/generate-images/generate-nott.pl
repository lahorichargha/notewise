#! /usr/bin/perl -w

use strict;
use GD;

my @lengths = qw(100 400 800); # must be increasing
my @angles = qw(86.5 83 76 45 14 7 3.5 2 1); # degrees
my @cutoff_lengths;
my @cutoff_ratios;
my $JS_FILE = 'imagesel.js';

my $prev_length;
foreach my $length (@lengths){
    if($prev_length){
        push @cutoff_lengths, (($length - $prev_length)/2 + $prev_length);
    }
    $prev_length=$length;

}
push @cutoff_lengths, -1;

my $prev_ratio;
foreach my $angle (@angles){
    warn "angle: $angle";
    my $width=int(100 * cos($angle*2*3.1415/360));
    my $height=int(100 * sin($angle*2*3.1415/360));
    my $ratio = $width/$height;
    warn "ratio: $ratio";
    if($prev_ratio){
        push @cutoff_ratios, (($ratio - $prev_ratio)/2 + $prev_ratio);
    }
    $prev_ratio=$ratio;
}
push @cutoff_ratios, -1;

print "@cutoff_lengths\n";
print "@cutoff_ratios\n";

open(JS_FILE, '>'.$JS_FILE)
    or die "Couldn't open $JS_FILE: $!"; 
my $i=0;
foreach my $length (@lengths){
    if($cutoff_lengths[$i] > 0){
        print JS_FILE "if(length < ".($cutoff_lengths[$i])."){\n";
    } else {
        print JS_FILE "{\n";
    }
    my $j=0;
    print JS_FILE <<END;
    if(ratio < 0.02){
        // this is a special case, since this image is only one pixel
        // wide, and thus can't be stretched at all horizontally.  So we just
        // pretend they wanted a vertical line, and average the x's
        w=1;
        this.img.style.width=w+"px";
        x = (this.x1+this.x2)/2;
        this.img.src=imageDir+'/l1x5.png';
END
    print JS_FILE "    }";
    foreach my $angle (@angles){
        next if $cutoff_ratios[$j] < 0;
        print JS_FILE " else if(ratio < ".sprintf("%0.2f",$cutoff_ratios[$j])."){\n";
        my $width=int($length * cos($angle*2*3.1415/360));
        my $height=int($length * sin($angle*2*3.1415/360));
        create_image($width,$height,'r','png');
        #create_image($width,$height,'r','gif');
        create_image($width,$height,'l','png');
        #create_image($width,$height,'l','gif');
        print JS_FILE "        this.img.src=imageDir+'/'+direction+'".$width."x".$height.".png';\n";

        print JS_FILE "    }";
        $j++;
    }
    print JS_FILE <<END;
    else {
        // this is a special case, since this image is only one pixel
        // high, and thus can't be stretched at all vertially.  So we just
        // pretend they wanted a horizontal line, and average the y's
        h=1;
        this.img.style.height=h+"px";
        y = (this.y1+this.y2)/2;
        this.img.src=imageDir+'/l5x1.png';
    }
END
    if($cutoff_lengths[$i] > 0){
        print JS_FILE "\n} else ";
    } else {
        print JS_FILE "\n}\n";
    }
    $i++;
}

# create horizontal and vertical images
create_image(1,5,'l','png');
create_image(5,1,'l','png');


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
}
