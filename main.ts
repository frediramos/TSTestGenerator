import * as ts from "typescript";
import * as fs from "fs";
import finder = require("./finder");
import tg = require("./testGenerator");


var prog_info:finder.ProgramInfo = finder.finder(process.argv.slice(2));

var test = tg.generateTests(prog_info);

fs.writeFile(process.argv.slice(2)+"-test.txt",test, function(err){
    if(err) 
      return console.error(err);
  });


/*
=============Example to test if prog_info has the Hashtables filled correctly=============

const program = ts.createProgram(process.argv.slice(2), { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS});
const checker = program.getTypeChecker();

console.log("Classes:");
console.log("Expected class type: Animal                            Returned class type: "+checker.typeToString(prog_info.ClassesInfo["Animal"]));
console.log("Expected class type: Person                            Returned class type: "+checker.typeToString(prog_info.ClassesInfo["Person"]));

console.log("_______________________________________________________________________________________________________________\n\nProperties:");
console.log("Expected property type: number                         Returned property type: "+checker.typeToString(prog_info.PropertiesInfo["Animal"]["position"]));
console.log("Expected property type: string                         Returned property type: "+checker.typeToString(prog_info.PropertiesInfo["Person"]["name"]));
console.log("Expected property type: string                         Returned property type: "+checker.typeToString(prog_info.PropertiesInfo["Person"]["friend"]));

console.log("_______________________________________________________________________________________________________________\n\nConstructors:");
console.log("Expected constructor parameter type: number            Returned constructor parameter type: "+checker.typeToString(prog_info.ConstructorsInfo["Animal"][0].arg_types[0]));
console.log("Expected constructor parameter type: number            Returned constructor parameter type: "+checker.typeToString(prog_info.ConstructorsInfo["Animal"][0].arg_types[1]));
console.log("Expected constructor return type: Animal               Returned constructor return type: "+checker.typeToString(prog_info.ConstructorsInfo["Animal"][0].ret_type));
console.log("Expected constructor parameter type: number            Returned constructor parameter type: "+checker.typeToString(prog_info.ConstructorsInfo["Animal"][1].arg_types[0]));
console.log("Expected constructor return type: Animal               Returned constructor return type: "+checker.typeToString(prog_info.ConstructorsInfo["Animal"][1].ret_type));
console.log("Expected constructor parameter type: string            Returned constructor parameter type: "+checker.typeToString(prog_info.ConstructorsInfo["Person"][0].arg_types[0]));
console.log("Expected constructor return type: Person               Returned constructor return type: "+checker.typeToString(prog_info.ConstructorsInfo["Person"][0].ret_type));

console.log("_______________________________________________________________________________________________________________\n\nMethods:");
console.log("Expected method parameter type: number                 Returned method parameter type: "+checker.typeToString(prog_info.MethodsInfo["Animal"]["walk"].arg_types[0]));
console.log("Expected method parameter type: Animal                 Returned method parameter type: "+checker.typeToString(prog_info.MethodsInfo["Animal"]["walk"].arg_types[1]));
console.log("Expected method return type: number                    Returned method return type: "+checker.typeToString(prog_info.MethodsInfo["Animal"]["walk"].ret_type));
console.log("Expected method parameter type: string                 Returned method parameter type: "+checker.typeToString(prog_info.MethodsInfo["Person"]["walk"].arg_types[0]));
console.log("Expected method parameter type: number                 Returned method parameter type: "+checker.typeToString(prog_info.MethodsInfo["Person"]["walk"].arg_types[1]));
console.log("Expected method return type: number                    Returned method return type: "+checker.typeToString(prog_info.MethodsInfo["Person"]["walk"].ret_type));

if(prog_info.MethodsInfo["Animal"]["walk"].arg_types[1]===prog_info.ClassesInfo["Animal"]){
    console.log("Parameter partner type equals class Animal type");
}

if(prog_info.ConstructorsInfo["Animal"][0].ret_type===prog_info.ClassesInfo["Animal"]){
    console.log("Constructor of Animal return type equals class Animal type");
}

==========================================================================================
*/