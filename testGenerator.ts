var esprima = require('esprima');
var escodegen = require('escodegen');
var fs = require('fs');
import finder = require("./finder");
import ts = require("typescript");


//Class used to store the Cosette functions
class CosetteFunctions {
  number_creator:string = "symb_number"
  string_creator:string = "symb_string"

  numberCreator(x:string):string{
    return `${this.number_creator}(${x})`
  }

  stringCreator(x:string):string{
    return `${this.string_creator}(${x})`
  }

  assertCreator(x:string,t:string):string{
    return `Assert(typeof ${x} === "${t}");`
  }
}

var cosFunc = new CosetteFunctions(); 


//Limit of the branching
const BRANCHING_LIMIT = 3;
const FUEL = 3;


//Constants created for string manipulation later
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
  return arr_type.symbol.name==="Array";
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
var freshControlVar = makeFreshVariable("control");


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
      var: x 
  } 
}


//::::::::Function used to assign a numerical symbol to a variable::::::::
function createNumberSymbAssignment () { 
    var x = freshXVar(); 
    var ret_str = `var ${x} = ${cosFunc.numberCreator(x)}`; 

    return {
        stmts: [str2ast(ret_str)], 
        var: x 
    } 
}


//::::::::This function generates the call of a constructor with symbolic parameters::::::::
function createObjectSymbParams(class_name:string, program_info:finder.ProgramInfo){
  var symb_vars = [];
  var stmts = []; 
  var objs = [];

  var obj = freshObjectVar();

  var obj_str = `var ${obj}`; 
  stmts.push(str2ast(obj_str));

  for(var i=0; i<program_info.ConstructorsInfo[class_name].length; i++){
    symb_vars=[];

    var ret = createArgSymbols(program_info.ConstructorsInfo[class_name][i].arg_types,program_info);
    stmts = stmts.concat(ret.stmts);
    symb_vars = symb_vars.concat(ret.vars);

    obj_str =`${obj} = new ${class_name}(${ret.vars_str})`;
    objs.push(str2ast(obj_str));
  }

  if(program_info.ConstructorsInfo[class_name].length>1){
    var control_var = freshControlVar(); 
    var switch_stmt = createSwitchStmt(control_var, objs);
    stmts.push(switch_stmt); 
  }
  else{
    stmts.push(str2ast(obj_str));
  }
  stmts.push(ENTER_FUNC);

  return {
    stmts: stmts,
    var:obj,
    control: [ control_var ]
  }
}


//::::::::Function used to make a symbol assignment to a variable::::::::
function createSymbAssignment (arg_type:ts.Type,program_info:finder.ProgramInfo) { 

  var type_str = program_info.Checker.typeToString(arg_type);

  switch (type_str) {
    case "string" : return createStringSymbAssignment(); 

    case "number" : return createNumberSymbAssignment();

    default:
      if (program_info.hasClass(type_str)) {
        return  createObjectSymbParams(type_str,program_info);
      } 
      
      else if(isFunctionType(arg_type,program_info)){
        var ret_func_elements = getFunctionElements(arg_type,program_info);
        return createMockFunction(ret_func_elements.params, ret_func_elements.ret, program_info);
      } 
      
      else if(isArrayType(arg_type)){
        return createArrayOfType(arg_type,program_info);
      } 

      else {
        throw new Error ("createSymbAssignment: Unsupported type");
      }
  }
}


//::::::::Function used to create the symbol of the arguments::::::::
function createArgSymbols(arg_types:ts.Type[],program_info:finder.ProgramInfo){
  var symb_vars = [];
  var stmts = []; 
  var control_vars = [];

  for (var i=0; i<arg_types.length; i++) {
    var ret = createSymbAssignment(arg_types[i],program_info);
    stmts = stmts.concat(ret.stmts); 
    symb_vars.push(ret.var); 
    if(ret.control!==undefined)
      control_vars=control_vars.concat(ret.control);
  }

  var args_str = symb_vars.reduce(function (cur_str, prox) {
    if (cur_str === "") return prox; 
    else return cur_str + ", " + prox; 
  },"");


  return{
    stmts:stmts,
    vars:symb_vars,
    vars_str:args_str,
    control: control_vars
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
function createFunctionDeclaration(method_name:string,stmts,method_test_number,params_str:string[]){
  var params = [];
  for(var i=0;i<params_str.length;i++){
    params.push({
      type:"Identifier",
      name: params_str[i]
    })
  }

  return{
    type : "FunctionDeclaration",
    id : createIdentifier("test"+method_test_number+"_"+method_name),
    params : params,
    body : generateBlock(stmts),
    generator : false,
    expression : false,
    async : false
  }
}


//::::::::This function generates the call to a function::::::::
function createCall(fun_name:string, arg_types:ts.Type[], program_info:finder.ProgramInfo){
  var stmts = [];

  var ret_args = createArgSymbols(arg_types,program_info);
  stmts = stmts.concat(ret_args.stmts);
  var call = `${fun_name}(${ret_args.vars_str});`
  stmts.push(str2ast(call));
  return stmts;
}


//::::::::This function generates a mock function used as other function argument::::::::
function createMockFunction(arg_types:ts.Type[],ret_type:ts.Type,program_info:finder.ProgramInfo){
  var calls = [];
  
  var ret_val = createSymbAssignment(ret_type,program_info);
  
  var ret_args = createArgSymbols(arg_types,program_info);
  for(var i=0;i<arg_types.length;i++){
    if(isFunctionType(arg_types[i],program_info)){
      var function_elements = getFunctionElements(arg_types[i],program_info);
      calls=calls.concat(createCall(ret_args.vars[i], function_elements.params,program_info));
    }
  }
  calls.push(ret_val.stmts[0]);
  var block_stmt = generateBlock(calls);
  var fun_name = freshMockFuncVar();
  var fun_str= `function ${fun_name} (${ret_args.vars_str}) {
  ${ast2str(block_stmt)}
  return ${ret_val.var};
  }`;
  
  return {
    stmts: [str2ast(fun_str)],
    var: fun_name
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
function createSwitchStmt (control_var, blocks) {
  var cases = [];
  
  for (var i=0; i<blocks.length-1; i++) {
    cases.push(createCaseStmt(i, blocks[i]));
    cases.push(ENTER_FUNC);
  }
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

  var arr = freshArrayVar();
  
  var arg_type = arr_type.getNumberIndexType();
  
  var arr_str = `var ${arr}`; 
  stmts.push(str2ast(arr_str));

  for(var i =0;i<BRANCHING_LIMIT;i++){
    var ret = createSymbAssignment(arg_type,program_info);
  
    stmts = stmts.concat(ret.stmts);
    symb_vars.push(ret.var); 

    var args_str = symb_vars.reduce(function (cur_str, prox) {
      if (cur_str === "") return prox; 
      else return cur_str + ", " + prox; 
    },"");
  
    arr_str =`${arr} = [${args_str}]`;
    arrays.push(str2ast(arr_str));
  }

  var control_var = freshControlVar(); 
  var switch_stmt = createSwitchStmt(control_var, arrays);
  stmts.push(switch_stmt); 
  stmts.push(ENTER_FUNC);
  
  return {
    stmts:stmts,
    var: arr, 
    control: [ control_var ]
  }
}


//::::::::This function gets the parameters and return types of a function::::::::
function getFunctionElements(arg_type:ts.Type,program_info:finder.ProgramInfo){
  var params = [];

  for (const signature of arg_type.getCallSignatures()){
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


//::::::::This function generates the call of a method::::::::
function generateConstructorTests(class_name:string,program_info:finder.ProgramInfo){
  var symb_vars = [];
  var stmts = []; 
  var objs = [];
  var control_vars = [];

  stmts.push(ENTER_FUNC);
  for(var i=0; i<program_info.ConstructorsInfo[class_name].length; i++){
    symb_vars=[];

    for (var j=0; j<program_info.ConstructorsInfo[class_name][i].arg_types.length; j++) { 
      var ret = createSymbAssignment(program_info.ConstructorsInfo[class_name][i].arg_types[j],program_info);
      stmts=stmts.concat(ret.stmts); 
      symb_vars.push(ret.var); 
      if(ret.control!==undefined)
        control_vars = control_vars.concat(ret.control);
    }

    var obj = freshObjectVar();
    objs[i] = obj;
    var constructor_args_str = symb_vars.reduce(function (cur_str, prox) {
      if (cur_str === "") return prox; 
      else return cur_str + ", " + prox; 
    },"");  

    var constructor_ret_str =`var ${obj} = new ${class_name}(${constructor_args_str})`;
    var constructor_ret_stmt = str2ast(constructor_ret_str); 
    stmts.push(constructor_ret_stmt);
    stmts.push(ENTER_FUNC);
  }

  return {
    stmt:createFunctionDeclaration(class_name+"_constructors",stmts,"",control_vars),
    control: control_vars
  }
}


//::::::::This function generates a method test function:::::::
function generateMethodTest(class_name:string, method_name:string,method_number_test:number,program_info:finder.ProgramInfo){
  var stmts = [];
  var control_vars = [];
  var method_info = program_info.MethodsInfo[class_name][method_name];

  stmts.push(ENTER_FUNC);

  //Object creation
  var ret_obj = createObjectSymbParams(class_name,program_info);
  stmts=stmts.concat(ret_obj.stmts);
  if(ret_obj.control[0]!==undefined)
    control_vars = control_vars.concat(ret_obj.control);
  

  //Args symbols creation
  var ret_args = createArgSymbols(method_info.arg_types,program_info);
  stmts=stmts.concat(ret_args.stmts);
  if(ret_args.control[0]!==undefined)
    control_vars = control_vars.concat(ret_args.control);


  var method_return_str = program_info.Checker.typeToString(method_info.ret_type);

  //Method call creation
  var x = freshXVar();
  var ret_str = `var ${x} = ${ret_obj.var}.${method_name}(${ret_args.vars_str})`;
  var ret_ast = str2ast(ret_str);
  stmts.push(ret_ast);
  
  //Final assert creation
  var ret_asrt = generateFinalAsrt(method_return_str,x,program_info);
  stmts.push(ret_asrt.stmt);
  stmts.push(str2ast(`Assert(${ret_asrt.var})`));

  stmts.push(ENTER_FUNC); 

  return {
    stmt: createFunctionDeclaration(method_name,stmts,method_number_test,control_vars),
    control: control_vars
  }
}


//::::::::This function generates a function test function::::::::
function generateFunctionTest(fun_name:string,fun_number_test:number,program_info:finder.ProgramInfo){
  var stmts = [];
  var control_vars = [];
  var function_info=program_info.FunctionsInfo[fun_name];

  stmts.push(ENTER_FUNC);

  //Args symbols creation
  var ret_args = createArgSymbols(function_info.arg_types,program_info);
  stmts=stmts.concat(ret_args.stmts);
  if(ret_args.control[0]!==undefined)
    control_vars = control_vars.concat(ret_args.control);
  

  //Function call creation
  var x =freshXVar();
  var ret_str = `var ${x} = ${fun_name}(${ret_args.vars_str})`;
  var ret_ast = str2ast(ret_str);
  stmts.push(ret_ast);  
  
  //Final assert creation
  var function_return_str=program_info.Checker.typeToString(function_info.ret_type)
  var ret_asrt=generateFinalAsrt(function_return_str,x,program_info);
  stmts.push(ret_asrt.stmt);

  stmts.push(str2ast(`Assert(${ret_asrt.var})`));
  stmts.push(ENTER_FUNC); 

  return {
    stmt: createFunctionDeclaration(fun_name,stmts,fun_number_test,control_vars),
    control: control_vars
  }
}


//::::::::This function generates an assertion to check if the return type of a function is a string:::::::: 
function generateFinalStringAsrt(ret_var:string) { 
    var x = freshAssertVar();
    
    var ret_str = `var ${x} = typeof ${ret_var} === "string";`; 
    return {
      stmt:str2ast(ret_str),
      var:x
    } 
}

//::::::::This function generates an assertion to check if the return type of a function is a number:::::::: 
function generateFinalNumberAsrt(ret_var:string) { 
  var x = freshAssertVar();

    var ret_str = `var ${x} = typeof ${ret_var} === "number";`; 
    return {
      stmt:str2ast(ret_str),
      var:x
    }
}

//::::::::This function generates an assertion to check if the return type of a function is an instance of an object::::::::
function generateFinalObjectAsrt(ret_var:string,ret_type: string) { 
  var x = freshAssertVar();

  var ret_str = `var ${x} = ${ret_var} instanceof ${ret_type};`; 
  return {
    stmt:str2ast(ret_str),
    var:x
  }
}

//::::::::This function generates an assertion to check the return type ::::::::
function generateFinalAsrt (ret_type:string, ret_var:string, program_info : finder.ProgramInfo) {
  
   switch(ret_type) {
      case "string" : return generateFinalStringAsrt(ret_var); 

      case "number" : return generateFinalNumberAsrt(ret_var); 
      
      default: 
        if (program_info.hasClass(ret_type)) {
          return  generateFinalObjectAsrt(ret_var, ret_type)
        } else {
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

  tests.push(ENTER_FUNC); 

  //Constructors tests will be created
  Object.keys(program_info.ConstructorsInfo).forEach(function (class_name) { 

    curr_test = "";

    if(number_test[class_name]===undefined)
      number_test[class_name]=1;
    else
      number_test[class_name]++;

    var comment = "Comment1Test"+SPACE_STR+"of"+SPACE_STR+class_name+APOSTROPHE_STR+"s"+SPACE_STR+"constructors"+"Comment2();";
    tests.push(str2ast(comment));
    curr_test+=comment+"\n";

    var ret = generateConstructorTests(class_name,program_info);
    tests.push(ret.stmt);
    curr_test+=ast2str(ret.stmt)+"\n";

    tests.push(ENTER_FUNC);

    var all_cases = [];
    var cases = [1,2,3];
    for(var i = 0; i<ret.control.length; i++)
      all_cases.push(cases);

    var constructor_call_str;
    var constructor_call;
    if(all_cases.length>0){
      var combinations = createCombinations(all_cases);
      
      for(var i = 0;i<combinations.length;i++){
        constructor_call_str ="test_"+class_name+"_constructors("+combinations[i]+");";
        constructor_call = str2ast(constructor_call_str);
        tests.push(constructor_call);
        curr_test += "\n"+constructor_call_str;
        tests.push(ENTER_FUNC); 
      }
    }

    else{
      constructor_call_str = "test_"+class_name+"_constructors();";
      constructor_call = str2ast(constructor_call_str);
      tests.push(constructor_call);
      curr_test += "\n"+constructor_call_str;
      tests.push(ENTER_FUNC); 
    }

    fs.writeFileSync(output_dir+"/test_"+class_name+"_constructors.js",js_file+"\n\n"+stringManipulation (curr_test));

    fun_names[num_fun]=constructor_call_str;
    num_fun++;
  });

  //Methods tests will be created
  Object.keys(program_info.MethodsInfo).forEach(function (class_name) { 
    Object.keys(program_info.MethodsInfo[class_name]).forEach(function (method_name){

      curr_test="";

      if(number_test[method_name]===undefined)
        number_test[method_name]=1;
      else
        number_test[method_name]++;
      
      var comment = "Comment1Test"+SPACE_STR+"of"+SPACE_STR+class_name+APOSTROPHE_STR+"s"+SPACE_STR+"method"+COLONS_STR+method_name+"Comment2();";
      tests.push(str2ast(comment));
      curr_test+=comment+"\n";

      var ret = generateMethodTest(class_name,method_name,number_test[method_name],program_info);
      tests.push(ret.stmt);
      curr_test+=ast2str(ret.stmt)+"\n";

      tests.push(ENTER_FUNC);

      var all_cases = [];
      var cases = [1,2,3];
      for(var i = 0; i<ret.control.length; i++)
        all_cases.push(cases);
  
      
      var method_call_str;
      var method_call;
      if(all_cases.length>0){
        var combinations = createCombinations(all_cases);
        for(var i = 0;i<combinations.length;i++){
          method_call_str ="test"+number_test[method_name]+"_"+method_name+"("+combinations[i]+");";
          method_call = str2ast(method_call_str);
          tests.push(method_call);
          curr_test += "\n"+method_call_str;
          tests.push(ENTER_FUNC); 
        }
      }
      
      else{
        method_call_str = "test"+number_test[method_name]+"_"+method_name+"();"
        method_call = str2ast(method_call_str);
        tests.push(method_call);
        curr_test += "\n"+method_call_str;
        tests.push(ENTER_FUNC); 
      }

      fs.writeFileSync(output_dir+"/test"+number_test[method_name]+"_"+method_name+".js",js_file+"\n\n"+stringManipulation (curr_test));

      fun_names[num_fun]=method_call_str;
      num_fun++;
    });
  });


  //Functions tests will be created
  Object.keys(program_info.FunctionsInfo).forEach(function (fun_name) { 

    curr_test="";

    if(number_test[fun_name]===undefined)
      number_test[fun_name]=1;
    else
      number_test[fun_name]++;

    var comment = "Comment1Test"+SPACE_STR+"of"+SPACE_STR+"function"+COLONS_STR+fun_name+"Comment2();";
    tests.push(str2ast(comment));
    curr_test += comment+"\n";

    var ret = generateFunctionTest(fun_name,number_test[fun_name],program_info);
    tests.push(ret.stmt);
    curr_test += ast2str(ret.stmt)+"\n";

    tests.push(ENTER_FUNC);

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
      
    /*
    var all_cases = [];
    var cases = [1,2,3];
    for(var i = 0; i<ret.control.length; i++)
      all_cases.push(cases);

    var fun_call_str;
    var fun_call;
    if(all_cases.length>0){
      var combinations = createCombinations(all_cases);
      for(var i = 0;i<combinations.length;i++){
        fun_call_str ="test"+number_test[fun_name]+"_"+fun_name+"("+combinations[i]+");";
        fun_call = str2ast(fun_call_str);
        tests.push(fun_call);
        curr_test += "\n"+fun_call_str;
        tests.push(ENTER_FUNC); 
      }
    }

    else{
      fun_call_str ="test"+number_test[fun_name]+"_"+fun_name+"();"
      fun_call = str2ast(fun_call_str);
      tests.push(fun_call);
      curr_test += "\n"+fun_call_str;
      tests.push(ENTER_FUNC); 
    }
    */
    fs.writeFileSync(output_dir+"/test"+number_test[fun_name]+"_"+fun_name+".js",js_file+"\n\n"+stringManipulation (curr_test));

    fun_names[num_fun]=fun_call_str;
    num_fun++;
  });


  var test_block = generateBlock(tests);
  var test_str = ast2str(test_block);

  //Manipulation of test file string to create special characters
  var test_str_final = stringManipulation(test_str);

  return "/*\n=====Function that will run the tests functions=====\n*/\nfunction Test() "+test_str_final+"\n\nTest();";
}
