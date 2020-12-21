//::::::::Function used to create the name of some type of variable with the respective number::::::::
function makeFreshVariable (prefix:string) {
    var count = 0; 
  
    return function () { 
       count++;  
       return prefix + "_" + count;      
    }
  }
  
  //::::::::Function used to create the name of a variable with the respective number::::::::
  export var freshXVar = makeFreshVariable("x"); 
  //::::::::Function used to create the name of an assert variable with the respective number::::::::
  export var freshAssertVar = makeFreshVariable("a"); 
  //::::::::Function used to create the name of an object with the respective number::::::::
  export var freshObjectVar = makeFreshVariable("obj");
  //::::::::Function used to create the name of a mock function with the respective number::::::::
  export var freshMockFuncVar = makeFreshVariable("mockFunc");
  //::::::::Function used to create the name of an array with the respective number::::::::
  export var freshArrayVar = makeFreshVariable("arr");
  //::::::::Function used to create the name of a control variable -> used to select the number of elements of an array ::::::::
  export var freshControlArrVar = makeFreshVariable("control_arr");
  //::::::::Function used to create the name of a control variable -> used to select which object constructor will be used ::::::::
  export var freshControlObjVar = makeFreshVariable("control_obj");
  //::::::::Function used to create the name of a fuel variable with the respective number ::::::::
  export var freshFuelVar = makeFreshVariable("fuel");
  //::::::::Function used to create the name of a fuel array with the respective number ::::::::
  export var freshFuelArrVar = makeFreshVariable("fuel_arr");
  //::::::::Function used to create the name of an union variable with the respective number ::::::::
  export var freshUnionVar = makeFreshVariable("union");
  //::::::::Function used to create the name of a control variable -> used to select which assigment will be made to the union::::::::
  export var freshControlUnionVar = makeFreshVariable("control_union");
  //::::::::Function used to create the name of an index with the respective number ::::::::
  export var freshIndexVar = makeFreshVariable("i");
   //::::::::Function used to create the name of a control variable -> used to select which assigment will be made to the argument::::::::
   export var freshControlArgVar = makeFreshVariable("control_arg");
