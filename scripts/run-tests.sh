#!/bin/bash

red=`tput setaf 1`
green=`tput setaf 2`
yellow=`tput setaf 3`
reset=`tput sgr0`

echo "Running pre-commit tests"
echo "------------------------"
cd src/
tsc main.ts
for testfile in ../Tests/Tests_clean/*.ts; do
    [ -f "$testfile" ] || break
    if node main.js $testfile; then
        echo "${green}$testfile succeeded${reset}"
    else
        echo "${red}$testfile failed${reset}" && exit 1
    fi
    echo "------------------------"
done
rm -rf ../Tests/Tests_clean/*.js
for testfile in ../Tests/Tests_error/*.ts; do
    [ -f "$testfile" ] || break
    if node main.js $testfile; then
        echo "${green}$testfile succeeded${reset}"
    else
        echo "${red}$testfile failed${reset}" && exit 1
    fi
    echo "------------------------"
done
rm -rf ../Tests/Tests_error/*.js
for testfile in ../Tests/Tests_unsupported/*.ts; do
    [ -f "$testfile" ] || break
    if node main.js $testfile; then
        echo "${green}$testfile succeeded${reset}"
    else
        echo "${yellow}$testfile still unsupported${reset}"
    fi
    echo "------------------------"
done
rm -rf ../Tests/Tests_unsupported/*.js
rm -rf Test_*
rm *.js
cd ../scripts
