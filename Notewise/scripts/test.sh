#!/bin/bash

# Runs all the jsunit tests, acceptance tests, and perl unit tests.

# start notewise dev server on port 4000
echo "Starting notewise development server"
scripts/notewise_server.pl -p 4000 -k &
SERVER_PID=$!

# start framebuffer
#Xvfb :2 -screen 0 1024x768x24 >/dev/null 2>/dev/null &
#XVFB_PID=$!
vncserver :2
export DISPLAY=:2

# wait for everything to startup
READY=0
while (( $READY == 0 ))
do
    curl http://localhost:4000 >/dev/null 2>/dev/null
    RETURN=$?
    if (( $RETURN == 0 ))
    then
        READY=1
    else
        sleep 5
    fi
done
echo "Server started"

# launch jsunit
cd root/jsunit
ant standalone_test
ANT_EXIT_CODE=$?

# setup server to receive results from selenium

cd ../..
firefox "http://localhost:4000/test/selenium/core/TestRunner.html?test=..%2F..%2Facceptance%2Ftests.html&auto=true&close=true&resultsUrl=http://localhost:8000/postResults" &
scripts/selenium_results_server.pl /tmp/selenium-$$

echo "kill $SERVER_PID $XVFB_PID"
kill $SERVER_PID $XVFB_PID
pkill gconfd-2
sleep 5
pkill firefox

echo
echo
if (( $ANT_EXIT_CODE == 0 ))
then
    echo "JsUnit tests PASSED"
else
    echo "JsUnit tests FAILED"
fi

PASSES=`perl -ne 'print "$1\n" if /numTestPasses: ([0-9]+)/' /tmp/selenium-$$`
FAILURES=`perl -ne 'print "$1\n" if /numTestFailures: ([0-9]+)/' /tmp/selenium-$$`
if (( $FAILURES == 0 ))
then
    echo "Selenium PASSED: $PASSES tests"
else
    echo "Selenium FAILED: $FAILURES/$PASSES"
    echo "Selenium log: /tmp/selenium-$$"
fi
