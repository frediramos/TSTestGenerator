import * as ts from "typescript";
import * as fs from "fs";
import finder = require("./finder");
import tg = require("./testGenerator");


var prog_info:finder.ProgramInfo = finder.finder(process.argv.slice(2));

var cycles =finder.findCycles(prog_info);

if(cycles.length!==0){
    console.log("Error: Cyclic object construction");
}

else{
    var test = tg.generateTests(prog_info);

    fs.writeFile(process.argv.slice(2)+"-test.js",test, function(err){
        if(err) 
        return console.error(err);
    });
}