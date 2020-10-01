var esprima = require('esprima');
var escodegen = require('escodegen');
var fs = require('fs');
import finder = require("./finder");
import ts = require("typescript");
import { setMaxListeners } from "process";


//Class used to store the Cosette functions
class CosetteFunctions {
  number_creator:string = "symb_number"
  string_creator:string = "symb_string"
  boolean_creator:string = "symb_boolean"
  null_creator:string = "null"
  void_creator:string = "undefined"

  //function that will return the string of the call of the symbolic number creator
  numberCreator(x:string):string{
    return `${this.number_creator}(${x})`
  }

  //function that will return the string of the call of the symbolic string creator
  stringCreator(x:string):string{
    return `${this.string_creator}(${x})`
  }

  //function that will return the string of the call of the symbolic boolean creator
  booleanCreator(x:string):string{
    return `${this.boolean_creator}(${x})`
  }
  
  //function that will return the string of the call of the null creator
  nullCreator():string{
    return `${this.null_creator}`
  }

  //function that will return the string of the call of the void creator
  voidCreator():string{
    return `${this.void_creator}`
  }

  //function that will return the string of the assertion of a typeof 
  assertCreator(x:string,t:string):string{
    return `Assert(typeof ${x} === "${t}");`
  }
}

var cosFunc = new CosetteFunctions(); 


//Limit of the branching
const BRANCHING_LIMIT = 3;

//Limit of the recursive call of a cyclic construction
const FUEL = 3;


//Constants created for string manipulation in the end of the tests generation
const ENTER_FUNC = str2ast("$Enter$()");
const SPACE_STR = "$Space$";
const COLONS_STR = "$Colons$";
const APOSTROPHE_STR = "$Apostrophe$";


//::::::::Turns ast into string::::::::
function ast2str (e) {

     try { 
      const option = {
        format : {
          quotes : 'single',
          indent : {
            style : '\t'
          }
        }
      }; 
      return escodegen.generate(e, option);
     } catch (err) { 
      if ((typeof e) === "object") { 
        console.log("converting the following ast to str:\n" + e);
      } else { 
        console.log("e is not an object!!!")
      }
      throw "ast2str failed."; 
     }
}


//::::::::Turns string into ast::::::::
function str2ast (str:string) {
  var ast = esprima.parse (str); 

  return ast.body[0];
}


//::::::::Turns function expression into function declaration::::::::
function func_expr2func_decl (fun_name:string, func_expr){
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


//::::::::Function used to create some special characters in the output file::::::::
function stringManipulation(test_str:string):string{

  var test_str_ret1 = test_str.split("$Enter$();").join("");
  var test_str_ret2 = test_str_ret1.split("Comment1").join("/* ");
  var test_str_ret3 = test_str_ret2.split("Comment2();").join(" */");
  var test_str_ret4 = test_str_ret3.split("$Space$").join(" ");
  var test_str_ret5 = test_str_ret4.split("$Colons$").join(": ");
  var test_str_ret6 = test_str_ret5.split("$Apostrophe$").join("'");

  return test_str_ret6;
}


//::::::::Checks if the given type is a function type::::::::
function isFunctionType(arg_type:ts.Type,program_info:finder.ProgramInfo){

  var arg_str =program_info.Checker.typeToString(arg_type);
  return arg_str.includes("=>"); 
}


//::::::::Checks if the given type is an array type::::::::
function isArrayType(arr_type:ts.Type){
  return arr_type.symbol && arr_type.symbol.name==="Array";
}


//::::::::Checks if the given type is an union type::::::::
function isUnionType(union_type:ts.Type){
  return union_type.hasOwnProperty("types");
}


//::::::::Function used to create the name of some type of variable with the respective number::::::::
function makeFreshVariable (prefix:string) {
  var count = 0; 

  return function () { 
     count++;  
     return prefix + "_" + count;      
  }
}

//::::::::Function used to create the name of a variable with the respective number::::::::
var freshXVar = makeFreshVariable("x"); 
//::::::::Function used to create the name of an assert variable with the respective number::::::::
var freshAssertVar = makeFreshVariable("a"); 
//::::::::Function used to create the name of an object with the respective number::::::::
var freshObjectVar = makeFreshVariable("obj");
//::::::::Function used to create the name of a mock function with the respective number::::::::
var freshMockFuncVar = makeFreshVariable("mockFunc");
//::::::::Function used to create the name of an array with the respective number::::::::
var freshArrayVar = makeFreshVariable("arr");
//::::::::Function used to create the name of a control variable -> used to select the number of elements of an array ::::::::
var freshControlArrVar = makeFreshVariable("control_arr");
//::::::::Function used to create the name of a control variable -> used to select which object constructor will be used ::::::::
var freshControlObjVar = makeFreshVariable("control_obj");
//::::::::Function used to create the name of a fuel variable with the respective number ::::::::
var freshFuelVar = makeFreshVariable("fuel");
//::::::::Function used to create the name of an union variable with the respective number ::::::::
var freshUnionVar = makeFreshVariable("union");
//::::::::Function used to create the name of a control variable -> used to select which assigment will be made to the union::::::::
var freshControlUnionVar = makeFreshVariable("control_union");


//::::::::Function used to generate the combinations for the control vars::::::::
function createCombinations(args) {
  var r = [];
  var max = args.length-1;
  function helper(arr, i) {
      for (var j=0, l=args[i].length; j<l; j++) {
          var a = arr.slice(0); // clone arr
          a.push(args[i][j]);
          if (i==max)
              r.push(a);
          else
              helper(a, i+1);
      }
  }
  helper([], 0);
  return r;
}


//::::::::Function used to assign a string symbol to a variable::::::::
function createStringSymbAssignment () { 
  var x = freshXVar(); 
  var ret_str = `var ${x} = ${cosFunc.stringCreator(x)}`; 

  return {
      stmts: [str2ast(ret_str)], 
      var: x,
      control: [],
      control_num: []
  } 
}


//::::::::Function used to assign a numerical symbol to a variable::::::::
function createNumberSymbAssignment () { 
    var x = freshXVar(); 
    var ret_str = `var ${x} = ${cosFunc.numberCreator(x)}`; 

    return {
        stmts: [str2ast(ret_str)], 
        var: x,
        control: [],
        control_num: []
    } 
}


//::::::::Function used to assign a boolean symbol to a variable::::::::
function createBooleanSymbAssignment () { 
  var x = freshXVar(); 
  var ret_str = `var ${x} = ${cosFunc.booleanCreator(x)}`; 

  return {
      stmts: [str2ast(ret_str)], 
      var: x,
      control: [],
      control_num: []
  } 
}


//::::::::Function used to assign null to a variable::::::::
function createNullAssignment () { 
  var x = freshXVar(); 
  var ret_str = `var ${x} = ${cosFunc.nullCreator()}`; 

  return {
      stmts: [str2ast(ret_str)], 
      var: x,
      control: [],
      control_num: []
  } 
}


//::::::::Function used to assign undefined to a variable::::::::
function createVoidAssignment () { 
  var x = freshXVar(); 
  var ret_str = `var ${x} = ${cosFunc.voidCreator()}`; 

  return {
      stmts: [str2ast(ret_str)], 
      var: x,
      control: [],
      control_num: []
  } 
}


//::::::::This function creates the name for the create object function::::::::
function getCreateMethodName(class_name:string):string{
  return "create"+class_name;
}


//::::::::This function generates the call of a constructor recursively with symbolic parameters::::::::
function createObjectRecursiveCall(class_name:string,fuel_var:string){
  var recurs_obj_var = freshObjectVar()
  var call = `var ${recurs_obj_var} = ${getCreateMethodName(class_name)}(${fuel_var});`;
  return {
    stmts: [ str2ast(call) ],
    var: recurs_obj_var,
    control: [],
    control_num: []
  }
}


//::::::::This function generates the if statement that checks if the fuel var is empty or not::::::::
function generateIfFuelStatement(fuel_var:string){
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
function generateReturnCall(class_name:string,args:string[]){
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
function generateReturnVar(variable:string){
    
  return {
    type: "ReturnStatement",
    argument: {
      type: "Identifier",
      name: variable
    }
  }
}


//::::::::This function generates the call of a constructor that needs recursive behaviour with symbolic parameters::::::::
function createObjectRecursiveSymbParams(class_name:string, program_info:finder.ProgramInfo){
  
  var symb_vars = [];
  var stmts = []; 
  var objs = [];
  var control_vars = [];
  var control_nums = [];

  //Creates the fuel var and the if statement at the beginning of the create function for objects with cyclic construction
  var fuel_var = freshFuelVar();
  var if_has_fuel_ast = generateIfFuelStatement(fuel_var);
  stmts.push(if_has_fuel_ast);

  //In case there is more than one constructor it will use the value popped of the fuel var in the switch statement
  var control_obj_var = freshControlObjVar();
  var fuel_pop_str = `var ${control_obj_var} = ${fuel_var}.pop();`
  stmts.push(str2ast(fuel_pop_str));
    
  //Generation of all the construction cases, one for each constructor that the object has
  for(var i=0; i<program_info.ConstructorsInfo[class_name].length; i++){
    symb_vars=[];

    //Generation of the constructor arguments
    var ret = createArgSymbols(program_info.ConstructorsInfo[class_name][i].arg_types,program_info,fuel_var);
    symb_vars = symb_vars.concat(ret.vars);
    //Checks if any argument has more than one possible value
    if(ret.control!==undefined){
      control_vars = control_vars.concat(ret.control);
      control_nums = control_nums.concat(ret.control_num);
    }

    //Generates the return statement for the object that was constructed
    var obj_ret = generateReturnCall(class_name,ret.vars);
    objs.push(generateBlock(ret.stmts.concat(obj_ret)));
  }

  //Creates the switch statement that will have all the possible constructions
  var switch_stmt = createSwitchStmt(control_obj_var, objs);
  stmts.push(switch_stmt); 

  stmts.push(ENTER_FUNC);

  control_nums.push(program_info.ConstructorsInfo[class_name].length);
  control_vars.unshift(fuel_var);

  return createFunctionDeclaration(getCreateMethodName(class_name),stmts,control_vars);
}


//::::::::This function generates the call of a constructor with symbolic parameters::::::::
function createObjectSymbParams(class_name:string, program_info:finder.ProgramInfo){
  var symb_vars = [];
  var stmts = []; 
  var objs = [];
  var control_vars = [];
  var control_nums = [];

  //Creates the object var
  var obj = freshObjectVar();

  //Checks if the class_name argument is an interface or not, and if it is a prefix will be added to the obj var name
  if(program_info.hasInterface(class_name))
    obj = "interface_" + obj;

  //Var declaration string
  var obj_str = `var ${obj}`; 
  stmts.push(str2ast(obj_str));

  //Iterates over all the object constructors 
  for(var i=0; i<program_info.ConstructorsInfo[class_name].length; i++){
    symb_vars=[];

    //Creates the arguments for the object constructor
    var ret = createArgSymbols(program_info.ConstructorsInfo[class_name][i].arg_types,program_info);
    symb_vars = symb_vars.concat(ret.vars);
    //Checks if any argument has more than one possible value
    if(ret.control!==undefined){
      control_vars = control_vars.concat(ret.control);
      control_nums = control_nums.concat(ret.control_num);
    }

    //Generation of the object var assignment to a new object of that class
    obj_str =`${obj} = new ${class_name}(${ret.vars_str})`;
    objs.push(generateBlock(ret.stmts.concat(str2ast(obj_str))));
  }

  //Checks if the class has more than one constructor and if it has it will create a switch case for each of them
  if(program_info.ConstructorsInfo[class_name].length>1){
    var control_var = freshControlObjVar(); 
    var switch_stmt = createSwitchStmt(control_var, objs);
    stmts.push(switch_stmt); 
  }
  //If it has only one constructor, it will only use the object var assignment already made
  else{
    stmts.push(objs[0]);
  }

  stmts.push(ENTER_FUNC);

  control_vars.push(control_var);
  control_nums.push(program_info.ConstructorsInfo[class_name].length);

  return {
    stmts: stmts,
    var:obj,
    control: control_vars,
    control_num: control_nums
  }
}


//::::::::Function used to make a symbol assignment to a variable::::::::
function createSymbAssignment (arg_type:ts.Type,program_info:finder.ProgramInfo,fuel_var?:string) { 

  //Turns the type into a string
  var type_str = program_info.Checker.typeToString(arg_type);

  //Based on the type it will decide what the program will generate
  switch (type_str) {
    //If the type is a string generates a symbolic string assignment 
    case "string" : return createStringSymbAssignment(); 

    //If the type is a number generates a symbolic number assignment
    case "number" : return createNumberSymbAssignment();

    //If the type is a boolean generates a symbolic boolean assignment
    case "boolean" : return createBooleanSymbAssignment();

    //If the type is null generates a null assignment
    case "null" : return createNullAssignment();

        //If the type is null generates a undefined assignment
    case "void" : return createVoidAssignment();

    //if the type is not a primitive type
    default:
      //If the type is an object it will generate that object
      if (program_info.hasClass(type_str)) {

        //If the construction of this object leads to a cycle it will be constructed recursively
        if(program_info.cycles_hash[type_str]){
          return createObjectRecursiveCall(type_str,fuel_var);
        } 
        //Otherwise it will be constructed by generating the arguments and a call to its constructor(s)
        else {
          return createObjectSymbParams(type_str,program_info);
        }
      } 
      
      //If the type is an interface it will generate that object via a mock constructor
      else if (program_info.hasInterface(type_str)) {
        return createObjectSymbParams(type_str,program_info);
      } 

      //If the type is a function it will generate a mock function with the same return type to simulate a function being given as parameter 
      else if(isFunctionType(arg_type,program_info)){
        var ret_func_elements = getFunctionElements(arg_type,program_info);
        var fun_name = freshMockFuncVar();
        var func_expr = createMockFunction(ret_func_elements.params, ret_func_elements.ret, program_info);
        var func_decl = func_expr2func_decl(fun_name, func_expr);
        return {
          stmts: [func_decl],
          var: fun_name,
          control: [],
          control_num: []
        }
      } 
      
      //If the type is an array it will generate 3 possible array assignments
      else if(isArrayType(arg_type)){
        return createArrayOfType(arg_type,program_info);
      } 

      //If the type is an union it will generate one assignment for each of the union possible types
      else if(isUnionType(arg_type)){
        return createUnionType(arg_type,program_info);
      } 

      //If the type reaches this case it is a type unsupported by the testGenerator
      else {
        throw new Error ("createSymbAssignment: Unsupported type");
      }
  }
}


//::::::::Function used to create the symbol of the arguments::::::::
function createArgSymbols(arg_types:ts.Type[],program_info:finder.ProgramInfo,fuel_var?:string){
  var symb_vars = [];
  var stmts = []; 
  var control_vars = [];
  var control_nums = [];

  //For each type in the arg_types array generates the variable of the respective type
  for (var i=0; i<arg_types.length; i++) {
    //Creates the variable and assignment of the type
    var ret = createSymbAssignment(arg_types[i],program_info,fuel_var);
    stmts = stmts.concat(ret.stmts); 
    symb_vars.push(ret.var); 
    //Checks if any argument has more than one possible value
    if(ret.control!==undefined){
      control_vars = control_vars.concat(ret.control);   
      control_nums = control_nums.concat(ret.control_num);
    }
      
  }

  //Creates a string with the arguments later used as the parameters of the respective call
  var args_str = symb_vars.reduce(function (cur_str, prox) {
    if (cur_str === "") return prox; 
    else return cur_str + ", " + prox; 
  },"");


  return{
    stmts:stmts,
    vars:symb_vars,
    vars_str:args_str,
    control: control_vars,
    control_num: control_nums
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
function createFunctionDeclaration(method_name:string,stmts,params_str:string[]){
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
    id : createIdentifier(method_name),
    params : params,
    body : generateBlock(stmts),
    generator : false,
    expression : false,
    async : false
  }
}

function createFunctionExpression(stmts,params_str:string[]) {
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


//This function will generate the assignment of a prototype to a Mock function
function createPrototypeAssignment(interface_name:string, method_name:string, interface_mock_method){
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


//::::::::This function generates the call to a function::::::::
function createCall(fun_name:string, arg_types:ts.Type[], program_info:finder.ProgramInfo){
  var stmts = [];

  //The argument types will be generated
  var ret_args = createArgSymbols(arg_types,program_info);
  stmts = stmts.concat(ret_args.stmts);
  //Generation of the function call string using the arguments type string as parameter
  var call = `${fun_name}(${ret_args.vars_str});`
  stmts.push(str2ast(call));
  return stmts;
}


//::::::::This function generates a mock function used as other function argument::::::::
function createMockFunction(arg_types:ts.Type[],ret_type:ts.Type,program_info:finder.ProgramInfo){
  var calls = [];
  
  //Creates the variable assignment for the return type
  var ret_val = createSymbAssignment(ret_type,program_info);
  
  //Generates the argument types
  var ret_args = createArgSymbols(arg_types,program_info);

  for(var i=0;i<arg_types.length;i++){
    //Checks if one of the types is a function
    if(isFunctionType(arg_types[i],program_info)){
      //Generates the call to the function that is a parameter of this mock function
      var function_elements = getFunctionElements(arg_types[i],program_info);
      calls=calls.concat(createCall(ret_args.vars[i], function_elements.params,program_info));
    }
  }

  calls.push(ret_val.stmts[0]);
  calls.push(generateReturnVar(ret_val.var));
  var func_expr = createFunctionExpression(calls,ret_args.vars);
  /*var block_stmt = generateBlock(calls);
  var fun_name = freshMockFuncVar();

  //Creation of the mock function as a string 
  var fun_str= `function ${fun_name} (${ret_args.vars_str}) {
  ${ast2str(block_stmt)}
  return ${ret_val.var};
  }`;*/
  
  /*return {
    stmts: [func_expr],
    var: fun_name
  }*/
  return func_expr;
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
function createSwitchStmt (control_var, blocks) {
  var cases = [];
  
  //Creation of the numbered cases
  for (var i=0; i<blocks.length-1; i++) {
    cases.push(createCaseStmt(i, blocks[i]));
    cases.push(ENTER_FUNC);
  }
  //Creation of the default case
  cases.push(createDefaultCaseStmt(blocks[blocks.length-1]));
  cases.push(ENTER_FUNC);

  return {
    type: "SwitchStatement",
    discriminant: {
      type: "Identifier",
      name: control_var
    },
    cases: cases
  }
}


//::::::::This function generates an array of its type::::::::
function createArrayOfType(arr_type:ts.Type,program_info:finder.ProgramInfo){
  var stmts = [];
  var symb_vars = [];
  var arrays = [];
  var control_vars = [];
  var control_nums = [];

  var arr = freshArrayVar();
  var arr_str = `var ${arr}`; 
  stmts.push(str2ast(arr_str));

  //Getting the type of the array 
  var arg_type = arr_type.getNumberIndexType();

  //Generation of the three possible arrays 
  for(var i =0;i<BRANCHING_LIMIT;i++){
    //Creation of a variable assignment that will be the variable placed in the array
    var ret = createSymbAssignment(arg_type,program_info);
    
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
    arrays.push(str2ast(arr_str));
  }

  //Creation of the switch statement such as the control var that decides which array assignment is made
  var control_var = freshControlArrVar(); 
  var switch_stmt = createSwitchStmt(control_var, arrays);
  stmts.push(switch_stmt); 
  stmts.push(ENTER_FUNC);

  control_vars.push(control_var);
  control_nums.push(BRANCHING_LIMIT);
  
  return {
    stmts:stmts,
    var: arr, 
    control: control_vars,
    control_num: control_nums
  }
}


//::::::::This function gets the parameters and return types of a function::::::::
function getFunctionElements(fun_type:ts.Type,program_info:finder.ProgramInfo){
  var params = [];

  //Checks signatures in the fun_type in order to find the parameters types and the function return value
  for (const signature of fun_type.getCallSignatures()){
    for(const parameter of signature.parameters){
      var parameter_type = program_info.Checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!);
      params.push(parameter_type);
    }
    var ret_type = signature.getReturnType();
  }

  return {
    params:params,
    ret: ret_type
  }
}


//::::::::This function generates a symbolic assignment for each type in the union::::::::
function createUnionType(union_type:ts.Type,program_info:finder.ProgramInfo){
  var stmts = [];
  var symb_vars = [];
  var unions = [];
  var control_vars = [];
  var control_nums = [];

  //Union variable creation and declaration
  var union = freshUnionVar();
  var union_str = `var ${union}`; 
  stmts.push(str2ast(union_str));

  //Checks the union_type "types" array to find which types the union can be
  for(var i =0;i<union_type["types"].length;i++){
    //Generates the variable for each possible union type
    var ret = createSymbAssignment(union_type["types"][i],program_info);

    //Checks if any argument has more than one possible value
    if(ret.control!==undefined){
      control_vars = control_vars.concat(ret.control);
      control_nums = control_nums.concat(ret.control_num);
    }    
    symb_vars.push(ret.var);
  
    //Union var assignment to one of the possible types
    union_str =`${union} = ${ret.var}`;
    unions.push(generateBlock(ret.stmts.concat(str2ast(union_str))));
  }

  //Generates the switch statement and the control var that will decide which assignment is made to the union var
  var control_var = freshControlUnionVar(); 
  var switch_stmt = createSwitchStmt(control_var, unions);
  stmts.push(switch_stmt); 
  stmts.push(ENTER_FUNC);

  control_vars.push(control_var);
  control_nums.push(union_type["types"].length);
  
  return {
    stmts:stmts,
    var: union, 
    control: control_vars,
    control_num: control_nums
  }
}

//::::::::This function generates the mock constructor for an interface::::::::
function createInterfaceMockConstructor(interface_name:string, program_info:finder.ProgramInfo){
  var stmts = [];
  var control_vars = [];
  var control_nums = [];

  //Iterates over all the properties of an interface
  Object.keys(program_info.PropertiesInfo[interface_name]).forEach(function (property_name) {
    //Generates the property type variable and assigns the object property to this variable
    var ret = createSymbAssignment(program_info.PropertiesInfo[interface_name][property_name],program_info);
    stmts=stmts.concat(ret.stmts); 
    var property_assigment_str = `this.${property_name} = ${ret.var};`
    stmts.push(str2ast(property_assigment_str));

    //Checks if any argument has more than one possible value
    if(ret.control!==undefined){
      control_vars = control_vars.concat(ret.control);
      control_nums = control_nums.concat(ret.control_num);
    }    
  });
  
  return {
    stmts: createFunctionDeclaration(interface_name,stmts,control_vars),
    control: control_vars,
    control_num: control_nums
  }
}

//::::::::This function generates the call of all the constructors of a class::::::::
function generateConstructorTests(class_name:string,program_info:finder.ProgramInfo){
  var symb_vars = [];
  var stmts = []; 
  var objs = [];
  var control_vars = [];
  var control_nums = [];

  stmts.push(ENTER_FUNC);

  //Iterates over all the object constructors
  for(var i=0; i<program_info.ConstructorsInfo[class_name].length; i++){
    symb_vars = [];

    //Iterates over all the argument types of that constructor
    for (var j=0; j<program_info.ConstructorsInfo[class_name][i].arg_types.length; j++) { 
      //Generates a variable of the argument type
      var ret = createSymbAssignment(program_info.ConstructorsInfo[class_name][i].arg_types[j],program_info);
      stmts=stmts.concat(ret.stmts); 
      symb_vars.push(ret.var); 

      //Checks if any argument has more than one possible value
      if(ret.control !== undefined){
        control_vars = control_vars.concat(ret.control);
        control_nums = control_nums.concat(ret.control_num);
      } 
    }

    //Generates the object var 
    var obj = freshObjectVar();
    //If the object is an interface it adds a prefix 
    if(program_info.hasInterface(class_name))
      obj = "interface_" + obj;
      
    objs[i] = obj;
    //Creates a string with the arguments in parameters format, for example "x_1,x_2"
    var constructor_args_str = symb_vars.reduce(function (cur_str, prox) {
      if (cur_str === "") return prox; 
      else return cur_str + ", " + prox; 
    },"");  

    //Generates the assignment of the object variable to a new object of the given type
    var constructor_ret_str =`var ${obj} = new ${class_name}(${constructor_args_str})`;
    var constructor_ret_stmt = str2ast(constructor_ret_str); 
    stmts.push(constructor_ret_stmt);
    stmts.push(ENTER_FUNC);
  }

  return {
    stmt:createFunctionDeclaration("test_"+class_name+"_constructors",stmts,control_vars),
    control: control_vars,
    control_num: control_nums
  }
}


//::::::::This function generates a method test function:::::::
function generateMethodTest(class_name:string, method_name:string,method_number_test:number,program_info:finder.ProgramInfo){
  var stmts = [];
  var control_vars = [];
  var control_nums = [];
  var method_info = program_info.MethodsInfo[class_name][method_name];

  stmts.push(ENTER_FUNC);

  //Creation of the object where the method will be tested
  var ret_obj = createObjectSymbParams(class_name,program_info);
  stmts=stmts.concat(ret_obj.stmts);
  //Checks if any argument has more than one possible value
  if(ret_obj.control[0]!==undefined){
    control_vars = control_vars.concat(ret_obj.control);
    control_nums = control_nums.concat(ret_obj.control_num);
  }
    
  
  //Creates the arguments of the method
  var ret_args = createArgSymbols(method_info.arg_types,program_info);
  stmts=stmts.concat(ret_args.stmts);
  //Checks if any argument has more than one possible value
  if(ret_args.control[0]!==undefined){
    control_vars = control_vars.concat(ret_args.control);
    control_nums = control_nums.concat(ret_args.control_num);
  }

  //Creates the method call which the return value will be put in a variable
  var x = freshXVar();
  var ret_str = `var ${x} = ${ret_obj.var}.${method_name}(${ret_args.vars_str})`;
  var ret_ast = str2ast(ret_str);
  stmts.push(ret_ast);
  
  //Creates the assertion of the variable with the method's return type to the expected return type
  var ret_asrt = generateFinalAsrt(method_info.ret_type,x,program_info);
  stmts = stmts.concat(ret_asrt.stmt);
  stmts.push(str2ast(`Assert(${ret_asrt.var})`));

  stmts.push(ENTER_FUNC); 

  return {
    stmt: createFunctionDeclaration("test"+method_number_test+"_"+method_name,stmts,control_vars),
    control: control_vars,
    control_num: control_nums
  }
}


//::::::::This function generates a function test function::::::::
function generateFunctionTest(fun_name:string,fun_number_test:number,program_info:finder.ProgramInfo){
  var stmts = [];
  var control_vars = [];
  var control_nums = [];
  var function_info=program_info.FunctionsInfo[fun_name];

  stmts.push(ENTER_FUNC);

  //Creation the arguments of the function 
  var ret_args = createArgSymbols(function_info.arg_types,program_info);
  stmts=stmts.concat(ret_args.stmts);

  //Checks if any argument has more than one possible value
  if(ret_args.control[0]!==undefined){
    control_vars = control_vars.concat(ret_args.control);
    control_nums = control_nums.concat(ret_args.control_num);
  }
    

  //Creates the function call and places the return value in a variable 
  var x =freshXVar();
  var ret_str = `var ${x} = ${fun_name}(${ret_args.vars_str})`;
  var ret_ast = str2ast(ret_str);
  stmts.push(ret_ast);  

  //Creates the assertion of the variable with the function's return type to the expected return type
  var ret_asrt = generateFinalAsrt(function_info.ret_type,x,program_info);
  stmts = stmts.concat(ret_asrt.stmt);
  stmts.push(str2ast(`Assert(${ret_asrt.var})`));
  stmts.push(ENTER_FUNC); 
  
  return {
    stmt: createFunctionDeclaration("test"+fun_number_test+"_"+fun_name,stmts,control_vars),
    control: control_vars,
    control_num: control_nums
  }
}


//::::::::This function generates an assertion to check if the return type of a function is a string:::::::: 
function generateFinalStringAsrt(ret_var:string) { 
  var x = freshAssertVar();
  
  var ret_str = `var ${x} = typeof ${ret_var} === "string";`; 
  return {
    stmt:[str2ast(ret_str)],
    var:x
  } 
}

//::::::::This function generates an assertion to check if the return type of a function is a number:::::::: 
function generateFinalNumberAsrt(ret_var:string) { 
  var x = freshAssertVar();

  var ret_str = `var ${x} = typeof ${ret_var} === "number";`; 
  return {
    stmt:[str2ast(ret_str)],
    var:x
  }
}

//::::::::This function generates an assertion to check if the return type of a function is a boolean:::::::: 
function generateFinalBooleanAsrt(ret_var:string) { 
  var x = freshAssertVar();

  var ret_str = `var ${x} = typeof ${ret_var} === "boolean";`; 
  return {
    stmt:[str2ast(ret_str)],
    var:x
  }
}

//::::::::This function generates an assertion to check if the return type of a function is null:::::::: 
function generateFinalNullAsrt(ret_var:string) { 
  var x = freshAssertVar();

  var ret_str = `var ${x} = ${ret_var} === null;`; 
  return {
    stmt:[str2ast(ret_str)],
    var:x
  }
}

//::::::::This function generates an assertion to check if the return type of a function is undefined:::::::: 
function generateFinalVoidAsrt(ret_var:string) { 
  var x = freshAssertVar();

  var ret_str = `var ${x} = typeof ${ret_var} === "undefined";`; 
  return {
    stmt:[str2ast(ret_str)],
    var:x
  }
}

//::::::::This function generates an assertion to check if the return type of a function is an instance of an object::::::::
function generateFinalObjectAsrt(ret_var:string,ret_type: string) { 
  var x = freshAssertVar();

  var ret_str = `var ${x} = ${ret_var} instanceof ${ret_type};`; 
  return {
    stmt:[str2ast(ret_str)],
    var:x
  }
}

//::::::::This function generates an assertion to check if the return type of a function is an instance of an object::::::::
function generateFinalUnionAsrt(stmts,assert_vars: string[]) { 
  var x = freshAssertVar();
  
  var ret_str = `var ${x} = ${assert_vars[0]}`; 
  for(var i = 1;i<assert_vars.length;i++){
    ret_str += ` || ${assert_vars[i]}`;
  }
  ret_str += `;`
  stmts.push(str2ast(ret_str));
  return {
    stmt:stmts,
    var:x
  }
}

//::::::::This function generates an assertion to check the return type ::::::::
function generateFinalAsrt (ret_type:ts.Type, ret_var:string, program_info : finder.ProgramInfo) {

  //Turns the type into a string
  var ret_type_str = program_info.Checker.typeToString(ret_type);
  
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
    case "void" : return generateFinalVoidAsrt(ret_var); 
    
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
      else if(isUnionType(ret_type)){
        var assert_vars = [];
        var stmts = [];
        for(var i = 0;i<ret_type["types"].length;i++){
          var type_asrt = generateFinalAsrt(ret_type["types"][i], ret_var, program_info);
          assert_vars.push(type_asrt.var);
          stmts = stmts.concat(type_asrt.stmt);
        }
        return generateFinalUnionAsrt(stmts,assert_vars);
      } 
      
      //If the type reaches this case it is a type that the assertion is unsupported by the testGenerator
      else {
        throw new Error ("generateFinalAsrt: Unsupported type")
      }
  }
}


//::::::::This function generates the output block::::::::
function generateBlock(stmts) {
    return {
        type: "BlockStatement",
        body: stmts
    }
}


//::::::::This fucntion is responsible for genarating the program tests::::::::
export function generateTests(program_info : finder.ProgramInfo,output_dir:string, js_file:string):string{

  var fun_names = [];
  var num_fun = 0;
  var tests = [];
  var curr_test = "";
  var number_test:finder.HashTable<number> = {};
  var recursive_create_functions:finder.HashTable<string> = {};
  var constant_code_str:string = "";
  var max_constructors_recursive_objects:number = 0;

  //Create functions generated for when there is cyclic construction in the objects 
  Object.keys(program_info.cycles_hash).forEach(function (class_name) {
    //Recursive creation function generation
    var recursive_create_function = createObjectRecursiveSymbParams(class_name,program_info);
    tests.push(recursive_create_function);
    recursive_create_functions[class_name] = ast2str(recursive_create_function);
    constant_code_str += ast2str(recursive_create_function)+"\n\n";

    //Saves the number of constructors of the object with cyclic that has more constructors for later use in the fuel var array
    if(max_constructors_recursive_objects < program_info.ConstructorsInfo[class_name].length)
      max_constructors_recursive_objects = program_info.ConstructorsInfo[class_name].length;
  });

  tests.push(ENTER_FUNC);

  //Creation of Mock constructors and methods for interfaces
  Object.keys(program_info.InterfacesInfo).forEach(function (interface_name) {
    //Creation of the mock constructor for the interface
    var interface_mock_constructor = createInterfaceMockConstructor(interface_name,program_info);
    constant_code_str += ast2str(interface_mock_constructor.stmts)+"\n\n";

    //Creation of the mock methods for the interface
    Object.keys(program_info.MethodsInfo[interface_name]).forEach(function (method_name) {
      var interface_method_info = program_info.MethodsInfo[interface_name][method_name];
      var interface_mock_method = createMockFunction(interface_method_info.arg_types,interface_method_info.ret_type,program_info);
      var proto_assignment = createPrototypeAssignment(interface_name, method_name, interface_mock_method);
      constant_code_str += ast2str(proto_assignment)+"\n\n";
    });
  });


  //Iterates over all the object that have at least one constructor
  Object.keys(program_info.ConstructorsInfo).forEach(function (class_name) { 

    curr_test = constant_code_str+"\n";

    //Calculates the test number
    if(number_test[class_name] === undefined)
      number_test[class_name] = 1;
    else
      number_test[class_name]++;

    var comment = "Comment1Test"+SPACE_STR+"of"+SPACE_STR+class_name+APOSTROPHE_STR+"s"+SPACE_STR+"constructors"+"Comment2();";
    tests.push(str2ast(comment));
    curr_test += comment+"\n";

    //Generation of the constructors tests
    var ret = generateConstructorTests(class_name,program_info);
    tests.push(ret.stmt);
    curr_test+=ast2str(ret.stmt)+"\n";

    tests.push(ENTER_FUNC);

    //It will generate an array with the multiple options that each function will have for their switch statement(s), if they exist
    var all_cases = [];
    var cases;
    for(var i = 0; i<ret.control.length; i++){
      cases = [];
      for (var j=0;j<ret.control_num.length;j++){
        cases.push(j+1);
      }
      all_cases.push(cases);
    }

    var constructor_call_str;
    var constructor_call;

    //Generates the combinations that will be the arguments when calling the constructor's test function
    if(all_cases.length>0){
      var combinations = createCombinations(all_cases);
      
      //For each combination it will generate a call to the constructor's test function
      for(var i = 0;i<combinations.length;i++){
        constructor_call_str = "test_"+class_name+"_constructors("+combinations[i]+");";
        constructor_call = str2ast(constructor_call_str);
        tests.push(constructor_call);
        curr_test += "\n"+constructor_call_str;
        tests.push(ENTER_FUNC); 
      }
    }

    //If there is only one case it will generate the call to the constructor's test function without arguments
    else{
      constructor_call_str = "test_"+class_name+"_constructors();";
      constructor_call = str2ast(constructor_call_str);
      tests.push(constructor_call);
      curr_test += "\n"+constructor_call_str;
      tests.push(ENTER_FUNC); 
    }

    //It will write the constructor's test in a file inside the TS file test directory
    fs.writeFileSync(output_dir+"/test_"+class_name+"_constructors.js",js_file+"\n\n"+stringManipulation (curr_test));

    fun_names[num_fun] = constructor_call_str;
    num_fun++;
  });

  //Iterates over all the object that have at least one method
  Object.keys(program_info.MethodsInfo).forEach(function (class_name) { 
    //Iterates over all the method that an object has
    Object.keys(program_info.MethodsInfo[class_name]).forEach(function (method_name){

      curr_test = constant_code_str+"\n";
      
      //Calculates the test number
      if(number_test[method_name] === undefined)
        number_test[method_name]=1;
      else
        number_test[method_name]++;
      
      var comment = "Comment1Test"+SPACE_STR+"of"+SPACE_STR+class_name+APOSTROPHE_STR+"s"+SPACE_STR+"method"+COLONS_STR+method_name+"Comment2();";
      tests.push(str2ast(comment));
      curr_test += comment+"\n";

      //Generates the method's test function
      var ret = generateMethodTest(class_name,method_name,number_test[method_name],program_info);
      tests.push(ret.stmt);
      curr_test += ast2str(ret.stmt)+"\n";

      tests.push(ENTER_FUNC);

      //It will generate an array with the multiple options that each function will have for their switch statement(s), if they exist
      var all_cases = [];
      var cases;
      for(var i = 0; i<ret.control.length; i++){
        cases = [];
        for (var j=0;j<ret.control_num[i];j++){
          cases.push(j+1);
        }
        all_cases.push(cases);
      }
  
      var method_call_str;
      var method_call;

      //Generates the combinations that will be the arguments when calling the method's test function
      if(all_cases.length>0){
        var combinations = createCombinations(all_cases);
        //For each combination it will generate a call to the method test function
        for(var i = 0;i<combinations.length;i++){
          method_call_str = "test"+number_test[method_name]+"_"+method_name+"("+combinations[i]+");";
          method_call = str2ast(method_call_str);
          tests.push(method_call);
          curr_test += "\n"+method_call_str;
          tests.push(ENTER_FUNC); 
        }
      }
      
      //If there is only one case it will generate the call to the method's test function without arguments
      else{
        method_call_str = "test"+number_test[method_name]+"_"+method_name+"();"
        method_call = str2ast(method_call_str);
        tests.push(method_call);
        curr_test += "\n"+method_call_str;
        tests.push(ENTER_FUNC); 
      }

      //It will write the method's test in a file inside the TS file test directory
      fs.writeFileSync(output_dir+"/test"+number_test[method_name]+"_"+method_name+".js",js_file+"\n\n"+stringManipulation (curr_test));

      fun_names[num_fun] = method_call_str;
      num_fun++;
    });
  });


  //Functions tests will be created
  Object.keys(program_info.FunctionsInfo).forEach(function (fun_name) { 

    curr_test = constant_code_str+"\n";

    //Calculates the test number 
    if(number_test[fun_name] === undefined)
      number_test[fun_name]=1;
    else
      number_test[fun_name]++;

    var comment = "Comment1Test"+SPACE_STR+"of"+SPACE_STR+"function"+COLONS_STR+fun_name+"Comment2();";
    tests.push(str2ast(comment));
    curr_test += comment+"\n";

    //Generates the function's test function
    var ret = generateFunctionTest(fun_name,number_test[fun_name],program_info);
    tests.push(ret.stmt);
    curr_test += ast2str(ret.stmt)+"\n";

    tests.push(ENTER_FUNC);

    /*
    var fun_call_str;
    var fun_call;
    var symbolic_cases_vars = [];

    for(var i = 0; i<ret.control.length; i++){
      var symbolic_case = createNumberSymbAssignment();
      curr_test += "\n"+ast2str(symbolic_case.stmts[0]);
      tests=tests.concat(symbolic_case.stmts);
      symbolic_cases_vars.push(symbolic_case.var);
    }

    if(symbolic_cases_vars.length>0){
      var arg_str = symbolic_cases_vars[0];
      
      for(var i = 1;i<symbolic_cases_vars.length;i++)
        arg_str += ", "+symbolic_cases_vars[i];

      fun_call_str ="test"+number_test[fun_name]+"_"+fun_name+"("+arg_str+");";
      fun_call = str2ast(fun_call_str);
      tests.push(fun_call);
      curr_test += "\n"+fun_call_str;
      tests.push(ENTER_FUNC); 
    }

    else{
      fun_call_str ="test"+number_test[fun_name]+"_"+fun_name+"();"
      fun_call = str2ast(fun_call_str);
      tests.push(fun_call);
      curr_test += "\n"+fun_call_str;
      tests.push(ENTER_FUNC); 
    } 
      
    
    var all_cases = [];
    var cases = [1,2,3];
    for(var i = 0; i<ret.control.length; i++)
      all_cases.push(cases);
    */
   
    //It will generate an array with the multiple options that each function will have for their switch statement(s), if they exist
    var all_cases = [];
    var cases;
    for(var i = 0; i<ret.control.length; i++){
      cases = [];
      for (var j=0;j<ret.control_num[i];j++){
        cases.push(j+1);
      }
      all_cases.push(cases);
    }


    var fun_call_str;
    var fun_call;
    //Generates the combinations that will be the arguments when calling the function's test function
    if(all_cases.length>0){
      var combinations = createCombinations(all_cases);
      //For each combination it will generate a call to the function test function
      for(var i = 0;i<combinations.length;i++){
        fun_call_str = "test"+number_test[fun_name]+"_"+fun_name+"("+combinations[i]+");";
        fun_call = str2ast(fun_call_str);
        tests.push(fun_call);
        curr_test += "\n"+fun_call_str;
        tests.push(ENTER_FUNC); 
      }
    }

    //If there is only one case it will generate the call to the method's test function without arguments
    else{
      fun_call_str = "test"+number_test[fun_name]+"_"+fun_name+"();"
      fun_call = str2ast(fun_call_str);
      tests.push(fun_call);
      curr_test += "\n"+fun_call_str;
      tests.push(ENTER_FUNC); 
    }
    
    //It will write the function's test in a file inside the TS file test directory
    fs.writeFileSync(output_dir+"/test"+number_test[fun_name]+"_"+fun_name+".js",js_file+"\n\n"+stringManipulation (curr_test));

    fun_names[num_fun]=fun_call_str;
    num_fun++;
  });

  var test_block = generateBlock(tests);
  var test_str = ast2str(test_block);

  //Manipulation of test file string to create special characters
  var test_str_final = stringManipulation(test_str);

  //returns the string with all the test functions together
  return "/*\n=====Function that will run the tests functions=====\n*/\nfunction Test() "+test_str_final+"\n\nTest();";
}
