#!/bin/bash

red=`tput setaf 1`
green=`tput setaf 2`
yellow=`tput setaf 3`
reset=`tput sgr0`

echo "Running tests"
echo "------------------------"
cd src/
tsc main.ts
for testfile in ../Tests/Tests_class/*.ts; do
    [ -f "$testfile" ] || break
    if node main.js $testfile; then
        echo "${green}$testfile succeeded${reset}"
    else
        echo "${red}$testfile failed${reset}" && exit 1
    fi
    echo "------------------------"
done
for testfile in ../Tests/Tests_cycle/*.ts; do
    [ -f "$testfile" ] || break
    if node main.js $testfile; then
        echo "${green}$testfile succeeded${reset}"
    else
        echo "${red}$testfile failed${reset}" && exit 1
    fi
    echo "------------------------"
done
for testfile in ../Tests/Tests_function/*.ts; do
    [ -f "$testfile" ] || break
    if node main.js $testfile; then
        echo "${green}$testfile succeeded${reset}"
    else
        echo "${red}$testfile failed${reset}" && exit 1
    fi
    echo "------------------------"
done
for testfile in ../Tests/Tests_interface/*.ts; do
    [ -f "$testfile" ] || break
    if node main.js $testfile; then
        echo "${green}$testfile succeeded${reset}"
    else
        echo "${red}$testfile failed${reset}" && exit 1
    fi
    echo "------------------------"
done
for testfile in ../Tests/Tests_structures/*.ts; do
    [ -f "$testfile" ] || break
    if node main.js $testfile; then
        echo "${green}$testfile succeeded${reset}"
    else
        echo "${red}$testfile failed${reset}" && exit 1
    fi
    echo "------------------------"
done
for testfile in ../Tests/Tests_other/*.ts; do
    [ -f "$testfile" ] || break
    if node main.js $testfile; then
        echo "${green}$testfile succeeded${reset}"
    else
        echo "${red}$testfile failed${reset}" && exit 1
    fi
    echo "------------------------"
done
for testfile in ../Tests/Tests_projects/*.ts; do
    [ -f "$testfile" ] || break
    if node main.js $testfile; then
        echo "${green}$testfile succeeded${reset}"
    else
        echo "${red}$testfile failed${reset}" && exit 1
    fi
    echo "------------------------"
done
cd ..
