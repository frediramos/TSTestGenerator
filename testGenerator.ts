var esprima = require('esprima');
var escodegen = require('escodegen');
var fs = require('fs');

//::::::::::::::::::::
//Hashtable used to store constructor arguments types just for testing
interface HashTable<T>{
  [key:string] : T;
}

var constructor_arg_types:HashTable<string[]>={};
constructor_arg_types["Animal"]=[];
constructor_arg_types["Animal"].push("number");
constructor_arg_types["Animal"].push("string");
//:::::::::::::::::::::::

//variable that will store the test statements


//Turns ast into string
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


//Turns string into ast
function str2ast (str:string) { 
  var ast = esprima.parse (str); 

  return ast.body[0];
}


//Function used to create the name of a variable with the respective number
function makeFreshGenerator (prefix:string) {
  var count = 0;

  return function () { 
     count++;  
     return prefix + "_" + count;      
  }
}

var freshXVar = makeFreshGenerator("x"); 


//Function used to create the name of a test with the respective number
function makeFreshTest (prefix:string) {
  var count=0;

  return function() {
    count++;
    return prefix+"_"+count;
  }
}

var freshTestVar = makeFreshTest("Test");


//Function used to create the name of a object with the respective number
function makeFreshObject (prefix:string) {
  var count=0;

  return function() {
    count++;
    return prefix+"_"+count;
  }
}

var freshObjectVar = makeFreshObject("Obj");

//Function used to assign a string symbol to a variable
function createStringSymbAssignment () { 
  var x = freshXVar(); 
  var ret_str = `var ${x} = symb_string("#${x}")`; 

  return {
      stmt: str2ast(ret_str), 
      var: x 
  } 
}


//Function used to assign a numerical symbol to a variable
function createNumberSymbAssignment () { 
    var x = freshXVar(); 
    var ret_str = `var ${x} = symb_number("#${x}")`; 

    return {
        stmt: str2ast(ret_str), 
        var: x 
    } 
  }


//Function used to make a symbol assignment to a variable
function createSymbAssignment (arg_type:string) { 
  switch (arg_type) {
    case "string" : return createStringSymbAssignment(); 

    case "number" : return createNumberSymbAssignment(); 

    case "Animal" : return generateObject(arg_type);

    default: throw new Error ("createSymbAssignment: Unsupported type")
  }
}


//This function generates the call of a constructor with symbolic parameters 
function generateObject(obj_name:string){
  var symb_vars = [];
  var stmts = []; 

  for (var i=0; i<constructor_arg_types[obj_name].length; i++) { 
    var ret = createSymbAssignment(constructor_arg_types[obj_name][i]);
    stmts.push(ret.stmt); 
    symb_vars.push(ret.var); 
  }

  var obj = freshObjectVar();

  var constructor_args_str = symb_vars.reduce(function (cur_str, prox) {
    if (cur_str === "") return prox; 
    else return cur_str + ", " + prox; 
  });  

  var constructor_ret_str =`var ${obj} = new ${obj_name}(${constructor_args_str})`;
  return {
    stmt: str2ast(constructor_ret_str),
    var:obj
  }
}


//This function generates the call of a function 
function generateMainFunCall(fun_name:string, symb_vars:string[]) {

   var args_str = symb_vars.reduce(function (cur_str, prox) {
      if (cur_str === "") return prox; 
      else return cur_str + ", " + prox; 
   });

   var ret_str = `var ret = ${fun_name}(${args_str})`; 
   return {
    stmt: str2ast(ret_str), 
    var: "ret" 
   }; 
}


//This function generates an assertion to check if the return type of a function is a string 
function generateFinalStringAsrt(ret_var:string) { 
    var ret_str = `assert(typeof ${ret_var} === "string");`; 
    return str2ast(ret_str); 
}

//This function generates an assertion to check if the return type of a function is a number 
function generateFinalNumberAsrt(ret_var:string) { 
    var ret_str = `assert(typeof ${ret_var} === "number");`; 
    return str2ast(ret_str); 
}

function generateFinalObjectAsrt(ret_var:string) { 
  var ret_str = `assert(typeof ${ret_var} === "Animal");`; 
  return str2ast(ret_str); 
}

//This function generates an assertion to check the return type based on the expected return 
//type and the return type on the return variable
function generateFinalAsrt (ret_type:string, ret_var:string) {
   switch(ret_type) {
      case "string" : return generateFinalStringAsrt(ret_var); 

      case "number" : return generateFinalNumberAsrt(ret_var); 

      case "Animal" : return generateFinalObjectAsrt(ret_var)
      
      default: throw new Error ("generateFinalAsrt: Unsupported type")
   }
}


//This function generates the output block
function generateBlock(stmts) {
    return {
        type: "BlockStatement",
        body: stmts 
    }
}

//This is the function that receiving a function name, the argument types and the expected return type
//generates a test for the function 
function GenerateTest(fun_name:string, arg_types:string[], ret_type:string) {
  var symb_vars = []; 
   var stmts=[];

  for (var i=0; i<arg_types.length; i++) { 
        var ret = createSymbAssignment(arg_types[i]);
        stmts.push(ret.stmt); 
        symb_vars.push(ret.var); 
  }

  var fun_call = generateMainFunCall(fun_name, symb_vars);
  stmts.push(fun_call.stmt)
  stmts.push(generateFinalAsrt(ret_type, fun_call.var)); 
  return generateBlock(stmts)
}


var first_test = GenerateTest("xpto", ["number", "string"], "number"); 
var first_test_str = ast2str(first_test); 
var outputFunction = freshTestVar();
fs.writeFile(outputFunction+".txt","function "+outputFunction+" () "+first_test_str, function(err){
  if(err) 
    return console.error(err);
});

var second_test = GenerateTest("foo", ["string", "Animal"], "Animal"); 
var second_test_str = ast2str(second_test); 
var outputFunction = freshTestVar();
fs.writeFile(outputFunction+".txt","function "+outputFunction+" () "+second_test_str, function(err){
  if(err) 
    return console.error(err);
});








