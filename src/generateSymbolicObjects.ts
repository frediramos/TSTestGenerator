import {IProgramInfo} from "./IProgramInfo"
import * as utils from "./utils";
import * as freshVars from "./freshVars";
import * as TsASTFunctions from "./TsASTFunctions";
import * as generateSymbolicTypes from "./generateSymbolicTypes";

//::::::::This function creates the name for the create object function::::::::
function getCreateMethodName(class_name:string):string{
    return "create"+class_name;
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

  var call = `var ${obj_var} = ${getCreateMethodName(class_name)}();`;

  return {
    stmts: [utils.str2ast(call)],
    var: obj_var,
    control: [],
    control_num: [],
    fuel_var: ""
  }
}

//::::::::This function generates the call of a constructor recursively with symbolic parameters::::::::
export function createObjectRecursiveCall<ts_type>(class_name:string, program_info:IProgramInfo<ts_type>, fuel_var?:string){
    var recurs_obj_var:string = freshVars.freshObjectVar();
    
    var new_fuel_vars = [];
    var fuel_var_str:string;
    if(!fuel_var){
      var fuel_var = freshVars.freshFuelVar();
      new_fuel_vars.push(fuel_var);
      fuel_var_str = fuel_var;
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
      new_fuel_vars: new_fuel_vars
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
    var new_fuel_vars:string[] = [];
    var class_constructors = program_info.getClassConstructorsInfo(class_name);
    
    //Creates the fuel var and the if statement at the beginning of the create function for objects with cyclic construction
    var fuel_var:string = freshVars.freshFuelVar();
    var if_has_fuel_ast = TsASTFunctions.generateIfFuelStatement(fuel_var);
    stmts.push(if_has_fuel_ast);
  
    //In case there is more than one constructor it will use the value popped of the fuel var in the switch statement
    var fuel_dec_str:string = `${fuel_var}--;`
    stmts.push(utils.str2ast(fuel_dec_str));
    
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

      if(ret.new_fuel_vars){
        new_fuel_vars = new_fuel_vars.concat(ret.new_fuel_vars);
      }
  
      //Generates the return statement for the object that was constructed
      var obj_var = freshVars.freshObjectVar();
      var obj_assignment_str = `var ${obj_var} = ${class_name}(${ret.vars_str});`
      var case_stmts = ret.stmts.concat(utils.str2ast(obj_assignment_str));
  
      var grow_call_str = `grow${class_name}(${obj_var});`;
      
      case_stmts = case_stmts.concat(utils.str2ast(grow_call_str))
      var obj_ret = TsASTFunctions.generateReturnVar(obj_var);
      
      case_stmts = case_stmts.concat(obj_ret).map(utils.makeSubst(subst));
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
      stmts = objs[0].body;
    }

    for(var i = 0; i < control_vars.length; i++) {
      var control_var_declaration = TsASTFunctions.createControlVarDeclr(control_vars[i], control_nums[i]);
      stmts.push(control_var_declaration);
    }

    for(var i = 0; i < new_fuel_vars.length; i++) {
      var fuel_var_declaration = TsASTFunctions.createFuelVarDeclr(new_fuel_vars[i]);
      stmts.unshift(fuel_var_declaration);
    }

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
  var new_fuel_vars:string[] = [];
  var class_constructors = program_info.getClassConstructorsInfo(class_name);

  //Iterates over all the object constructors 
  for(var i=0; i<class_constructors.length; i++){
    symb_vars=[];

    //Creates the arguments for the object constructor
    var ret = generateSymbolicTypes.createArgSymbols(class_constructors[i].arg_types,program_info);
    symb_vars = symb_vars.concat(ret.vars);
    //Checks if any argument has more than one possible value
    if(ret.control){
      var subst = updateGlobalControlVars(control_vars, ret.control);
      updateGlobalControlNums(control_nums, ret.control_num);
    }

    if(ret.new_fuel_vars){
      new_fuel_vars = new_fuel_vars.concat(ret.new_fuel_vars);
    }

    //Generates the return statement for the object that was constructed
    //var obj_ret = TsASTFunctions.generateReturnCall(class_name,ret.vars);

    var obj_var = freshVars.freshObjectVar();
    var obj_assignment_str = `var ${obj_var} = ${class_name}(${ret.vars_str});`
    var case_stmts = ret.stmts.concat(utils.str2ast(obj_assignment_str));

    var grow_call_str = `grow${class_name}(${obj_var});`;
    
    case_stmts = case_stmts.concat(utils.str2ast(grow_call_str))
    var obj_ret = TsASTFunctions.generateReturnVar(obj_var);
    
    case_stmts = case_stmts.concat(obj_ret).map(utils.makeSubst(subst));

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
    stmts = objs[0].body;
  }

  for(var i = 0; i < control_vars.length; i++) {
    var control_var_declaration = TsASTFunctions.createControlVarDeclr(control_vars[i], control_nums[i]);
    stmts.unshift(control_var_declaration);
  }

  for(var i = 0; i < new_fuel_vars.length; i++) {
    var fuel_var_declaration = TsASTFunctions.createFuelVarDeclr(new_fuel_vars[i]);
    stmts.unshift(fuel_var_declaration);
  }

  return {
    func: TsASTFunctions.createFunctionDeclaration(getCreateMethodName(class_name), stmts, []),
    control_vars: [],
    control_nums: [],
    fuel: 0
  }
}