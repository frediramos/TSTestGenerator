
import parse from 'esprima';

import generate from 'escodegen'

/*
m(x : number) : numberß

var x = symb_number("#x");
var ret = m(x); 
assert(typeof ret === "number");
*/


function ast2str (e) { 
    console.log ("HERE!!!"); 
    console.log (JSON.stringify(e)); 
     try { 
      const option = {
        format : {
          quotes : 'single',
          indent : {
            style : '\t'
          }
        }
      }; 
      return generate.generate(e, option);
     } catch (err) { 
      if ((typeof e) === "object") { 
        console.log("converting the following ast to str:\n" + e); 
      } else { 
        console.log("e is not an object!!!")
      }
      throw "ast2str failed."; 
     }
}

function str2ast (str) { 
  var ast = parse.parse (str); 
  return ast.body[0];
}

function makeFreshGenerator (prefix) {
  var count = 0;
  return function () { 
     count++;  
     return prefix + "_" + count;      
  }
}

var freshXVar = makeFreshGenerator("x"); 

function createStringSymbAssignment () { 
  var x = freshXVar(); 
  var ret_str = `var ${x} = symb_string("#${x}")`; 
  return {
      stmt: str2ast(ret_str), 
      var: x 
  } 
}

function createNumberSymbAssignment () { 
    var x = freshXVar(); 
    var ret_str = `var ${x} = symb_number("#${x}")`; 
    return {
        stmt: str2ast(ret_str), 
        var: x 
    } 
  }


function createSymbAssignment (arg_type) { 
  switch (arg_type) {
    case "string" : return createStringSymbAssignment(); 
    case "number" : return createNumberSymbAssignment(); 
    default: throw new Error ("createSymbAssignment: Unsupported type")
  }
}

function generateMainFunCall(fun_name, symb_vars) {
   console.log("cons: "+symb_vars); 

   var args_str = symb_vars.reduce(function (cur_str, prox) {
      if (cur_str === "") return prox; 
      else return cur_str + ", " + prox; 
   });



   var ret_str = `var ret = ${fun_name}(${args_str})`; 
   console.log(ret_str);
   var aux = str2ast(ret_str); 
   console.log("AUX: "+aux); 
   return {
    stmt: str2ast(ret_str), 
    var: "ret" 
   }; 
}

function generateFinalStringAsrt(ret_var) { 
    var ret_str = `assert(typeof ${ret_var} === "string");`; 
    return str2ast(ret_str); 
}

function generateFinalNumberAsrt(ret_var) { 
    var ret_str = `assert(typeof ${ret_var} === "number");`; 
    return str2ast(ret_str); 
}

function generateFinalAsrt (ret_type, ret_var) {
   switch(ret_type) {
      case "string" : return generateFinalStringAsrt(ret_var); 
      case "number" : return generateFinalNumberAsrt(ret_var); 
      default: throw new Error ("generateFinalAsrt: Unsupported type")
   }
}

function generateBlock(stmts) {
    return {
        type: "BlockStatement",
        body: stmts 
    }
}

function GenerateTest(fun_name, arg_types, ret_type) {
  var stmts = []; 
  var symb_vars = []; 
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
console.log(first_test_str);








