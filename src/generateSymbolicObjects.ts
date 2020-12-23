import {IProgramInfo} from "./IProgramInfo"
import * as utils from "./utils";
import * as freshVars from "./freshVars";
import * as TsASTFunctions from "./TsASTFunctions";
import * as generateSymbolicTypes from "./generateSymbolicTypes";

//::::::::This function creates the name for the create object function::::::::
function getCreateMethodName(class_name:string):string{
    return "create"+class_name;
}

function checkObjectInfo<ts_type>(class_name:string, program_info:IProgramInfo<ts_type>) {
  var control_vars:string[] = [];
  var control_nums:number[] = [];
  var needs_for:boolean = false;
  var fuel_arr:number[] = [];
  var index:string;

  var constructor_info = program_info.getClassConstructorsInfo(class_name);
  if(constructor_info.length > 1) {
    var control_var:string = freshVars.freshControlObjVar(); 
    control_vars.push(control_var);
    control_nums.push(constructor_info.length);
  }

  for(var i=0; i<constructor_info.length; i++) {
    var ret_args = generateSymbolicTypes.createArgSymbols(constructor_info[i].arg_types, program_info);
  
    //Checks if any argument has more than one possible value
    if(ret_args.control[0]!==undefined){
      control_vars = control_vars.concat(ret_args.control);
      control_nums = control_nums.concat(ret_args.control_num);
    }
  
    //Checks if any argument needs recursive construction
    if(ret_args["needs_for"]) {
      needs_for = true;
      fuel_arr = ret_args["fuel_var"];       //Fuel array used for the recursive construction
      index = ret_args["index_var"];             //Index to access the positions of the fuel array
    }
  }

  //Creates a string with the arguments in parameters format, for example "x_1, x_2"
  var create_control_args_str = control_vars.reduce(function (cur_str, prox) {
    if (cur_str === "") return prox; 
    else return cur_str + ", " + prox; 
  },"");

  return {
    control_vars: control_vars,
    control_nums: control_nums,
    needs_for: needs_for,
    fuel_arr: fuel_arr,
    index: index,
    create_control_args_str: create_control_args_str
  }
}

function createControlArgs(control_num:number):string[] {
  var args:string[] = [];
  for(var i = 0; i < control_num; i++) {
    args.push(freshVars.freshControlArgVar());
  }
  return args;
}

//::::::::This function generates the call of a constructor recursively with symbolic parameters::::::::
export function createObjectCall<ts_type>(class_name:string, program_info:IProgramInfo<ts_type>) {
  var obj_var:string = freshVars.freshObjectVar();

  //var arguments_info = checkObjectInfo(class_name, program_info);

  var control_nums = program_info.getCreateInfo(class_name);
  var control_vars = createControlArgs(control_nums.length);

  var control_vars_str = control_vars.join(", ");
  var call = `var ${obj_var} = ${getCreateMethodName(class_name)}(${control_vars_str});`;

  return {
    stmts: [utils.str2ast(call)],
    var: obj_var,
    control: control_vars,
    control_num: control_nums,
    needs_for: false,
    fuel_var: [],
    index_var: []
  }
}

//::::::::This function generates the call of a constructor recursively with symbolic parameters::::::::
export function createObjectRecursiveCall<ts_type>(class_name:string, program_info:IProgramInfo<ts_type>, fuel_var?:string){
    var recurs_obj_var:string = freshVars.freshObjectVar();
    var index:string = freshVars.freshIndexVar();
    
    var fuel_var_str:string;
    if(!fuel_var){
      var fuel_var = freshVars.freshFuelArrVar();
      fuel_var_str = `${fuel_var}[${index}]`;
    }
  
    else {
      fuel_var_str = fuel_var;
    }
  
    var call = `var ${recurs_obj_var} = ${getCreateMethodName(class_name)}(${fuel_var_str});`;
    return {
      stmts: [utils.str2ast(call)],
      var: recurs_obj_var,
      control: [],
      control_num: [],
      needs_for: true,
      fuel_var: fuel_var,
      index_var: index
    }
}

function updateGlobalControlVars(arr1:string[], arr2:string[]) {

  var max_length = Math.max(arr1.length, arr2.length);
  var subst = {};

  for(var i = 0; i < max_length; i++) {
    if(i < arr1.length && i < arr2.length) {
      subst[arr2[i]] = arr1[i];
    }

    arr1[i] = arr1[i] || arr2[i]; 
  }

  return subst;
}

function updateGlobalControlNums(arr1:number[], arr2:number[]):void {

  var max_length = Math.max(arr1.length, arr2.length);

  for(var i = 0; i < max_length; i++) {
    arr1[i] = Math.max(arr1[i] || 0, arr2[i] || 0); 
  }
}

  /*
  
  class A {
     ... 
     constructor (args1); 
     constructor (args2); 
     ...
     constructor (argsk) {
       body
     }
     ...
  }
  
  stmts_1, args_1', controls_1 = createArgSymbols(args1) 
  ...
  stmts_k, args_k', controls_k = createArgSymbols(argsk)
  
  Recursive(A)
  
  ======================> 
  
  function createA (fuel) {
     if (fuel.length === 0) return null; 
     var control_arr = fuel.pop(); 
     var control_1 = control_arr[1];
     ...
     var control_n = control_arr[n];
     switch (control_arr[0]) {
       case 1:
            stmts1 
            return new A(args_1')
       case 2:
            stmts2 
            return new A(args_2')
       ...
       default: 
            stmtsk
            return new A(args_k')
     } 
  }
  
  */
//::::::::This function generates the call of a constructor that needs recursive behaviour with symbolic parameters::::::::
export function makeRecursiveCreateFunction<ts_type>(class_name:string, program_info:IProgramInfo<ts_type>){
    
    var symb_vars:string[] = [];
    var stmts = []; 
    var objs = [];
    var control_vars:string[] = [];
    var control_nums:number[] = [];
    var class_constructors = program_info.getClassConstructorsInfo(class_name);
    
    //Creates the fuel var and the if statement at the beginning of the create function for objects with cyclic construction
    var fuel_var:string = freshVars.freshFuelVar();
    var if_has_fuel_ast = TsASTFunctions.generateIfFuelStatement(fuel_var);
    stmts.push(if_has_fuel_ast);
  
    //In case there is more than one constructor it will use the value popped of the fuel var in the switch statement
    var control_arr_var:string = freshVars.freshControlArrVar();
    var fuel_pop_str:string = `var ${control_arr_var} = ${fuel_var}.pop();`
    stmts.push(utils.str2ast(fuel_pop_str));
    
    //Generation of all the construction cases, one for each constructor that the object has
    for(var i=0; i<class_constructors.length; i++){
      symb_vars=[];
  
      //Generation of the constructor arguments
      var ret = generateSymbolicTypes.createArgSymbols(class_constructors[i].arg_types,program_info,fuel_var);
      symb_vars = symb_vars.concat(ret.vars);
      //Checks if any argument has more than one possible value
      if(ret.control!==undefined) {
        var subst = updateGlobalControlVars(control_vars, ret.control);
        updateGlobalControlNums(control_nums, ret.control_num);
      }
  
      //Generates the return statement for the object that was constructed
      var obj_ret = TsASTFunctions.generateReturnCall(class_name,ret.vars);
      var case_stmts = ret.stmts.concat(obj_ret).map(utils.makeSubst(subst));
      objs.push(TsASTFunctions.generateBlock(case_stmts));
    }

    for(var i = 0; i < control_vars.length; i++) {
      var control_var_declaration = TsASTFunctions.createControlVarDeclr(i+1, control_arr_var, control_vars[i]);
      stmts.push(control_var_declaration);
    }

    control_nums.push(class_constructors.length);
    control_vars.unshift(fuel_var);

    //Creates the switch statement that will have all the possible constructions
    var switch_stmt = TsASTFunctions.createSwitchStmtIndex0(control_arr_var, objs);
    stmts.push(switch_stmt);

    return {
      func: TsASTFunctions.createFunctionDeclaration(getCreateMethodName(class_name),stmts,[fuel_var]),
      control_vars: control_vars,
      control_nums: control_nums,
      fuel: program_info.getMaxConstructorsRecursiveObjects()
    }
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
    var symb_vars:string[] = [];
    var stmts = []; 
    var objs = [];
    var control_vars:string[] = [];
    var control_nums:number[] = [];
    var class_constructors = program_info.getClassConstructorsInfo(class_name);
  
    //Creates the object var
    var obj:string = freshVars.freshObjectVar();
  
    //Checks if the class_name argument is an interface or not, and if it is a prefix will be added to the obj var name
    if(program_info.hasInterface(class_name))
      obj = "interface_" + obj;
  
    //Var declaration string
    var obj_str:string = `var ${obj}`; 
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
      var control_var:string = freshVars.freshControlObjVar(); 
      var switch_stmt = TsASTFunctions.createSwitchStmtVar(control_var, objs);
      stmts.push(switch_stmt); 
      control_vars.push(control_var);
      control_nums.push(class_constructors.length);
    }
    //If it has only one constructor, it will only use the object var assignment already made
    else{
      stmts.push(objs[0]);
    }

    return {
      stmts: stmts,
      var:obj,
      control: control_vars,
      control_num: control_nums
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
  
  Not Recursive(A)
  
  ======================> 
  
  function createA (control_obj, controls1, ..., controlsn) {
     switch (control_obj) {
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

export function makeNonRecursiveCreateFunction<ts_type>(class_name:string, program_info:IProgramInfo<ts_type>){
  var symb_vars:string[] = [];
  var stmts = []; 
  var objs = [];
  var control_vars:string[] = [];
  var control_nums:number[] = [];
  var class_constructors = program_info.getClassConstructorsInfo(class_name);

  //Iterates over all the object constructors 
  for(var i=0; i<class_constructors.length; i++){
    symb_vars=[];

    //Creates the arguments for the object constructor
    var ret = generateSymbolicTypes.createArgSymbols(class_constructors[i].arg_types,program_info);
    symb_vars = symb_vars.concat(ret.vars);
    //Checks if any argument has more than one possible value
    if(ret.control!==undefined){
      //control_vars = control_vars.concat(ret.control);
      //control_nums = control_nums.concat(ret.control_num);
      var subst = updateGlobalControlVars(control_vars, ret.control);
      updateGlobalControlNums(control_nums, ret.control_num);
    }

    //Generates the return statement for the object that was constructed
    var obj_ret = TsASTFunctions.generateReturnCall(class_name,ret.vars);

    var case_stmts = ret.stmts.concat(obj_ret).map(utils.makeSubst(subst));

    objs.push(TsASTFunctions.generateBlock(case_stmts));
  }

  //Checks if the class has more than one constructor and if it has it will create a switch case for each of them
  if(class_constructors.length>1) {
    var control_var:string = freshVars.freshControlObjVar(); 
    control_vars.unshift(control_var);
    control_nums.unshift(class_constructors.length);
    var switch_stmt = TsASTFunctions.createSwitchStmtVar(control_var, objs);
    stmts.push(switch_stmt); 
  }
  
  //If it has only one constructor, it will only use the object var assignment already made
  else {
    stmts.push(objs[0]);
  }

  return {
    func: TsASTFunctions.createFunctionDeclaration(getCreateMethodName(class_name), stmts, control_vars),
    control_vars: control_vars,
    control_nums: control_nums,
    fuel: 0
  }
}