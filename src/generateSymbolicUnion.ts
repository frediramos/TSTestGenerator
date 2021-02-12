import {IProgramInfo} from "./IProgramInfo"
import * as constants from "./constants";
import * as utils from "./utils";
import * as freshVars from "./freshVars";
import * as TsASTFunctions from "./TsASTFunctions";
import * as generateSymbolicTypes from "./generateSymbolicTypes";

/**
 * 
 */


//::::::::This function generates a symbolic assignment for each type in the union::::::::
export function createUnionType<ts_type>(union_type:ts_type,program_info:IProgramInfo<ts_type>, fuel_var?:string){
  var stmts = [];
  var symb_vars = [];
  var unions = [];
  var control_vars = [];
  var control_nums = [];
  var needs_for = false;
  var fuel_arr:string;
  var index:string;
  var new_fuel_vars:string[] = [];

  //Union variable creation and declaration
  var union = freshVars.freshUnionVar();
  var union_str = `var ${union}`; 
  stmts.push(utils.str2ast(union_str));

  //Checks the union_type "types" array to find which types the union can be
  for(var i =0;i<union_type["types"].length;i++){
    //Generates the variable for each possible union type
    var ret = generateSymbolicTypes.createSymbAssignment(union_type["types"][i],program_info, fuel_var);

    //Checks if any argument has more than one possible value
    if(ret.control!==undefined){
      control_vars = control_vars.concat(ret.control);
      control_nums = control_nums.concat(ret.control_num);
    }    
    symb_vars.push(ret.var);

    if(ret["needs_for"]) {
      needs_for = true;
      fuel_arr = ret["fuel_var"];       //Fuel array used for the recursive construction
      index = ret["index_var"];             //Index to access the positions of the fuel array
    }

    if(ret["new_fuel_vars"]) {
      new_fuel_vars = new_fuel_vars.concat(ret["new_fuel_vars"]);
    }
  
    //Union var assignment to one of the possible types
    union_str =`${union} = ${ret.var}`;
    unions.push(TsASTFunctions.generateBlock(ret.stmts.concat(utils.str2ast(union_str))));
  }

  //Generates the switch statement and the control var that will decide which assignment is made to the union var
  var control_var = freshVars.freshControlUnionVar(); 
  var switch_stmt = TsASTFunctions.createSwitchStmtVar(control_var, unions);
  stmts.push(switch_stmt); 
  stmts.push(utils.str2ast(constants.ENTER_STR));

  control_vars.push(control_var);
  control_nums.push(union_type["types"].length);
  
  return {
    stmts:stmts,
    var: union, 
    control: control_vars,
    control_num: control_nums,
    new_fuel_vars: new_fuel_vars
  }
}