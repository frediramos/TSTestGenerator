import * as fs from "fs";
import finder = require("./finder");
import growers = require("./growers");
import tg = require("./testGenerator");
import * as path from "path";
const { execSync } = require("child_process");

//Deleting the directory for the function's tests if it exists
var filename = process.argv[2];
var growers_file = process.argv[3];

var tests_dir = "Test_"+path.parse(filename).name;
var command_tests_dir = "rm -rf "+tests_dir;
execSync(command_tests_dir, (err, stdout, stderr) => {
if (err) return;
});

//Making the directory for the function's tests
var command_tests_dir = "mkdir -p "+tests_dir;
execSync(command_tests_dir, (err, stdout, stderr) => {
if (err) return;
});

//Retrieving the program information using the finder
var prog_info:finder.ProgramInfo = finder.finder(filename);

//Stores the growers info in the program info structure
growers.addGrowers(prog_info, growers_file);

prog_info.showGrowers();

//Checking for cyclic constructions
var cycles =finder.findCycles(prog_info);

//Getting the code from the Typescript file that is being tested
var file_code:string;
try {
    file_code = fs.readFileSync(process.argv.slice(2)[0], 'utf8');
    file_code = "/* \n=====Typescript file that is being tested=====\n\n"+file_code+"\n*/\n\n\n";
} catch(e) {
    console.log('Error:', e.stack);
}

//Compiling file that is being tested
var command = "tsc "+process.argv.slice(2)[0];
execSync(command, (err, stdout, stderr) => {
if (err) return;
});

//Getting the code from the compiled file that is being tested
var js_file = process.argv.slice(2)[0].substring(0, process.argv.slice(2)[0].lastIndexOf(".")) + ".js";
var file_code_comp:string;
try {
    file_code_comp = fs.readFileSync(js_file, 'utf8');
    file_code_comp = "/* \n=====Compiled Typescript file that is being tested=====\n*/\n"+file_code_comp;
} catch(e) {
    console.log('Error:', e.stack);
}

var remove_js_file = "rm -f "+js_file;
execSync(remove_js_file, (err, stdout, stderr) => {
if (err) return;
});

//Tests generation
var test = tg.generateTests(prog_info, tests_dir, file_code_comp);

//Writing the Typescript file, the compiled file and the tests in an output file
fs.writeFileSync(process.argv.slice(2)[0].replace(/^.*[\\\/]/, '').split(".")[0]+"-global-test.js",file_code+file_code_comp+"\n\n"+test);
