import * as ts from "typescript";
import * as fs from "fs";

var test_path = process.argv.slice(2)[0];
var json_path = "./"+test_path.split("/")[0]+"/failing_models/"+test_path.split("/")[1].split(".")[0]+".json";
var json = require(json_path);
var constant_code_str;

for(var i = 0; i<json.models.length;i++){
    var test_code = fs.readFileSync(test_path, 'utf8');

    Object.keys(json.models[i]).forEach(function (var_name) { 
        
        test_code = test_code.split(`symb_number(${var_name})`).join(json.models[i][var_name]);
        test_code = test_code.split(`symb_string(${var_name})`).join(json.models[i][var_name]);

    });
    test_code = test_code.split(/symb_number\(x_\d+\);/).join("0;");
    test_code = test_code.split(/symb_string\(x_\d+\);/) .join("\"\";");

    //Adding the code of the Assert function to the constant code generated
    constant_code_str = `function Assert(x) {
    try{
      if(x !== true) throw new Error(\"Assertion failure\");
    } catch(e) {
      console.log(e.message);
        }
    }\n\n`;

    fs.writeFileSync(test_path.split("/")[0]+"/concrete_tests/concrete_"+test_path.split("/")[1].split(".")[0]+(i+1)+".js",constant_code_str+test_code);

}




