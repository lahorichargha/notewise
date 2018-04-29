#! /bin/sh

echo "Compiling javascript"
perl scripts/compilejs.pl

echo "Updating prereqs"
perl Makefile.PL
make

scripts/unpack.sh
