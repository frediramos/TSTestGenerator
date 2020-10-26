import ts = require("typescript");
import finder = require("./finder");
import * as utils from "./utils";
import { isString } from "util";
import * as cosetteFunctions from "./cosetteFunctions";
import * as freshVars from "./freshVars";
import * as TsASTFunctions from "./TsASTFunctions";
import * as generateSymbolicObjects from "./generateSymbolicObjects";
import * as generateSymbolicFunctions from "./generateSymbolicFunctions";
import * as generateSymbolicArray from "./generateSymbolicArray";
import * as generateSymbolicUnion from "./generateSymbolicUnion";

var cosFunc = new cosetteFunctions.CosetteFunctions(); 

//::::::::Checks if the given type is an object literal type::::::::
export function isObjectLiteralType(object_literal_type:ts.Type){
    return object_literal_type.symbol && object_literal_type.symbol.declarations && object_literal_type.symbol.members; 
}
  
//::::::::Checks if the given type is an object literal type::::::::
export function isLiteralType(literal_type:ts.Type, program_info:finder.ProgramInfo){
    var literal_type_node:ts.TypeLiteralNode = <ts.TypeLiteralNode> program_info.Checker.typeToTypeNode(literal_type);
    return typeof literal_type_node["literal"] === "object";
}

//::::::::Function used to assign a string symbol to a variable::::::::
function createStringSymbAssignment () { 
    var x = freshVars.freshXVar(); 
    var ret_str = `var ${x} = ${cosFunc.stringCreator(x)}`; 
  
    return {
        stmts: [utils.str2ast(ret_str)], 
        var: x,
        control: [],
        control_num: []
    } 
}
  
  
//::::::::Function used to assign a numerical symbol to a variable::::::::
function createNumberSymbAssignment () { 
    var x = freshVars.freshXVar(); 
    var ret_str = `var ${x} = ${cosFunc.numberCreator(x)}`; 

    return {
        stmts: [utils.str2ast(ret_str)], 
        var: x,
        control: [],
        control_num: []
    } 
}
  
  
//::::::::Function used to assign a boolean symbol to a variable::::::::
function createBooleanSymbAssignment () { 
    var x = freshVars.freshXVar(); 
    var ret_str = `var ${x} = ${cosFunc.booleanCreator(x)}`; 
  
    return {
        stmts: [utils.str2ast(ret_str)], 
        var: x,
        control: [],
        control_num: []
    } 
}
  
  
//::::::::Function used to assign null to a variable::::::::
function createNullAssignment () { 
    var x = freshVars.freshXVar(); 
    var ret_str = `var ${x} = ${cosFunc.nullCreator()}`; 
  
    return {
        stmts: [utils.str2ast(ret_str)], 
        var: x,
        control: [],
        control_num: []
    } 
}
  
  
//::::::::Function used to assign undefined to a variable::::::::
function createVoidAssignment () { 
    var x = freshVars.freshXVar(); 
    var ret_str = `var ${x} = ${cosFunc.voidCreator()}`; 
  
    return {
        stmts: [utils.str2ast(ret_str)], 
        var: x,
        control: [],
        control_num: []
    } 
}


// GenerateSymbolicTypes

//::::::::Function used to make a symbol assignment to a variable::::::::
export function createSymbAssignment (arg_type:ts.Type,program_info:finder.ProgramInfo,fuel_var?:string) { 

    //Turns the type into a string
    var type_str = program_info.Checker.typeToString(arg_type);
  
    //Based on the type it will decide what the program will generate
    switch (type_str) {
      //If the type is a string generates a symbolic string assignment 
      case "string" : return createStringSymbAssignment(); 
  
      //If the type is a number generates a symbolic number assignment
      case "number" : return createNumberSymbAssignment();
  
      //If the type is a boolean generates a symbolic boolean assignment
      case "boolean" : return createBooleanSymbAssignment();
  
      //If the type is null generates a null assignment
      case "null" : return createNullAssignment();
  
      //If the type is null generates a undefined assignment
      case "void" : 
      case "undefined" : return createVoidAssignment();
  
      //if the type is not a primitive type
      default:
        //If the type is an object it will generate that object
        if (program_info.hasClass(type_str)) {
  
          //If the construction of this object leads to a cycle it will be constructed recursively
          if(program_info.cycles_hash[type_str]){
            return generateSymbolicObjects.createObjectRecursiveCall(type_str, fuel_var);
          } 
          //Otherwise it will be constructed by generating the arguments and a call to its constructor(s)
          else {
            return generateSymbolicObjects.createObjectSymbParams(type_str,program_info);
          }
        } 
        
        //If the type is an interface it will generate that object via a mock constructor
        else if (program_info.hasInterface(type_str)) {
          return generateSymbolicObjects.createObjectSymbParams(type_str,program_info);
        } 
  
        //If the type is a function it will generate a mock function with the same return type to simulate a function being given as parameter 
        else if(generateSymbolicFunctions.isFunctionType(arg_type,program_info)){
          var ret_func_elements = generateSymbolicFunctions.getFunctionElements(arg_type,program_info);
          var fun_name = freshVars.freshMockFuncVar();
          var func_expr = generateSymbolicFunctions.createMockFunction(ret_func_elements.params, ret_func_elements.ret, program_info);
          var func_decl = TsASTFunctions.func_expr2func_decl(fun_name, func_expr);
          return {
            stmts: [func_decl],
            var: fun_name,
            control: [],
            control_num: []
          }
        } 
        
        //If the type is an array it will generate 3 possible array assignments
        else if(generateSymbolicArray.isArrayType(arg_type)){
          return generateSymbolicArray.createArrayOfType(arg_type,program_info);
        } 
  
        //If the type is an union it will generate one assignment for each of the union possible types
        else if(generateSymbolicUnion.isUnionType(arg_type)){
          return generateSymbolicUnion.createUnionType(arg_type,program_info);
        } 
  
        else if(isObjectLiteralType(arg_type)){
          return createObjectLiteralType(arg_type,program_info);
        }
  
        else if(isLiteralType(arg_type, program_info)){
          return createLiteralType(arg_type, program_info);
        }
  
        //If the type reaches this case it is a type unsupported by the testGenerator
        else {
          throw new Error ("createSymbAssignment: Unsupported type: "+type_str);
        }
    }
}
  
  
//::::::::Function used to create the symbol of the arguments::::::::
/**
 * 
 * 
 * createArgSymbols(t1, ..., tn, fuel) ::
 * 
 * stmts1, #x1, controls1 = CSA(t1)
 * ...
 * stmtsn, #xn, controls1 = CSA(tn)
 * ---------------------------------------------------
 * (stmts1; stmts2; ...; stmtsn, [ #x1, ..., #xn ], controls1 @ ... @ controlsn )
 */
  
export function createArgSymbols(arg_types:ts.Type[],program_info:finder.ProgramInfo,fuel_var?:string){
    var symb_vars = [];
    var stmts = []; 
    var control_vars = [];
    var control_nums = [];
  
    //For each type in the arg_types array generates the variable of the respective type
    for (var i=0; i<arg_types.length; i++) {
      //Creates the variable and assignment of the type
      var ret = createSymbAssignment(arg_types[i],program_info,fuel_var);
      stmts = stmts.concat(ret.stmts); 
      symb_vars.push(ret.var); 
      //Checks if any argument has more than one possible value
      if(ret.control!==undefined){
        control_vars = control_vars.concat(ret.control);   
        control_nums = control_nums.concat(ret.control_num);
      }
        
    }
  
    //Creates a string with the arguments later used as the parameters of the respective call
    var args_str = symb_vars.reduce(function (cur_str, prox) {
      if (cur_str === "") return prox; 
      else return cur_str + ", " + prox; 
    },"");
  
  
    return{
      stmts:stmts,
      vars:symb_vars,
      vars_str:args_str,
      control: control_vars,
      control_num: control_nums
    }
}

//::::::::This function generates a symbolic assignment for each property of the object literal::::::::
function createObjectLiteralType(object_literal_type:ts.Type,program_info:finder.ProgramInfo){
    var stmts = [];
    var properties = [];
    var control_vars = [];
    var control_nums = [];
  
    //Stores the symbols of the object literal properties in a variable
    var object_literal_symbols = object_literal_type.getProperties();
  
    //Generates the property type variable 
    Object.keys(object_literal_symbols).forEach(function (property_number) {
      
      var property_symbol = object_literal_symbols[property_number];
      var property_type = program_info.Checker.getTypeOfSymbolAtLocation(property_symbol, property_symbol.valueDeclaration!);
  
      var ret = createSymbAssignment(property_type, program_info);
      stmts=stmts.concat(ret.stmts); 
  
      var property_assigment = TsASTFunctions.createProperty(property_symbol.escapedName, ret.var);
      properties.push(property_assigment);
  
      //Checks if any argument has more than one possible value
      if(ret.control!==undefined){
        control_vars = control_vars.concat(ret.control);
        control_nums = control_nums.concat(ret.control_num);
      }    
    });
  
    //Assigns the object properties to the symbolic variables
    var ret_var = freshVars.freshObjectVar();
    var object_declaration = TsASTFunctions.createLiteralObjectDeclaration(ret_var, properties);
    stmts.push(object_declaration);
  
    return {
      stmts: stmts,
      var:ret_var,
      control: control_vars,
      control_num: control_nums
    }
}
  
//::::::::This function generates a symbolic assignment for each property of the object literal::::::::
function createLiteralType(literal_type:ts.Type,program_info:finder.ProgramInfo){
    var stmts = [];
    var control_vars = [];
    var control_nums = [];
  
    var ret_var = freshVars.freshXVar();
    if(isString(literal_type["value"])) {
      var var_string_assignment = `var ${ret_var} = "${literal_type["value"]}"`;
      stmts.push(utils.str2ast(var_string_assignment));
    }
  
    else {
      var var_number_assignment = `var ${ret_var} = ${literal_type["value"]}`;
      stmts.push(utils.str2ast(var_number_assignment));
    }
  
    return {
      stmts: stmts,
      var:ret_var,
      control: control_vars,
      control_num: control_nums
    }
}


