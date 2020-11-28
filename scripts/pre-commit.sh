#!/usr/bin/env bash

echo "Running pre-commit hook"
./scripts/run-tests.sh

# $? stores exit value of the last command
if [ $? -ne 0 ]; then
 echo "Test failed! Commit aborted"
 rm -rf Tests/Tests_clean/*.js
 rm -rf Tests/Tests_error/*.js
 rm -rf Tests/Tests_unsupported/*.js
 rm -rf src/Test_*
 rm src/*.js
 exit 1
fi

rm -rf Tests/Tests_clean/*.js
rm -rf Tests/Tests_error/*.js
rm -rf Tests/Tests_unsupported/*.js
rm -rf src/Test_*
rm src/*.js