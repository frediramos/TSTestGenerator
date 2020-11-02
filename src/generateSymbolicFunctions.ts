import {IProgramInfo} from "./IProgramInfo"
import * as utils from "./utils";
import * as TsASTFunctions from "./TsASTFunctions";
import * as generateSymbolicTypes from "./generateSymbolicTypes";

//::::::::This function generates the call to a function::::::::
function createCall<ts_type>(fun_name:string, arg_types:ts_type[], program_info:IProgramInfo<ts_type>){
    var stmts = [];
  
    //The argument types will be generated
    var ret_args = generateSymbolicTypes.createArgSymbols(arg_types,program_info);
    stmts = stmts.concat(ret_args.stmts);
    //Generation of the function call string using the arguments type string as parameter
    var call = `${fun_name}(${ret_args.vars_str});`
    stmts.push(utils.str2ast(call));
    return stmts;
}

//::::::::This function generates a mock function used as other function argument::::::::
export function createMockFunction<ts_type>(arg_types:ts_type[],ret_type:ts_type,program_info:IProgramInfo<ts_type>){
    var calls = [];
    
    //Creates the variable assignment for the return type
    var ret_val = generateSymbolicTypes.createSymbAssignment(ret_type,program_info);
    
    //Generates the argument types
    var ret_args = generateSymbolicTypes.createArgSymbols(arg_types,program_info);
  
    for(var i=0;i<arg_types.length;i++){
      //Checks if one of the types is a function
      if(program_info.isFunctionType(arg_types[i])){
        //Generates the call to the function that is a parameter of this mock function
        var function_elements = program_info.getFunctionElements(arg_types[i]);
        calls=calls.concat(createCall(ret_args.vars[i], function_elements[0].arg_types,program_info));
      }
    }
  
    calls.push(ret_val.stmts[0]);
    calls.push(TsASTFunctions.generateReturnVar(ret_val.var));
    var func_expr = TsASTFunctions.createFunctionExpression(calls,ret_args.vars);
    return func_expr;
}

