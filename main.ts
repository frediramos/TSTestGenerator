import * as ts from "typescript";
import * as fs from "fs";
import finder = require("./finder");
import tg = require("./testGenerator");


var prog_info:finder.ProgramInfo = finder.finder(process.argv.slice(2));

var cycles =finder.findCycles(prog_info);

if(cycles[0]!==undefined){
    console.log("Error: Cyclic object construction");
}

else{

    var file_code:string;
    try {
        file_code = fs.readFileSync(process.argv.slice(2)[0], 'utf8');
    } catch(e) {
        console.log('Error:', e.stack);
    }


    var test = tg.generateTests(prog_info);

    fs.writeFile(process.argv.slice(2)[0].split(".")[0]+"-test.js",file_code+"\n\n\n"+test, function(err){
        if(err) 
        return console.error(err);
    });
}