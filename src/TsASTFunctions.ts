import * as constants from "./constants";
import * as utils from "./utils";

//::::::::Turns function expression into function declaration::::::::
export function func_expr2func_decl (fun_name:string, func_expr){
    return{
      type : "FunctionDeclaration",
      id : createIdentifier(fun_name),
      params : func_expr.params,
      body : func_expr.body,
      generator : func_expr.generator,
      expression : func_expr.expression,
      async : func_expr.async
    }
  }

//::::::::This function generates the if statement that checks if the fuel var is empty or not::::::::
export function generateIfFuelStatement(fuel_var:string){
  return {
    type: "IfStatement",
    test: {
      type: "BinaryExpression",
      operator: "===",
      left: {
        type: "MemberExpression",
        computed: false,
        object: {
          type: "Identifier",
          name: fuel_var
        },
        property: {
          type: "Identifier",
          name: "length"
        }
      },
      right: {
        type: "Literal",
        value: 0,
        raw: "0"
      }
    },
    consequent: {
      type: "ReturnStatement",
      argument: {
        type: "Literal",
        value: null,
        raw: "null"
      }
    },
    alternate: null
  }
}

//::::::::This function generates the call of a return statement given a class and its arguments::::::::
export function generateReturnCall(class_name:string,args:string[]){
  var args_ast = args.map(x=>{return{
          type: "Identifier",
          name: x
        }});
    
  return {
    type: "ReturnStatement",
    argument: {
      type: "NewExpression",
      callee: {
        type: "Identifier",
        name: class_name
      },
      arguments: args_ast
    }
  }
}

//::::::::This function generates the call of a return statement::::::::
export function generateReturnVar(variable:string){
    
  return {
    type: "ReturnStatement",
    argument: {
      type: "Identifier",
      name: variable
    }
  }
}


//::::::::This function generates a for statement::::::::
export function generateForStatement(arr_iterated:string, index:string, stmts) {
  return {
    "type": "ForStatement",
    "init": {
      "type": "VariableDeclaration",
      "declarations": [
        {
          "type": "VariableDeclarator",
          "id": {
            "type": "Identifier",
            "name": index
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
        "name": index
      },
      "right": {
        "type": "MemberExpression",
        "computed": false,
        "object": {
          "type": "Identifier",
          "name": arr_iterated
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
        "name": index
      },
      "prefix": false
    },
    "body": {
      "type": "BlockStatement",
      "body": stmts
    }
  }
}

//::::::::Function used to create an identifier::::::::
function createIdentifier(x){
  return {
    type:"Identifier",
    name:x
  }
}

//::::::::Function used to create a function declaration::::::::
export function createFunctionDeclaration(method_name:string,stmts,params_str:string[]){
  var params = [];

  //Fills the params array with the parameter format that will be used to create the function declaration
  for(var i=0;i<params_str.length;i++){
    params.push(createIdentifier(params_str[i]));
  }

  return{
    type : "FunctionDeclaration",
    id : createIdentifier(method_name),
    params : params,
    body : generateBlock(stmts),
    generator : false,
    expression : false,
    async : false
  }
}

export function createFunctionExpression(stmts,params_str:string[]) {
  var params = [];

  //Fills the params array with the parameter format that will be used to create the function declaration
  for(var i=0;i<params_str.length;i++){
    params.push({
      type:"Identifier",
      name: params_str[i]
    })
  }

  return{
    type : "FunctionDeclaration",
    id : null,
    params : params,
    body : generateBlock(stmts),
    generator : false,
    expression : false,
    async : false
  }
}

export function createProperty(property_name:string, var_name:string){
  return {
    "type": "Property",
    "key": {
      "type": "Identifier",
      "name": property_name
    },
    "computed": false,
    "value": {
      "type": "Identifier",
      "name": var_name
    },
    "kind": "init",
    "method": false,
    "shorthand": false
  }
}

export function createLiteralObjectDeclaration(ret_var:string, properties:string[]){
  return  {
    "type": "VariableDeclaration",
    "declarations": [
      {
        "type": "VariableDeclarator",
        "id": {
          "type": "Identifier",
          "name": ret_var
        },
        "init": {
          "type": "ObjectExpression",
          "properties": properties
        }
      }
    ],
    "kind": "var"
  }
}


//This function will generate the assignment of a prototype to a Mock function
export function createPrototypeAssignment(interface_name:string, method_name:string, interface_mock_method){
  return {
    "type": "AssignmentExpression",
    "operator": "=",
    "left": {
      "type": "MemberExpression",
      "computed": false,
      "object": {
        "type": "MemberExpression",
        "computed": false,
        "object": {
          "type": "Identifier",
          "name": interface_name
        },
        "property": {
          "type": "Identifier",
          "name": "prototype"
        }
      },
      "property": {
        "type": "Identifier",
        "name": method_name
      }
    },
    "right": interface_mock_method
  }
}

//::::::::This function creates the default case of the switch::::::::
function createDefaultCaseStmt(block) {
  return {
    type: "SwitchCase",
    test: null,
    consequent: [ block ]
  }
}


//::::::::This function creates a case of the switch ::::::::
function createCaseStmt (i, block) {
  return {
    type: "SwitchCase",
    test: {
      "type": "Literal",
      "value": i+1,
      "raw": (i+1)+""
    },
    consequent: [ block,{
      type: "BreakStatement",
      test: null
    } ]
  }
}

//::::::::This function creates a switch statement::::::::
export function createSwitchStmt (control_var, blocks) {
  var cases = [];
  
  //Creation of the numbered cases
  for (var i=0; i<blocks.length-1; i++) {
    cases.push(createCaseStmt(i, blocks[i]));
    cases.push(utils.str2ast(constants.ENTER_STR));
  }
  //Creation of the default case
  cases.push(createDefaultCaseStmt(blocks[blocks.length-1]));
  cases.push(utils.str2ast(constants.ENTER_STR));

  return {
    type: "SwitchStatement",
    discriminant: {
      type: "Identifier",
      name: control_var
    },
    cases: cases
  }
}

//::::::::This function generates the output block::::::::
export function generateBlock(stmts) {
  return {
      type: "BlockStatement",
      body: stmts
  }
}