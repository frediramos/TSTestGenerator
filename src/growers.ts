import * as fs from "fs";
import * as freshVars from "./freshVars";
import * as TsASTFunctions from "./TsASTFunctions";
import {IProgramInfo} from "./IProgramInfo";
import * as constants from "./constants";
import { str2ast } from "./utils";
import * as generateSymbolicTypes from "./generateSymbolicTypes";

export function addGrowers<ts_type>(program_info:IProgramInfo<ts_type>, json_file:string|undefined) : void {
    if(!json_file)  return;

    var json_file_content = fs.readFileSync(json_file, 'utf8');
    var obj = JSON.parse(json_file_content);
    Object.keys(obj.growers).forEach(class_name => {
        for(var i = 0; i < obj.growers[class_name].length; i++) {
            program_info.addClassGrower(class_name, obj.growers[class_name][i]);
        }
    })
}

export function generateGrower<ts_type>(class_name:string, class_growers_info:string[], program_info : IProgramInfo<ts_type>) {
    var stmts = []

    var fuel_var = freshVars.freshFuelVar();
    var fuel_var_declaration = TsASTFunctions.createFuelVarDeclr(fuel_var, freshVars.freshChoiceSuffix());
    stmts.push(fuel_var_declaration);

    var single_grower_str = constants.SINGLE_GROW_STR+class_name;
    var while_str = `while(${fuel_var} > 0) {
        ${single_grower_str}(${constants.OBJECT_STR});
        ${fuel_var}--;
    }`;

    stmts.push(str2ast(while_str));

    return {
        single: generateSingleGrower(class_name, class_growers_info, program_info),
        wrapper: TsASTFunctions.createFunctionDeclaration(constants.GROW_STR+class_name, stmts, [constants.OBJECT_STR])
    }
}

function generateSingleGrower<ts_type>(class_name:string, class_growers_info:string[], program_info : IProgramInfo<ts_type>) {
    var stmts = [];
    var switch_branches = [];

    for(var i = 0; i < class_growers_info.length; i++) {
        var method_info = program_info.getClassMethodInfo(class_name, class_growers_info[i]);
        
        //Creates the arguments of the method
        var ret_args = generateSymbolicTypes.createArgSymbols(method_info.arg_types,program_info);
        var ret_stmts = ret_args.stmts;
        
        //Checks if any argument needs recursive construction
        if(ret_args["new_fuel_vars"]) {
            ret_stmts = createFuelVarDeclrs(ret_args["new_fuel_vars"]).concat(ret_stmts);
        }

        //Checks if any argument has more than one possible value
        if(ret_args.control[0]!==undefined){
            ret_stmts = createControlVarDeclrs(ret_args.control, ret_args.control_num).concat(ret_stmts);
        }

        var method_call_str = `${constants.OBJECT_STR}.${class_growers_info[i]}(${ret_args.vars_str});`
        ret_stmts.push(str2ast(method_call_str));

        switch_branches.push(TsASTFunctions.generateBlock(ret_stmts));
    }

    if(class_growers_info.length > 1) {
        var control_grower_var = freshVars.freshControlGrowerVar();
        var number_growers = class_growers_info.length;
        var control_var_declaration = TsASTFunctions.createControlVarDeclr(control_grower_var, number_growers, freshVars.freshChoiceSuffix());
        stmts.unshift(control_var_declaration); 
        stmts.push(TsASTFunctions.createSwitchStmtVar(control_grower_var, switch_branches));
    } else {
        stmts = switch_branches[0].body;
    }
    
    return TsASTFunctions.createFunctionDeclaration(constants.SINGLE_GROW_STR+class_name, stmts, [constants.OBJECT_STR]);
}

function createControlVarDeclrs(control_vars:string[], control_nums:number[]) {
    var stmts = []
    for(var i = 0; i < control_vars.length; i++) {
        var control_var_declaration = TsASTFunctions.createControlVarDeclr(control_vars[i], control_nums[i], freshVars.freshChoiceSuffix());
        stmts.push(control_var_declaration); 
    }
    return stmts;
}

function createFuelVarDeclrs(fuel_vars:string[]) {
    var stmts = []
    for(var i = 0; i < fuel_vars.length; i++) {
        var fuel_var_declaration = TsASTFunctions.createFuelVarDeclr(fuel_vars[i], freshVars.freshChoiceSuffix());
        stmts.push(fuel_var_declaration); 
    }
    return stmts;
} 