#!/bin/bash

echo Transpiling to JS...
tsc src/main.ts
echo >> ~/.bash_profile 
echo "alias tstgen=\"node $PWD/src/main.js\"" >> ~/.bash_profile 
source ~/.bash_profile 
echo \'tstgen\' sym link created


if [ "$1" == "-test" ]; then
    echo
    ./scripts/run-tests.sh
    if [ $? -ne 0 ]; then
        echo Installation FAIL
        exit
    fi
fi

echo 'tstgen' installed successfully
echo
echo 'run tstgen <file>.ts'