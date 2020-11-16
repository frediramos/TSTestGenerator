import {IProgramInfo} from "./IProgramInfo"
import * as utils from "./utils";
import * as freshVars from "./freshVars";

//::::::::This function generates an assertion to check if the return type of a function is a string:::::::: 
function generateFinalStringAsrt(ret_var:string) { 
  var x = freshVars.freshAssertVar();
  
  var ret_str = `var ${x} = typeof ${ret_var} === "string";`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x
  } 
}

//::::::::This function generates an assertion to check if the return type of a function is a number:::::::: 
function generateFinalNumberAsrt(ret_var:string) { 
  var x = freshVars.freshAssertVar();

  var ret_str = `var ${x} = typeof ${ret_var} === "number";`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x
  }
}

//::::::::This function generates an assertion to check if the return type of a function is a boolean:::::::: 
function generateFinalBooleanAsrt(ret_var:string) { 
  var x = freshVars.freshAssertVar();

  var ret_str = `var ${x} = typeof ${ret_var} === "boolean";`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x
  }
}

//::::::::This function generates an assertion to check if the return type of a function is null:::::::: 
function generateFinalNullAsrt(ret_var:string) { 
  var x = freshVars.freshAssertVar();

  var ret_str = `var ${x} = ${ret_var} === null;`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x
  }
}

//::::::::This function generates an assertion to check if the return type of a function is undefined:::::::: 
function generateFinalVoidAsrt(ret_var:string) { 
  var x = freshVars.freshAssertVar();

  var ret_str = `var ${x} = typeof ${ret_var} === "undefined";`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x
  }
}

//::::::::This function generates an assertion to check if the return type of a function is an instance of an object::::::::
function generateFinalObjectAsrt(ret_var:string,ret_type: string) { 
  var x = freshVars.freshAssertVar();

  var ret_str = `var ${x} = ${ret_var} instanceof ${ret_type};`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x
  }
}

//::::::::This function generates an assertion to check if the return type of a function is one of the types in an Union::::::::
function generateFinalUnionAsrt(stmts,assert_vars: string[]) { 
  var x = freshVars.freshAssertVar();
  
  var ret_str = `var ${x} = ${assert_vars[0]}`; 
  for(var i = 1;i<assert_vars.length;i++){
    ret_str += ` || ${assert_vars[i]}`;
  }
  ret_str += `;`
  stmts.push(utils.str2ast(ret_str));
  return {
    stmt:stmts,
    var:x
  }
}

//::::::::This function generates an assertion to check if the return type of a function is an instance of an object::::::::
function generateFinalObjectLiteralAsrt(stmts,assert_vars: string[]) { 
  var x = freshVars.freshAssertVar();

  var ret_str = `var ${x} = ${assert_vars[0]}`; 
  for(var i = 1;i<assert_vars.length;i++){
      ret_str += ` && ${assert_vars[i]}`;
  }
  ret_str += `;`
  stmts.push(utils.str2ast(ret_str));
  return {
      stmt:stmts,
      var:x
  }
}


//::::::::This function generates an assertion to check if the return type of a function is a string:::::::: 
function generateFinalAnyAsrt(ret_var:string) { 
  var x = freshVars.freshAssertVar();
  var ret_str = `var ${x} = true;`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x
  } 
}



//::::::::This function generates an assertion to check the return type ::::::::
export function generateFinalAsrt<ts_type>(ret_type:ts_type, ret_var:string, program_info : IProgramInfo<ts_type>) {

  //Turns the type into a string
  var ret_type_str = program_info.getStringFromType(ret_type);
  
  //Based on the type it will decide which assertion the program will generate
  switch(ret_type_str) {
    //If the type is a string it will generate the assertion to a string
    case "string" : return generateFinalStringAsrt(ret_var); 

    //If the type is a number it will generate the assertion to a number
    case "number" : return generateFinalNumberAsrt(ret_var); 

    //If the type is a boolean it will generate the assertion to a boolean
    case "boolean" : return generateFinalBooleanAsrt(ret_var); 

    //If the type is null it will generate the assertion to null
    case "null" : return generateFinalNullAsrt(ret_var); 

    //If the type is null it will generate the assertion to undefined
    case "void" : 
    case "undefined" : return generateFinalVoidAsrt(ret_var); 

    case "any": return generateFinalAnyAsrt(ret_var); 
    
    //if the type is not a primitive type
    default: 
      //If the type is a class it will assert to an instance of that class
      if (program_info.hasClass(ret_type_str)) {
        return  generateFinalObjectAsrt(ret_var, ret_type_str);
      } 

      //If the type is a class it will assert to an instance of that interface
      if (program_info.hasInterface(ret_type_str)) {
        return  generateFinalObjectAsrt(ret_var, ret_type_str);
      } 

      //If the type is an union it will assert to one of the possible types
      else if(program_info.isUnionType(ret_type)){
        var assert_vars = [];
        var stmts = [];

        //Generate an assert for each possible type that the Union can be 
        for(var i = 0;i<ret_type["types"].length;i++){
          var type_asrt = generateFinalAsrt(ret_type["types"][i], ret_var, program_info);
          assert_vars.push(type_asrt.var);
          stmts = stmts.concat(type_asrt.stmt);
        }
        return generateFinalUnionAsrt(stmts,assert_vars);
      } 

      //If the type is an object literal it will assert each property to the respective type
      if (program_info.isObjectLiteralType(ret_type)) {
        var assert_vars = [];
        var stmts = [];

        var object_literal_dictionary = program_info.getObjectLiteralPropertyTypes(ret_type);

        //Generates the assert of each property of the object literal
        Object.keys(object_literal_dictionary).forEach(function (property_name) {

          var type_asrt = generateFinalAsrt(object_literal_dictionary[property_name], ret_var+"."+property_name, program_info);
      
          assert_vars.push(type_asrt.var);
          stmts = stmts.concat(type_asrt.stmt);
        });
        
        return  generateFinalObjectLiteralAsrt(stmts, assert_vars);
      } 
      
      //If the type reaches this case it is a type that the assertion is unsupported by the testGenerator
      else {
        throw new Error ("generateFinalAsrt: Unsupported type: "+ret_type_str)
      }
  }
}