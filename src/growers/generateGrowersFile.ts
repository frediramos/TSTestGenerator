import growerFinder = require("./GrowerFinder");
import * as fs from "fs";

var filename = process.argv[2];
var res = growerFinder.finder(filename);
fs.writeFile(getFilename(filename) + '_growers.json', 
    JSON.stringify(res,null,4),  function(err) {
        if (err) {
            return console.error(err);
        }
    }
);

function getFilename(file){
    var split = file.split('/');
    return split[split.length - 1].split('.ts')[0];
}