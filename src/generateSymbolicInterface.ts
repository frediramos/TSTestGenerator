import {IProgramInfo} from "./IProgramInfo"
import * as utils from "./utils";
import * as TsASTFunctions from "./TsASTFunctions";
import * as generateSymbolicTypes from "./generateSymbolicTypes";

//::::::::This function generates the mock constructor for an interface::::::::
export function createInterfaceMockConstructor<ts_type>(interface_name:string, program_info:IProgramInfo<ts_type>){
    var stmts = [];
    var control_vars = [];
    var control_nums = [];
  
    var interface_properties_info = program_info.getInterfacePropertiesInfo(interface_name);
    //Iterates over all the properties of an interface
    Object.keys(interface_properties_info).forEach(function (property_name) {
      //Generates the property type variable and assigns the object property to this variable
      var ret = generateSymbolicTypes.createSymbAssignment(interface_properties_info[property_name],program_info);
      stmts=stmts.concat(ret.stmts); 
      var property_assigment_str = `this.${property_name} = ${ret.var};`
      stmts.push(utils.str2ast(property_assigment_str));
  
      //Checks if any argument has more than one possible value
      if(ret.control!==undefined){
        control_vars = control_vars.concat(ret.control);
        control_nums = control_nums.concat(ret.control_num);
      }    
    });
    
    return {
      stmts: TsASTFunctions.createFunctionDeclaration(interface_name,stmts,control_vars),
      control: control_vars,
      control_num: control_nums
    }
}