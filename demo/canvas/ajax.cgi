#! /usr/bin/perl

use strict;
use warnings;
use CGI;

print CGI::header({type=>'text/xml'}), '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

print <<END;
<kernel name="foobar" x="50" y="50" w="100" h="100" id="42">
</kernel>
END
