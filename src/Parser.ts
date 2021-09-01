import * as ts from "typescript";
import * as fs from "fs";
import * as ast from "./ASTTypeTrees";

export function getAST(filename) : JSON{
    const code = fs.readFileSync(filename, 'utf-8');
    const sc = ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true);
    return ast.processNode(sc);
}

/*
//read ts file into string
if(process.argv.length !== 2){
    //create folder for the asts
    createDirectory("./ASTs");
    var args = process.argv.slice(2);
    var option = args[0];
    switch(option){
        case "-fp":
            for (var _i = 1; _i < args.length; _i++) {
                var filename = args[_i];
                const code = fs.readFileSync(filename, 'utf-8');
                const sc = ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true);
                console.log(filename + " JSON AST:")
                console.log(JSON.stringify(ast.processNode(sc)));
            }
            break;
        case "-ff":
            for (var _i = 1; _i < args.length; _i++) {
                var filename = args[_i];
                const code = fs.readFileSync(filename, 'utf-8');
                const sc = ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true);
                fs.writeFile('./ASTs/' + getFilename(filename) + '_AST.json', 
                JSON.stringify(ast.processNode(sc),null,4),  function(err) {
                    if (err) {
                        return console.error(err);
                    }
                    console.log("File created!");
                });
            }
            break;
        case "-dp":
            var testFolder = args[1];
            var filenames = printDir(testFolder);
            break;
        case "-df":
            var testFolder = args[1];
            //create folder for the asts
            createDirectory('./ASTs/' + testFolder + "_ASTs");
            //get filenames
            var filenames = readDir(testFolder);
            break;
        case "-h":
        default:
            console.log('Invalid Operation!')
            console.log('How to use:')
            console.log('node Parser.js <option> <filenames/folder>')
            console.log('options: -fp: print JSON ASTs from files in prompt')
            console.log('options: -dp: print JSON ASTs from folder in prompt')
            console.log('options: -ff: create files with JSON ASTs from files in prompt')
            console.log('options: -df: create files with JSON ASTs from folder in prompt')


    }
}

function createDirectory (dir) {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
}

function getFilename(file){
    var split = file.split('/');
    return split[split.length - 1].split('.ts')[0];
}

function readDir(folderName){
    fs.readdir(folderName, (err, files) => {
        files.forEach(file => {
            if(file.split('.')[1] === 'ts'){
                createFolderJSONFile(file, folderName);
            }
        });
    });
    return filenames;
}

function printDir(folderName){
    fs.readdir(folderName, (err, files) => {
        files.forEach(file => {
            var splitted = file.split('.');
            if(splitted[splitted.length - 1] === 'ts'){
                printFolderJSONFile(file, folderName);
            }
        });
    });
    return filenames;
}

function printFolderJSONFile(file, testFolder){
    console.log(testFolder+'/'+file)
    const code = fs.readFileSync(testFolder+'/'+file, 'utf-8');
    const sc = ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true);
    console.log(file + " JSON AST:")
    console.log(JSON.stringify(ast.processNode(sc)));
}

function createFolderJSONFile(file, testFolder){
    const code = fs.readFileSync(testFolder + '/' + file, 'utf-8');
    const sc = ts.createSourceFile('x.ts', code, ts.ScriptTarget.Latest, true);
    fs.writeFile('./ASTs/' + testFolder + '_ASTs/' + getFilename(file) + '_AST.json',
    JSON.stringify(ast.processNode(sc),null,4),  function(err) {
        if (err) {
            return console.error(err);
        }
    });
}
*/