var esprima = require('esprima');
var escodegen = require('escodegen');
var fs = require('fs');
import finder = require("./finder");
import ts = require("typescript");

class CosetteFunctions {
  number_creator:string = "symb_number"
  string_creator:string = "symb_string"

  numberCreator(x:string):string{
    return `${this.number_creator}("#${x}")`
  }

  stringCreator(x:string):string{
    return `${this.string_creator}("#${x}")`
  }

  assertCreator(x:string,t:string):string{
    return `Assert(typeof ${x} === "${t}");`
  }
}

var cosFunc = new CosetteFunctions(); 

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


//::::::::Function used to create the name of a variable with the respective number::::::::
function makeFreshVariable (prefix:string) {
  var count = 0;

  return function () { 
     count++;  
     return prefix + "_" + count;      
  }
}

var freshXVar = makeFreshVariable("x"); 


//::::::::Function used to create the name of a object with the respective number::::::::
function makeFreshObject (prefix:string) {
  var count=0;

  return function() {
    count++;
    return prefix+"_"+count;
  }
}

var freshObjectVar = makeFreshObject("obj");


//::::::::Function used to create the name of a object with the respective number::::::::
function makeFreshMockFunc (prefix:string) {
  var count=0;

  return function() {
    count++;
    return prefix+"_"+count;
  }
}

var freshMockFuncVar = makeFreshMockFunc("mockFunc");


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


//::::::::Function used to make a symbol assignment to a variable::::::::
function createSymbAssignment (arg_type:string,program_info:finder.ProgramInfo) { 

  switch (arg_type) {
    case "string" : return createStringSymbAssignment(); 

    case "number" : return createNumberSymbAssignment();

    default:
      if (program_info.hasClass(arg_type)) {
        return  generateObject(arg_type,program_info);
      } else {
        throw new Error ("createSymbAssignment: Unsupported type");
      }
  }
}


//::::::::Function used to create the symbol of the arguments::::::::
function createArgSymbols(arg_types:ts.Type[],program_info:finder.ProgramInfo){
  var symb_vars = [];
  var stmts = []; 

  for (var i=0; i<arg_types.length; i++) { 
    var type_str=program_info.Checker.typeToString(arg_types[i]);
    var ret = createSymbAssignment(type_str,program_info);
    stmts = stmts.concat(ret.stmts); 
    symb_vars.push(ret.var); 
  }

  var args_str = symb_vars.reduce(function (cur_str, prox) {
    if (cur_str === "") return prox; 
    else return cur_str + ", " + prox; 
  },"");


  return{
    stmts:stmts,
    vars:symb_vars,
    vars_str:args_str
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
function createFunctionDeclaration(method_name,stmts,method_test_number){
  return{
    type : "FunctionDeclaration",
    id : createIdentifier("test"+method_test_number+"_"+method_name),
    params : [],
    body : generateBlock(stmts),
    generator : false,
    expression : false,
    async : false
  }
}


//::::::::This function generates the call of a constructor with symbolic parameters::::::::
function generateObject(class_name:string, program_info:finder.ProgramInfo){
  var symb_vars = [];
  var stmts = []; 
  var objs = [];

  for(var i=0; i<program_info.ConstructorsInfo[class_name].length; i++){
    symb_vars=[];

    for (var j=0; j<program_info.ConstructorsInfo[class_name][i].arg_types.length; j++) { 
      var type_str=program_info.Checker.typeToString(program_info.ConstructorsInfo[class_name][i].arg_types[j])
      var ret = createSymbAssignment(type_str,program_info);
      stmts=stmts.concat(ret.stmts); 
      symb_vars.push(ret.var); 
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
  }


  return {
    stmts: stmts,
    var:objs[0],
    vars:objs
  }
}

//::::::::This function generates the call of a method::::::::
function generateMethodTest(class_name:string, method_name:string,method_number_test:number,program_info:finder.ProgramInfo){
  var stmts = [];
  var method_info = program_info.MethodsInfo[class_name][method_name];

  //Object creation
  var ret_obj = generateObject(class_name,program_info);
  stmts=stmts.concat(ret_obj.stmts);
  

  //Args symbols creation
  var ret_args = createArgSymbols(method_info.arg_types,program_info);
  stmts=stmts.concat(ret_args.stmts);

  //Method call creation
  var ret_vars = [];
  for(var i = 0;i<ret_obj.vars.length;i++){
    var x = freshXVar();
    ret_vars[i]=x;
    var ret_str = `var ${x} = ${ret_obj.vars[i]}.${method_name}(${ret_args.vars_str})`;
    var ret_ast = str2ast(ret_str);
    stmts.push(ret_ast);
  }

  //Final assert creation
  var method_return_str = program_info.Checker.typeToString(method_info.ret_type);
  
  for(var i = 0;i<ret_vars.length;i++){
    var ret_asrt = generateFinalAsrt(method_return_str,ret_vars[i],program_info);
    stmts.push(ret_asrt);
  }
  

  return createFunctionDeclaration(method_name,stmts,method_number_test);
}

//::::::::This function generates a mock function from type::::::::
function generateMockFunction(arg_types:string[],ret_type:string,program_info:finder.ProgramInfo){
  var stmts = [];
  
  var retval = createSymbAssignment(ret_type,program_info);
  stmts = stmts.concat(retval.stmts);

  var ret_str = `return ${retval.var};`;
  var ret_ast = str2ast(ret_str);
  stmts.push(ret_ast);
  
  var params = [];
  for(var i=0;i<arg_types.length;i++){
    params.push("x_"+i);
  }

  var params_str = params.reduce(function (cur_str, prox) {
    if (cur_str === "") return prox; 
    else return cur_str + ", " + prox; 
  },"");  

  var body_block = generateBlock(stmts);
  var body_str = ast2str(body_block);

  var fun_name = freshMockFuncVar();
  var fun_str= `function ${fun_name}(${params_str}) `+body_str;
  
  console.log(fun_str);
  return str2ast(fun_str);
}


//::::::::This function generates the call of a function::::::::
function generateFunctionTest(fun_name:string,fun_number_test:number,program_info:finder.ProgramInfo){
  var stmts = [];
  var function_info=program_info.FunctionsInfo[fun_name];

  //Args symbols creation
  var ret_args = createArgSymbols(function_info.arg_types,program_info);
  stmts=stmts.concat(ret_args.stmts);

  //Function call creation
  var x =freshXVar();
  var ret_str = `var ${x} = ${fun_name}(${ret_args.vars_str})`;
  var ret_ast = str2ast(ret_str);
  stmts.push(ret_ast);  

  //Final assert creation
  var function_return_str=program_info.Checker.typeToString(function_info.ret_type)
  var ret_asrt=generateFinalAsrt(function_return_str,x,program_info);
  stmts.push(ret_asrt);

  return createFunctionDeclaration(fun_name,stmts,fun_number_test);
}


//::::::::This function generates an assertion to check if the return type of a function is a string:::::::: 
function generateFinalStringAsrt(ret_var:string) { 
    var ret_str = `Assert(typeof ${ret_var} === "string");`; 
    return str2ast(ret_str); 
}

//::::::::This function generates an assertion to check if the return type of a function is a number:::::::: 
function generateFinalNumberAsrt(ret_var:string) { 
    var ret_str = `Assert(typeof ${ret_var} === "number");`; 
    return str2ast(ret_str); 
}

//::::::::This function generates an assertion to check if the return type of a function is an instance of an object::::::::
function generateFinalObjectAsrt(ret_var:string,ret_type: string) { 
  var ret_str = `Assert(${ret_var} instanceof ${ret_type});`; 
  return str2ast(ret_str); 
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
export function generateTests(program_info : finder.ProgramInfo):string{

  var fun_names = [];
  var num_fun = 0;
  var tests=[];
  var number_test:finder.HashTable<number>={};

  //console.log(generateMockFunction(["string"],"number",program_info));

  //Methods tests will be created
  Object.keys(program_info.MethodsInfo).forEach(function (class_name) { 
    Object.keys(program_info.MethodsInfo[class_name]).forEach(function (method_name){

      if(number_test[method_name]===undefined)
        number_test[method_name]=1;
      else
        number_test[method_name]++;

      var ret = generateMethodTest(class_name,method_name,number_test[method_name],program_info);
      tests.push(ret);
      var method_call_str ="test"+number_test[method_name]+"_"+method_name+"()";
      var method_call = str2ast(method_call_str);
      tests.push(method_call);

      fun_names[num_fun]=method_call_str;
      num_fun++;

    });
  });

  //Functions tests will be created
  Object.keys(program_info.FunctionsInfo).forEach(function (fun_name) { 

    if(number_test[fun_name]===undefined)
      number_test[fun_name]=1;
    else
      number_test[fun_name]++;

    var ret = generateFunctionTest(fun_name,number_test[fun_name],program_info);
    tests.push(ret);
    var fun_call_str ="test"+number_test[fun_name]+"_"+fun_name+"()";
    var fun_call = str2ast(fun_call_str);
    tests.push(fun_call);

    fun_names[num_fun]=fun_call_str;
    num_fun++;
  });


  var test_block = generateBlock(tests);
  var test_str = ast2str(test_block);
  return "function Test() "+test_str;
}
