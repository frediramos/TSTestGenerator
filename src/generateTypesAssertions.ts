import {IProgramInfo} from "./IProgramInfo"
import * as utils from "./utils";
import * as freshVars from "./freshVars";

// Generate for loop for array iteration
/* 
 - ret_var -> nome da variavel que vai guardar o Booleano que denota se todos os elementos do array tem o tipo adequado  
 - var_iterator_name -> i 
 - var_arr_name -> arr
 - body_verification_stmt -> Codigo que verifica que arr[i] tem o tipo adequado 
 - body_verification_expr -> variavel com o resultado da verificacao - b


for (var i = 0; i<arr.length; i++) {
   body_verification_stmt
   ret = ret && b
}
*/
function generateForStmtArrayIteration (ret_var, var_iterator_name, var_arr_name, body_verification_stmt, body_verification_expr) {
  return {
    "type": "ForStatement",
    "init": {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": "i"
          },
          "init": {
            "type": "Literal",
            "value": 0,
            "raw": "0"
          }
        }
      ],
      "kind": "var"
    },
    "test": {
      "type": "BinaryExpression",
      "operator": "<",
      "left": {
        "type": "Identifier",
        "name": "i"
      },
      "right": {
        "type": "MemberExpression",
        "computed": false,
        "object": {
          "type": "Identifier",
          "name": "v2"
        },
        "property": {
          "type": "Identifier",
          "name": "length"
        }
      }
    },
    "update": {
      "type": "UpdateExpression",
      "operator": "++",
      "argument": {
        "type": "Identifier",
        "name": "i"
      },
      "prefix": false
    },
    "body": {
      "type": "BlockStatement",
      "body": []
    }
  }


}


//::::::::This function generates an assertion to check if the return type of a function is a string:::::::: 
function generateFinalStringAsrt(ret_var:string) { 
  var x = freshVars.freshAssertVar();
  
  var ret_str = `var ${x} = typeof ${ret_var} === "string";`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x,
    expr_str: `typeof ${ret_var} === "string"`
  } 
}

//::::::::This function generates an assertion to check if the return type of a function is a number:::::::: 
function generateFinalNumberAsrt(ret_var:string) { 
  var x = freshVars.freshAssertVar();

  var ret_str = `var ${x} = typeof ${ret_var} === "number";`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x,
    expr_str: `typeof ${ret_var} === "number"`
  }
}

//::::::::This function generates an assertion to check if the return type of a function is a boolean:::::::: 
function generateFinalBooleanAsrt(ret_var:string) { 
  var x = freshVars.freshAssertVar();

  var ret_str = `var ${x} = typeof ${ret_var} === "boolean";`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x,
    expr_str: `typeof ${ret_var} === "boolean"`
  }
}

//::::::::This function generates an assertion to check if the return type of a function is null:::::::: 
function generateFinalNullAsrt(ret_var:string) { 
  var x = freshVars.freshAssertVar();

  var ret_str = `var ${x} = ${ret_var} === null;`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x,
    expr_str: `${ret_var} === "null"`
  }
}

//::::::::This function generates an assertion to check if the return type of a function is undefined:::::::: 
function generateFinalVoidAsrt(ret_var:string) { 
  var x = freshVars.freshAssertVar();

  var ret_str = `var ${x} = typeof ${ret_var} === "undefined";`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x,
    expr_str: `typeof ${ret_var} === "undefined"`
  }
}

//::::::::This function generates an assertion to check if the return type of a function is an instance of an object::::::::
function generateFinalObjectAsrt(ret_var:string,ret_type: string) { 
  var x = freshVars.freshAssertVar();

  var ret_str = `var ${x} = ${ret_var} instanceof ${ret_type};`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x,
    expr_str: `${ret_var} instanceof ${ret_type}`
  }
}

//::::::::This function generates an assertion to check if the return type of a function is one of the types in an Union::::::::
function generateFinalUnionAsrt<ts_type>(ret_type:ts_type,ret_var:string, program_info : IProgramInfo<ts_type>) { 
  var x = freshVars.freshAssertVar();
  var assert_vars = [];
  var stmts = [];
  var expr_str:string = "";

  //Generate an assert for each possible type that the Union can be 
  for(var i = 0;i<ret_type["types"].length;i++){
    var type_asrt = generateFinalAsrt(ret_type["types"][i], ret_var, program_info);

    expr_str = i === 0 ? type_asrt.expr_str : expr_str + "||" + type_asrt.expr_str;
    assert_vars.push(type_asrt.var);
    stmts = stmts.concat(type_asrt.stmt);
  }

  var ret_str = `${assert_vars[0]}`; 
  for(var i = 1;i<assert_vars.length;i++){
    ret_str += ` || ${assert_vars[i]}`;
  }

  var ret_str_stmt = `var ${x} = ${ret_str};`

  stmts.push(utils.str2ast(ret_str_stmt));
  return {
    stmt:stmts,
    var:x,
    expr_str: expr_str
  }
}

//::::::::This function generates an assertion to check if the return type of a function is an instance of an object::::::::
function generateFinalObjectLiteralAsrt<ts_type>(ret_type:ts_type,ret_var:string, program_info : IProgramInfo<ts_type>) { 
  var x = freshVars.freshAssertVar();
  var object_literal_dictionary = program_info.getObjectLiteralPropertyTypes(ret_type);
  var type_asrt_str =`(typeof ${ret_var} === 'object')`;

  //Generates the assert of each property of the object literal
  Object.keys(object_literal_dictionary).forEach(function (property_name) {
    // ISTO ESTA MAL!!!!!!!!!!!!!
    // E OS STATEMENTS GERADOS A PARTIR DO TIPO DE RETORNO? 
    var type_asrt = generateFinalAsrt(object_literal_dictionary[property_name], ret_var+"."+property_name, program_info);
    type_asrt_str += "&& (" + type_asrt.expr_str + ")";
  });

  var type_asrt_str_2 = `var ${x} = ${type_asrt_str};`
  
  return {
      stmt:utils.str2ast(type_asrt_str_2),
      var:x,
      expr_str: type_asrt_str
  }
}


function generateFinalArrayLiteralAsrt<ts_type>(ret_type:ts_type, ret_var:string, program_info:IProgramInfo<ts_type>) {
  var i = freshVars.freshIndexVar();
  var type_asrt_str =`(typeof ${ret_var} === 'object')`;

  var instance_of_asrt_str = `(${ret_var} instanceof Array)`; 

  var arr_content_type = program_info.getTypeOfTheArray(ret_type); 
  
  var type_asrt = generateFinalAsrt(arr_content_type, ret_var+"[i]", program_info);
 

  





}


//::::::::This function generates an assertion to check if the return type of a function is a string:::::::: 
function generateFinalAnyAsrt() { 
  var x = freshVars.freshAssertVar();
  var ret_str = `var ${x} = true;`; 
  return {
    stmt:[utils.str2ast(ret_str)],
    var:x,
    expr_str: "true"
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

    case "any": return generateFinalAnyAsrt(); 
    
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
        return generateFinalUnionAsrt(ret_type, ret_var, program_info);
      } 

      //If the type is an object literal it will assert each property to the respective type
      if (program_info.isObjectLiteralType(ret_type)) {        
        return  generateFinalObjectLiteralAsrt(ret_type, ret_var, program_info);
      } 
      
      if (program_info.isArrayType(ret_type)) {
        return generateFinalArrayLiteralAsrt(ret_type, ret_var, program_info);
      }

      //If the type reaches this case it is a type that the assertion is unsupported by the testGenerator
      else {
        throw new Error ("generateFinalAsrt: Unsupported type: "+ret_type_str)
      }
  }
}