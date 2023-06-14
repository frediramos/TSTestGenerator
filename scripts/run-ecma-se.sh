#!/usr/bin/env bash

shopt -s expand_aliases
source ~/.bash_profile 

TSFILE=$1
OUTDIR=$2
NAME="$(basename $TSFILE)"
NAME="${NAME%.*}"

JS2ECMA=js2cesl

#Gen symbolic test (.js) for Typescript file
echo "Generating symbolic tests..."
echo "node $TSTGEN $TSFILE $OUTDIR"
tstgen $TSFILE $OUTDIR
echo

#Gen ECMA-Sl file from all the JavaScript tests
echo "Generating ECMA-SL files from JavaScript tests..."

for file in $OUTDIR/Test_$NAME/*.js; do
    OUT="${file%.*}"
    echo "js2cesl -i $file -o $OUT.cesl -interp /usr/local/bin/es6.cesl"
    js2cesl -i $file -o $OUT.cesl -interp /usr/local/bin/es6.cesl
done