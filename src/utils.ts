var escodegen = require('escodegen');
var esprima = require('esprima');

//::::::::Turns ast into string::::::::
export function ast2str (e) {

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
export function str2ast (str:string) {
    var ast = esprima.parse (str); 
  
    return ast.body[0];
}

//::::::::Function used to generate the combinations for the control vars::::::::
export function createCombinations(args) {
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

//::::::::Function used to create some special characters in the output file::::::::
export function stringManipulation(test_str:string):string{

    var test_str_ret1 = test_str.split("$Enter$();").join("");
    var test_str_ret2 = test_str_ret1.split("Comment1").join("/* ");
    var test_str_ret3 = test_str_ret2.split("Comment2();").join(" */");
    var test_str_ret4 = test_str_ret3.split("$Space$").join(" ");
    var test_str_ret5 = test_str_ret4.split("$Colons$").join(": ");
    var test_str_ret6 = test_str_ret5.split("$Apostrophe$").join("'");
  
    return test_str_ret6;
}