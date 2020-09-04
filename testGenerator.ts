var esprima = require('esprima');
var escodegen = require('escodegen');
var fs = require('fs');
import finder = require("./finder");
import ts = require("typescript");
import { number } from "yargs";
import { checkServerIdentity } from "tls";


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


//Constants created for string manipulation later
const enterFunc = str2ast("$Enter$()");
const spaceStr = "$Space$";
const colonsStr = "$Colons$";
const apostropheStr = "$Apostrophe$";


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


//::::::::Function used to create the name of a variable with the respective number::::::::
function makeFreshVariable (prefix:string) {
  var count = 0;

  return function () { 
     count++;  
     return prefix + "_" + count;      
  }
}

var freshXVar = makeFreshVariable("x"); 

//::::::::Function used to create the name of a variable with the respective number::::::::
function makeFreshAssertVariable (prefix:string) {
  var count = 0;

  return function () { 
     count++;  
     return prefix + "_" + count;      
  }
}

var freshAssertVar = makeFreshAssertVariable("a"); 


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


//::::::::This function generates the call of a constructor with symbolic parameters::::::::
function createObjectSymbParams(class_name:string, program_info:finder.ProgramInfo){
  var symb_vars = [];
  var stmts = []; 
  var objs = [];

  for(var i=0; i<program_info.ConstructorsInfo[class_name].length; i++){
    symb_vars=[];

    for (var j=0; j<program_info.ConstructorsInfo[class_name][i].arg_types.length; j++) {
      var ret = createSymbAssignment(program_info.ConstructorsInfo[class_name][i].arg_types[j],program_info);
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
    stmts.push(enterFunc); 
  }

  return {
    stmts: stmts,
    var:objs[0],
    vars:objs
  }
}

//::::::::Function used to make a symbol assignment to a variable::::::::
function createSymbAssignment (arg_type:ts.Type,program_info:finder.ProgramInfo) { 

  var type_str=program_info.Checker.typeToString(arg_type); 
  var parameters = program_info.Checker.getSignaturesOfType(arg_type, null); 

  console.log("\n\n\n\nfirst: "+parameters);
  console.log("\n\n\n\nsecond: "+type_str);

  switch (type_str) {
    case "string" : return createStringSymbAssignment(); 

    case "number" : return createNumberSymbAssignment();

    default:
      if (program_info.hasClass(type_str)) {
        return  createObjectSymbParams(type_str,program_info);
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
    var ret = createSymbAssignment(arg_types[i],program_info);
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


//::::::::This function generates the call of a method::::::::
function generateConstructorTests(class_name:string,program_info:finder.ProgramInfo){
  var symb_vars = [];
  var stmts = []; 
  var objs = [];

  stmts.push(enterFunc);
  for(var i=0; i<program_info.ConstructorsInfo[class_name].length; i++){
    symb_vars=[];

    for (var j=0; j<program_info.ConstructorsInfo[class_name][i].arg_types.length; j++) { 
      var ret = createSymbAssignment(program_info.ConstructorsInfo[class_name][i].arg_types[j],program_info);
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
    stmts.push(enterFunc);
  }

  return createFunctionDeclaration(class_name+"_constructors",stmts,"");
}


//::::::::This function generates a method test function:::::::
function generateMethodTest(class_name:string, method_name:string,method_number_test:number,program_info:finder.ProgramInfo){
  var stmts = [];
  var method_info = program_info.MethodsInfo[class_name][method_name];

  stmts.push(enterFunc);

  //Object creation
  var ret_obj = createObjectSymbParams(class_name,program_info);
  stmts=stmts.concat(ret_obj.stmts);
  

  //Args symbols creation
  var ret_args = createArgSymbols(method_info.arg_types,program_info);
  stmts=stmts.concat(ret_args.stmts);

  var method_return_str = program_info.Checker.typeToString(method_info.ret_type);

  for(var i = 0;i<ret_obj.vars.length;i++){

    //Method call creation
    var x = freshXVar();
    var ret_str = `var ${x} = ${ret_obj.vars[i]}.${method_name}(${ret_args.vars_str})`;
    var ret_ast = str2ast(ret_str);
    stmts.push(ret_ast);
    
    //Final assert creation
    var ret_asrt = generateFinalAsrt(method_return_str,x,program_info);
    stmts.push(ret_asrt.stmt);
    stmts.push(str2ast(`Assert(${ret_asrt.var})`));

    stmts.push(enterFunc); 
  }
  
  return createFunctionDeclaration(method_name,stmts,method_number_test);
}

/*
function f (g : (a:number, b:number) => number) : number{
  return 2;
}
*/

//::::::::This function generates a mock function from type::::::::
function generateMockFunction(arg_types:string[],ret_type:ts.Type,program_info:finder.ProgramInfo){
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


//::::::::This function generates a function test function::::::::
function generateFunctionTest(fun_name:string,fun_number_test:number,program_info:finder.ProgramInfo){
  var stmts = [];
  var function_info=program_info.FunctionsInfo[fun_name];

  stmts.push(enterFunc);

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
  stmts.push(ret_asrt.stmt);

  stmts.push(str2ast(`Assert(${ret_asrt.var})`));
  stmts.push(enterFunc); 

  return createFunctionDeclaration(fun_name,stmts,fun_number_test);
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

  //console.log(generateMockFunction(["string"],"number",program_info));

  tests.push(enterFunc); 

  //Constructors tests will be created
  Object.keys(program_info.ConstructorsInfo).forEach(function (class_name) { 

    curr_test = "";

    if(number_test[class_name]===undefined)
      number_test[class_name]=1;
    else
      number_test[class_name]++;

    var comment = "Comment1Test"+spaceStr+"of"+spaceStr+class_name+apostropheStr+"s"+spaceStr+"constructors"+"Comment2();";
    tests.push(str2ast(comment));
    curr_test+=comment+"\n";

    var ret = generateConstructorTests(class_name,program_info);
    tests.push(ret);
    curr_test+=ast2str(ret)+"\n";

    tests.push(enterFunc);

    var constructor_call_str ="test_"+class_name+"_constructors()";
    var constructor_call = str2ast(constructor_call_str);
    tests.push(constructor_call);
    curr_test+="\n"+constructor_call_str;
    
    tests.push(enterFunc); 

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
      
      var comment = "Comment1Test"+spaceStr+"of"+spaceStr+class_name+apostropheStr+"s"+spaceStr+"method"+colonsStr+method_name+"Comment2();";
      tests.push(str2ast(comment));
      curr_test+=comment+"\n";

      var ret = generateMethodTest(class_name,method_name,number_test[method_name],program_info);
      tests.push(ret);
      curr_test+=ast2str(ret)+"\n";

      tests.push(enterFunc); 
      
      var method_call_str ="test"+number_test[method_name]+"_"+method_name+"()";
      var method_call = str2ast(method_call_str);
      tests.push(method_call);
      curr_test+="\n"+method_call_str;
      
      tests.push(enterFunc); 

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

    var comment = "Comment1Test"+spaceStr+"of"+spaceStr+"function"+colonsStr+fun_name+"Comment2();";
    tests.push(str2ast(comment));
    curr_test += comment+"\n";

    var ret = generateFunctionTest(fun_name,number_test[fun_name],program_info);
    tests.push(ret);
    curr_test += ast2str(ret)+"\n";

    tests.push(enterFunc); 
    
    var fun_call_str ="test"+number_test[fun_name]+"_"+fun_name+"()";
    var fun_call = str2ast(fun_call_str);
    tests.push(fun_call);
    curr_test += "\n"+fun_call_str;
    
    tests.push(enterFunc); 

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
