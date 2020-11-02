import {IProgramInfo} from "./IProgramInfo"
import * as constants from "./constants";
import * as utils from "./utils";
import * as freshVars from "./freshVars";
import * as TsASTFunctions from "./TsASTFunctions";
import * as generateSymbolicTypes from "./generateSymbolicTypes";

//::::::::This function creates the name for the create object function::::::::
function getCreateMethodName(class_name:string):string{
    return "create"+class_name;
}
  
//::::::::This function generates the call of a constructor recursively with symbolic parameters::::::::
export function createObjectRecursiveCall(class_name:string, fuel_var?:string){
    var recurs_obj_var = freshVars.freshObjectVar();
    var index = freshVars.freshIndexVar();
    
    var fuel_var_str
    if(!fuel_var){
      var fuel_var = freshVars.freshFuelArrVar();
      fuel_var_str = `${fuel_var}[${index}]`;
    }
  
    else {
      fuel_var_str = fuel_var;
    }
  
    var call = `var ${recurs_obj_var} = ${getCreateMethodName(class_name)}(${fuel_var_str});`;
    return {
      stmts: [ utils.str2ast(call) ],
      var: recurs_obj_var,
      control: [],
      control_num: [],
      needs_for: true,
      fuel_var: fuel_var,
      index_var: index
    }
}
  
  /*
  
  class A {
     ... 
     constructor (args1); 
     constructor (args2); 
     ...
     constructor (argsn) {
       body
     }
     ...
  }
  
  stmts_1, args_1', controls_1 = createArgSymbols(args1) 
  ...
  stmts_n, args_n', controls_n = createArgSymbols(argsn)
  
  Recursive(A)
  
  ======================> 
  
  function createA (fuel, controls1, ..., controlsn) {
     if (fuel.length === 0) return null; 
     var control = fuel.pop(); 
     switch (control) {
       case 1:
            stmts1 
            return new A(args1')
       case 2:
            stmts2 
            return new A(args2')
       ...
       default: 
            stmtsn
            return new A(argsn')
     } 
  }
  
  */
//::::::::This function generates the call of a constructor that needs recursive behaviour with symbolic parameters::::::::
export function createObjectRecursiveSymbParams<ts_type>(class_name:string, program_info:IProgramInfo<ts_type>){
    
    var symb_vars = [];
    var stmts = []; 
    var objs = [];
    var control_vars = [];
    var control_nums = [];
    var class_constructors = program_info.getClassConstructorsInfo(class_name);
    
    //Creates the fuel var and the if statement at the beginning of the create function for objects with cyclic construction
    var fuel_var = freshVars.freshFuelVar();
    var if_has_fuel_ast = TsASTFunctions.generateIfFuelStatement(fuel_var);
    stmts.push(if_has_fuel_ast);
  
    //In case there is more than one constructor it will use the value popped of the fuel var in the switch statement
    var control_obj_var = freshVars.freshControlObjVar();
    var fuel_pop_str = `var ${control_obj_var} = ${fuel_var}.pop();`
    stmts.push(utils.str2ast(fuel_pop_str));
      
    //Generation of all the construction cases, one for each constructor that the object has
    for(var i=0; i<class_constructors.length; i++){
      symb_vars=[];
  
      //Generation of the constructor arguments
      var ret = generateSymbolicTypes.createArgSymbols(class_constructors[i].arg_types,program_info,fuel_var);
      symb_vars = symb_vars.concat(ret.vars);
      //Checks if any argument has more than one possible value
      if(ret.control!==undefined){
        control_vars = control_vars.concat(ret.control);
        control_nums = control_nums.concat(ret.control_num);
      }
  
      //Generates the return statement for the object that was constructed
      var obj_ret = TsASTFunctions.generateReturnCall(class_name,ret.vars);
      objs.push(TsASTFunctions.generateBlock(ret.stmts.concat(obj_ret)));
    }
  
    //Creates the switch statement that will have all the possible constructions
    var switch_stmt = TsASTFunctions.createSwitchStmt(control_obj_var, objs);
    stmts.push(switch_stmt); 
  
    stmts.push(utils.str2ast(constants.ENTER_STR));
  
    control_nums.push(class_constructors.length);
    control_vars.unshift(fuel_var);
  
    return TsASTFunctions.createFunctionDeclaration(getCreateMethodName(class_name),stmts,control_vars);
}
  
  
  //::::::::This function generates the call of a constructor with symbolic parameters::::::::
  /**
  class A {
     ... 
     constructor (args1); 
     constructor (args2); 
     ...
     constructor (argsn) {
       body
     }
     ...
  }
  
  stmts_1, args_1', controls_1 = createArgSymbols(args1) 
  ...
  stmts_n, args_n', controls_n = createArgSymbols(argsn)
  
  ======================> 
  
  function createA (controlA, controls1, ..., controlsn) {
     switch (controlA) {
       case 1:
            stmts1 
            return new A(args1')
       case 2:
            stmts2 
            return new A(args2')
       ...
       default: 
            stmtsn
            return new A(argsn')
    } 
}

*/
  
  
export function createObjectSymbParams<ts_type>(class_name:string, program_info:IProgramInfo<ts_type>){
    var symb_vars = [];
    var stmts = []; 
    var objs = [];
    var control_vars = [];
    var control_nums = [];
    var class_constructors = program_info.getClassConstructorsInfo(class_name);
  
    //Creates the object var
    var obj = freshVars.freshObjectVar();
  
    //Checks if the class_name argument is an interface or not, and if it is a prefix will be added to the obj var name
    if(program_info.hasInterface(class_name))
      obj = "interface_" + obj;
  
    //Var declaration string
    var obj_str = `var ${obj}`; 
    stmts.push(utils.str2ast(obj_str));
  
    //Iterates over all the object constructors 
    for(var i=0; i<class_constructors.length; i++){
      symb_vars=[];
  
      //Creates the arguments for the object constructor
      var ret = generateSymbolicTypes.createArgSymbols(class_constructors[i].arg_types,program_info);
      symb_vars = symb_vars.concat(ret.vars);
      //Checks if any argument has more than one possible value
      if(ret.control!==undefined){
        control_vars = control_vars.concat(ret.control);
        control_nums = control_nums.concat(ret.control_num);
      }
  
      //Generation of the object var assignment to a new object of that class
      obj_str =`${obj} = new ${class_name}(${ret.vars_str})`;
      objs.push(TsASTFunctions.generateBlock(ret.stmts.concat(utils.str2ast(obj_str))));
    }
  
    //Checks if the class has more than one constructor and if it has it will create a switch case for each of them
    if(class_constructors.length>1){
      var control_var = freshVars.freshControlObjVar(); 
      var switch_stmt = TsASTFunctions.createSwitchStmt(control_var, objs);
      stmts.push(switch_stmt); 
      control_vars.push(control_var);
      control_nums.push(class_constructors.length);
    }
    //If it has only one constructor, it will only use the object var assignment already made
    else{
      stmts.push(objs[0]);
    }
  
    stmts.push(utils.str2ast(constants.ENTER_STR));
  
    return {
      stmts: stmts,
      var:obj,
      control: control_vars,
      control_num: control_nums
    }
}