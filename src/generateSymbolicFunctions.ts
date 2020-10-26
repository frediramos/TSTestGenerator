import ts = require("typescript");
import finder = require("./finder");
import * as utils from "./utils";
import * as TsASTFunctions from "./TsASTFunctions";
import * as generateSymbolicTypes from "./generateSymbolicTypes";


//::::::::Checks if the given type is a function type::::::::
export function isFunctionType(arg_type:ts.Type,program_info:finder.ProgramInfo){

    var arg_str =program_info.Checker.typeToString(arg_type);
    return arg_str.includes("=>"); 
}

//::::::::This function generates the call to a function::::::::
function createCall(fun_name:string, arg_types:ts.Type[], program_info:finder.ProgramInfo){
    var stmts = [];
  
    //The argument types will be generated
    var ret_args = generateSymbolicTypes.createArgSymbols(arg_types,program_info);
    stmts = stmts.concat(ret_args.stmts);
    //Generation of the function call string using the arguments type string as parameter
    var call = `${fun_name}(${ret_args.vars_str});`
    stmts.push(utils.str2ast(call));
    return stmts;
}

//::::::::This function gets the parameters and return types of a function::::::::
export function getFunctionElements(fun_type:ts.Type,program_info:finder.ProgramInfo){
  var params = [];

  //Checks signatures in the fun_type in order to find the parameters types and the function return value
  for (const signature of fun_type.getCallSignatures()){
    for(const parameter of signature.parameters){
      var parameter_type = program_info.Checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!);
      params.push(parameter_type);
    }
    var ret_type = signature.getReturnType();
  }

  return {
    params:params,
    ret: ret_type
  }
}

//::::::::This function generates a mock function used as other function argument::::::::
export function createMockFunction(arg_types:ts.Type[],ret_type:ts.Type,program_info:finder.ProgramInfo){
    var calls = [];
    
    //Creates the variable assignment for the return type
    var ret_val = generateSymbolicTypes.createSymbAssignment(ret_type,program_info);
    
    //Generates the argument types
    var ret_args = generateSymbolicTypes.createArgSymbols(arg_types,program_info);
  
    for(var i=0;i<arg_types.length;i++){
      //Checks if one of the types is a function
      if(isFunctionType(arg_types[i],program_info)){
        //Generates the call to the function that is a parameter of this mock function
        var function_elements = getFunctionElements(arg_types[i],program_info);
        calls=calls.concat(createCall(ret_args.vars[i], function_elements.params,program_info));
      }
    }
  
    calls.push(ret_val.stmts[0]);
    calls.push(TsASTFunctions.generateReturnVar(ret_val.var));
    var func_expr = TsASTFunctions.createFunctionExpression(calls,ret_args.vars);
    return func_expr;
}

