var fs = require('fs');
import finder = require("./finder");
import * as constants from "./constants";
import * as utils from "./utils";
import * as freshVars from "./freshVars";
import * as TsASTFunctions from "./TsASTFunctions";
import * as generateSymbolicTypes from "./generateSymbolicTypes";
import * as generateSymbolicObjects from "./generateSymbolicObjects";
import * as generateSymbolicInterface from "./generateSymbolicInterface";
import * as generateSymbolicFunctions from "./generateSymbolicFunctions";
import * as generateTypesAssertions from "./generateTypesAssertions";

//::::::::This function generates the call of all the constructors of a class::::::::
function generateConstructorTests(class_name:string,program_info:finder.ProgramInfo){
  var symb_vars = [];
  var stmts = [];
  var control_vars = [];
  var control_nums = [];
  var needs_for;
  var for_stmts = [];

  for_stmts.push(utils.str2ast(constants.ENTER_STR));

  //Iterates over all the object constructors
  for(var i=0; i<program_info.ConstructorsInfo[class_name].length; i++){
    for_stmts = [];
    symb_vars = [];

    //Iterates over all the argument types of that constructor
    for (var j=0; j<program_info.ConstructorsInfo[class_name][i].arg_types.length; j++) { 
      
      //This flag will be activated if any of the arguments of the constructor needs recursive construction
      needs_for = false
      if(program_info.cycles_hash[class_name]) {
        needs_for = true;
      }

      //Generates a variable of the argument type
      var ret = generateSymbolicTypes.createSymbAssignment(program_info.ConstructorsInfo[class_name][i].arg_types[j],program_info);
      for_stmts=for_stmts.concat(ret.stmts); 
      symb_vars.push(ret.var); 

      //Checks if any argument needs recursive construction
      if(ret["needs_for"]) {
        needs_for = true;
        var fuel_arr = ret["fuel_var"];       //Fuel array used for the recursive construction
        var index = ret["index_var"];             //Index to access the positions of the fuel array
      }

      //Checks if any argument has more than one possible value
      if(ret.control !== undefined){
        control_vars = control_vars.concat(ret.control);
        control_nums = control_nums.concat(ret.control_num);
      } 
    }

    //Generates the object var 
    var obj = freshVars.freshObjectVar();
    //If the object is an interface it adds a prefix 
    if(program_info.hasInterface(class_name))
      obj = "interface_" + obj;

    //Creates a string with the arguments in parameters format, for example "x_1,x_2"
    var constructor_args_str = symb_vars.reduce(function (cur_str, prox) {
      if (cur_str === "") return prox; 
      else return cur_str + ", " + prox; 
    },"");  

    //Generates the assignment of the object variable to a new object of the given type
    var constructor_ret_str = `var ${obj} = new ${class_name}(${constructor_args_str})`;
    var constructor_ret_stmt = utils.str2ast(constructor_ret_str); 
    for_stmts.push(constructor_ret_stmt);

    if(needs_for) {
      var all_cases = [];
      var all_combinations = [];
      var fuel_vars = [];
      var cases;
      var combinations;
  
      for(var i = 0; i<constants.FUEL_VAR_DEPTH; i++) {
        cases = [];
        for (var j=0;j<program_info.max_constructors_recursive_objects;j++) {
          cases.push(j+1);
        }
  
        all_cases.push(cases);
        
        combinations = utils.createCombinations(all_cases);
        all_combinations = all_combinations.concat(combinations);
      }
      
      var selected_combination;
      var fuel_var;
      for(var i = 0; i<20; i++){
        stmts.push(utils.str2ast(constants.ENTER_STR));
        selected_combination = Math.floor(Math.random() * (all_combinations.length - 1));
        fuel_var = freshVars.freshFuelVar();
        stmts.push(utils.str2ast(`var ${fuel_var} = [${all_combinations[selected_combination]}]`));
        fuel_vars.push(fuel_var);
      }
      
      //Creates a string with the arguments in parameters format, for example "x_1, x_2"
      var fuel_arr_args = fuel_vars.reduce(function (cur_str, prox) {
        if (cur_str === "") return prox; 
        else return cur_str + ", " + prox; 
      },"");  

      stmts.push(utils.str2ast(constants.ENTER_STR));
      stmts.push(utils.str2ast(`var ${fuel_arr} = [${fuel_arr_args}]`));

      stmts.push(utils.str2ast(constants.ENTER_STR));
      stmts.push(TsASTFunctions.generateForStatement(fuel_arr, index, for_stmts));
      stmts.push(utils.str2ast(constants.ENTER_STR));
    }

    else {
      for(var i = 0; i<for_stmts.length; i++) {
        stmts.push(for_stmts[i]);
      }
    }
  }

  return {
    stmt:TsASTFunctions.createFunctionDeclaration("test_"+class_name+"_constructors",stmts,control_vars),
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

  stmts.push(utils.str2ast(constants.ENTER_STR));

  //Creation of the object where the method will be tested
  var ret_obj = generateSymbolicObjects.createObjectSymbParams(class_name,program_info);
  stmts=stmts.concat(ret_obj.stmts);
  //Checks if any argument has more than one possible value
  if(ret_obj.control[0]!==undefined){
    control_vars = control_vars.concat(ret_obj.control);
    control_nums = control_nums.concat(ret_obj.control_num);
  }
    
  
  //Creates the arguments of the method
  var ret_args = generateSymbolicTypes.createArgSymbols(method_info.arg_types,program_info);
  stmts=stmts.concat(ret_args.stmts);
  //Checks if any argument has more than one possible value
  if(ret_args.control[0]!==undefined){
    control_vars = control_vars.concat(ret_args.control);
    control_nums = control_nums.concat(ret_args.control_num);
  }

  //Creates the method call which the return value will be put in a variable
  var x = freshVars.freshXVar();
  var ret_str = `var ${x} = ${ret_obj.var}.${method_name}(${ret_args.vars_str})`;
  var ret_ast = utils.str2ast(ret_str);
  stmts.push(ret_ast);
  
  //Creates the assertion of the variable with the method's return type to the expected return type
  var ret_asrt = generateTypesAssertions.generateFinalAsrt(method_info.ret_type,x,program_info);
  stmts = stmts.concat(ret_asrt.stmt);
  stmts.push(utils.str2ast(`Assert(${ret_asrt.var})`));

  stmts.push(utils.str2ast(constants.ENTER_STR)); 

  return {
    stmt: TsASTFunctions.createFunctionDeclaration("test"+method_number_test+"_"+method_name,stmts,control_vars),
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

  stmts.push(utils.str2ast(constants.ENTER_STR));

  //Creation the arguments of the function 
  var ret_args = generateSymbolicTypes.createArgSymbols(function_info.arg_types,program_info);
  stmts=stmts.concat(ret_args.stmts);

  //Checks if any argument has more than one possible value
  if(ret_args.control[0]!==undefined){
    control_vars = control_vars.concat(ret_args.control);
    control_nums = control_nums.concat(ret_args.control_num);
  }
    

  //Creates the function call and places the return value in a variable 
  var x =freshVars.freshXVar();
  var ret_str = `var ${x} = ${fun_name}(${ret_args.vars_str})`;
  var ret_ast = utils.str2ast(ret_str);
  stmts.push(ret_ast);  

  //Creates the assertion of the variable with the function's return type to the expected return type
  var ret_asrt = generateTypesAssertions.generateFinalAsrt(function_info.ret_type,x,program_info);
  stmts = stmts.concat(ret_asrt.stmt);
  stmts.push(utils.str2ast(`Assert(${ret_asrt.var})`));
  stmts.push(utils.str2ast(constants.ENTER_STR)); 
  
  return {
    stmt: TsASTFunctions.createFunctionDeclaration("test"+fun_number_test+"_"+fun_name,stmts,control_vars),
    control: control_vars,
    control_num: control_nums
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
  var all_cases = [];
  var cases;
  var combinations;
  

  //Create functions generated for when there is cyclic construction in the objects 
  Object.keys(program_info.cycles_hash).forEach(function (class_name) {
    //Recursive creation function generation
    var recursive_create_function = generateSymbolicObjects.createObjectRecursiveSymbParams(class_name,program_info);
    tests.push(recursive_create_function);
    recursive_create_functions[class_name] = utils.ast2str(recursive_create_function);
    constant_code_str += utils.ast2str(recursive_create_function)+"\n\n";

    //Saves the number of constructors of the object with cyclic that has more constructors for later use in the fuel var array
    if(program_info.max_constructors_recursive_objects < program_info.ConstructorsInfo[class_name].length)
      program_info.max_constructors_recursive_objects = program_info.ConstructorsInfo[class_name].length;
  });

  tests.push(utils.str2ast(constants.ENTER_STR));

  //Creation of Mock constructors and methods for interfaces
  Object.keys(program_info.InterfacesInfo).forEach(function (interface_name) {
    //Creation of the mock constructor for the interface
    var interface_mock_constructor = generateSymbolicInterface.createInterfaceMockConstructor(interface_name,program_info);
    constant_code_str += utils.ast2str(interface_mock_constructor.stmts)+"\n\n";

    //Creation of the mock methods for the interface
    if(program_info.MethodsInfo[interface_name]){
      Object.keys(program_info.MethodsInfo[interface_name]).forEach(function (method_name) {
        var interface_method_info = program_info.MethodsInfo[interface_name][method_name];
        var interface_mock_method = generateSymbolicFunctions.createMockFunction(interface_method_info.arg_types,interface_method_info.ret_type,program_info);
        var proto_assignment = TsASTFunctions.createPrototypeAssignment(interface_name, method_name, interface_mock_method);
        constant_code_str += utils.ast2str(proto_assignment)+"\n\n";
      });
    }
  });

  //Iterates over all the object that have at least one constructor
  Object.keys(program_info.ConstructorsInfo).forEach(function (class_name) { 

    curr_test = constant_code_str+"\n";

    //Calculates the test number
    if(number_test[class_name] === undefined)
      number_test[class_name] = 1;
    else
      number_test[class_name]++;

    var comment = "Comment1Test"+constants.SPACE_STR+"of"+constants.SPACE_STR+class_name+constants.APOSTROPHE_STR+"s"+constants.SPACE_STR+"constructors"+"Comment2();";
    tests.push(utils.str2ast(comment));
    curr_test += comment+"\n";

    //Generation of the constructors tests
    var ret = generateConstructorTests(class_name,program_info);
    tests.push(ret.stmt);
    curr_test+=utils.ast2str(ret.stmt)+"\n";

    tests.push(utils.str2ast(constants.ENTER_STR));

    //It will generate an array with the multiple options that each function will have for their switch statement(s), if they exist
    all_cases = [];
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
      combinations = utils.createCombinations(all_cases);
      
      //For each combination it will generate a call to the constructor's test function
      for(var i = 0;i<combinations.length;i++){
        constructor_call_str = "test_"+class_name+"_constructors("+combinations[i]+");";
        constructor_call = utils.str2ast(constructor_call_str);
        tests.push(constructor_call);
        curr_test += "\n"+constructor_call_str;
        tests.push(utils.str2ast(constants.ENTER_STR)); 
      }
    }

    //If there is only one case it will generate the call to the constructor's test function without arguments
    else{
      constructor_call_str = "test_"+class_name+"_constructors();";
      constructor_call = utils.str2ast(constructor_call_str);
      tests.push(constructor_call);
      curr_test += "\n"+constructor_call_str;
      tests.push(utils.str2ast(constants.ENTER_STR)); 
    }

    //It will write the constructor's test in a file inside the TS file test directory
    fs.writeFileSync("../"+output_dir+"/test_"+class_name+"_constructors.js",js_file+"\n\n"+utils.stringManipulation(curr_test));

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
      
      var comment = "Comment1Test"+constants.SPACE_STR+"of"+constants.SPACE_STR+class_name+constants.APOSTROPHE_STR+"s"+constants.SPACE_STR+"method"+constants.COLONS_STR+method_name+"Comment2();";
      tests.push(utils.str2ast(comment));
      curr_test += comment+"\n";

      //Generates the method's test function
      var ret = generateMethodTest(class_name,method_name,number_test[method_name],program_info);
      tests.push(ret.stmt);
      curr_test += utils.ast2str(ret.stmt)+"\n";

      tests.push(utils.str2ast(constants.ENTER_STR));

      //It will generate an array with the multiple options that each function will have for their switch statement(s), if they exist
      all_cases = [];
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
        combinations = utils.createCombinations(all_cases);
        //For each combination it will generate a call to the method test function
        for(var i = 0;i<combinations.length;i++){
          method_call_str = "test"+number_test[method_name]+"_"+method_name+"("+combinations[i]+");";
          method_call = utils.str2ast(method_call_str);
          tests.push(method_call);
          curr_test += "\n"+method_call_str;
          tests.push(utils.str2ast(constants.ENTER_STR)); 
        }
      }
      
      //If there is only one case it will generate the call to the method's test function without arguments
      else{
        method_call_str = "test"+number_test[method_name]+"_"+method_name+"();"
        method_call = utils.str2ast(method_call_str);
        tests.push(method_call);
        curr_test += "\n"+method_call_str;
        tests.push(utils.str2ast(constants.ENTER_STR)); 
      }

      //It will write the method's test in a file inside the TS file test directory
      fs.writeFileSync("../"+output_dir+"/test"+number_test[method_name]+"_"+method_name+".js",js_file+"\n\n"+utils.stringManipulation(curr_test));

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

    var comment = "Comment1Test"+constants.SPACE_STR+"of"+constants.SPACE_STR+"function"+constants.COLONS_STR+fun_name+"Comment2();";
    tests.push(utils.str2ast(comment));
    curr_test += comment+"\n";

    //Generates the function's test function
    var ret = generateFunctionTest(fun_name,number_test[fun_name],program_info);
    tests.push(ret.stmt);
    curr_test += utils.ast2str(ret.stmt)+"\n";

    tests.push(utils.str2ast(constants.ENTER_STR));
   
    //It will generate an array with the multiple options that each function will have for their switch statement(s), if they exist
    all_cases = [];
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
      combinations = utils.createCombinations(all_cases);
      //For each combination it will generate a call to the function test function
      for(var i = 0;i<combinations.length;i++){
        fun_call_str = "test"+number_test[fun_name]+"_"+fun_name+"("+combinations[i]+");";
        fun_call = utils.str2ast(fun_call_str);
        tests.push(fun_call);
        curr_test += "\n"+fun_call_str;
        tests.push(utils.str2ast(constants.ENTER_STR)); 
      }
    }

    //If there is only one case it will generate the call to the method's test function without arguments
    else{
      fun_call_str = "test"+number_test[fun_name]+"_"+fun_name+"();"
      fun_call = utils.str2ast(fun_call_str);
      tests.push(fun_call);
      curr_test += "\n"+fun_call_str;
      tests.push(utils.str2ast(constants.ENTER_STR)); 
    }
    
    //It will write the function's test in a file inside the TS file test directory
    fs.writeFileSync("../"+output_dir+"/test"+number_test[fun_name]+"_"+fun_name+".js",js_file+"\n\n"+utils.stringManipulation(curr_test));

    fun_names[num_fun]=fun_call_str;
    num_fun++;
  });

  var test_block = TsASTFunctions.generateBlock(tests);
  var test_str = utils.ast2str(test_block);

  //Manipulation of test file string to create special characters
  var test_str_final = utils.stringManipulation(test_str);

  //returns the string with all the test functions together
  return "/*\n=====Function that will run the tests functions=====\n*/\nfunction Test() "+test_str_final+"\n\nTest();";
}