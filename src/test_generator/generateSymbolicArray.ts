import {IProgramInfo} from "./IProgramInfo"
import * as constants from "./constants";
import * as utils from "./utils";
import * as freshVars from "./freshVars";
import * as TsASTFunctions from "./TsASTFunctions";
import * as generateSymbolicTypes from "./generateSymbolicTypes";

//::::::::This function generates an array of its type::::::::
export function createArrayOfType<ts_type>(arr_type:ts_type,program_info:IProgramInfo<ts_type>){
    var stmts = [];
    var symb_vars = [];
    var arrays = [];
    var control_vars = [];
    var control_nums = [];
  
    var arr = freshVars.freshArrayVar();
    var arr_str = `var ${arr}`; 
    stmts.push(utils.str2ast(arr_str));
    arr_str =`${arr} = []`;
    arrays.push(utils.str2ast(arr_str));
  
    //Getting the type of the array 
    var arg_type = program_info.getTypeOfTheArray(arr_type);
  
    //Generation of the three possible arrays 
    for(var i = 0;i<constants.BRANCHING_LIMIT;i++){
      //Creation of a variable assignment that will be the variable placed in the array
      var ret = generateSymbolicTypes.createSymbAssignment(arg_type,program_info);
      
      //Checks if any argument has more than one possible value
      if(ret.control!==undefined){
        control_vars = control_vars.concat(ret.control);
        control_nums = control_nums.concat(ret.control_num);
      }    
    
      stmts = stmts.concat(ret.stmts);
      symb_vars.push(ret.var); 
  
      //Create a string with the arguments in parameters of function format "x_1,x_2", for example
      var args_str = symb_vars.reduce(function (cur_str, prox) {
        if (cur_str === "") return prox; 
        else return cur_str + ", " + prox; 
      },"");
    
      //Array var assignment
      arr_str =`${arr} = [${args_str}]`;
      arrays.push(utils.str2ast(arr_str));
    }
  
    //Creation of the switch statement such as the control var that decides which array assignment is made
    var control_var = freshVars.freshControlArrVar(); 
    var switch_stmt = TsASTFunctions.createSwitchStmtVar(control_var, arrays);
    stmts.push(switch_stmt); 
    stmts.push(utils.str2ast(constants.ENTER_STR));
  
    control_vars.push(control_var);
    control_nums.push(constants.BRANCHING_LIMIT+1);
    
    return {
      stmts:stmts,
      var: arr, 
      control: control_vars,
      control_num: control_nums
    }
  }