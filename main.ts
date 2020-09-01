import * as ts from "typescript";
import * as fs from "fs";
import finder = require("./finder");
import tg = require("./testGenerator");
const { execSync } = require("child_process");

//Compiling file that is being tested
var command = "tsc "+process.argv.slice(2)[0];
execSync(command, (err, stdout, stderr) => {
if (err) return;
});

//Retrieving the program information using the finder
var prog_info:finder.ProgramInfo = finder.finder(process.argv.slice(2));

//Checking for cyclic constructions
var cycles =finder.findCycles(prog_info);

if(cycles[0]!==undefined){
    console.log("Error: Cyclic object construction");
}

else{

    //Getting the code from the Typescript file that is being tested
    var file_code:string;
    try {
        file_code = fs.readFileSync(process.argv.slice(2)[0], 'utf8');
    } catch(e) {
        console.log('Error:', e.stack);
    }

    //Getting the code from the compiled file that is being tested
    var file_code_comp:string;
    try {
        file_code_comp = fs.readFileSync(process.argv.slice(2)[0].split(".")[0]+".js", 'utf8');
    } catch(e) {
        console.log('Error:', e.stack);
    }

    //Tests generation
    var test = tg.generateTests(prog_info);

    //Writing the Typescript file, the compiled file and the tests in an output file
    fs.writeFile(process.argv.slice(2)[0].split(".")[0]+"-test.js",
    "/* \n=====Typescript file that is being tested=====\n\n"+file_code+
    "\n*/\n\n\n/* \n=====Compiled Typescript file that is being tested=====\n*/\n\n"+
    file_code_comp+"\n\n"+test, 
    function(err){
        if(err) 
        return console.error(err);
    });
}