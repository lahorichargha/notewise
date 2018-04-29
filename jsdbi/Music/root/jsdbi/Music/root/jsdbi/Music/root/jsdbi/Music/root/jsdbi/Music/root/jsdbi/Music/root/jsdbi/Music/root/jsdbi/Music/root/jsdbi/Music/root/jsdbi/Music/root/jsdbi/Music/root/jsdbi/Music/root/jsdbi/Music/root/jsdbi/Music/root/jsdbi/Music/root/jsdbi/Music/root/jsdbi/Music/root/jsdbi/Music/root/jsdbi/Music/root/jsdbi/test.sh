#! /bin/bash

cd Music
if [ ! -f 'sqlite-db' ]; then
    sqlite3 sqlite-db < schema.sql
fi
script/music_server.pl -p 3004&
sleep 3
serverpid=$!
cd ..
firefox "http://localhost:3004/jsunit/testRunner.html?testPage=/jsdbi/jsunit-test.html&autoRun=true"
echo "Press a enter to kill the server when you are finished testing"
read
kill $!
