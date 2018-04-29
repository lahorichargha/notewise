#! /bin/sh

cd mod_perl/
svn up -rHEAD
perl compilejs.pl
echo "updating prereqs"
perl Makefile.PL
sudo make
echo "Restarting apache"
sudo service httpd restart
