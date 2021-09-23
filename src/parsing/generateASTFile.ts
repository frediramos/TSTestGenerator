import * as parser from "../parsing/Parser";
import * as fs from "fs";

var filename = process.argv[2];

var out = parser.getAST(filename);

fs.writeFile(getFilename(filename) + '_AST.json', 
                JSON.stringify(out,null,4),  function(err) {
                    if (err) {
                        return console.error(err);
                    }
                    console.log("File created!");
});

function getFilename(file){
    var split = file.split('/');
    return split[split.length - 1].split('.ts')[0];
}