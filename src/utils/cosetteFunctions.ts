//Class used to store the Cosette functions
export class CosetteFunctions {
    number_creator:string = "esl_symbolic.number"
    string_creator:string = "esl_symbolic.string"
    boolean_creator:string = "symb_boolean"
    null_creator:string = "null"
    void_creator:string = "undefined"
    any_creator:string = "symb"
    assume:string = "esl_symbolic.assume"
    assert:string = "esl_symbolic.assert"
  
    //function that will return the string of the call of the symbolic number creator
    numberCreator(x:string):string{
      return `${this.number_creator}("${x}")`
    }
  
    //function that will return the string of the call of the symbolic string creator
    stringCreator(x:string):string{
      return `${this.string_creator}("${x}")`
    }
  
    //function that will return the string of the call of the symbolic boolean creator
    booleanCreator(x:string):string{
      return `${this.boolean_creator}("${x}")`
    }
    
    //function that will return the string of the call of the null creator
    nullCreator():string{
      return `${this.null_creator}`
    }
  
    //function that will return the string of the call of the void creator
    voidCreator():string{
      return `${this.void_creator}`
    }

    //function that will return the string of the call of the any creator
    anyCreator(x:string):string{
      return `${this.any_creator}("${x}")`
    }
  
    //function that will return the string of the assertion of a typeof 
    assertCreator(x:string,t:string):string{
      return `${this.assert}(typeof ${x} === "${t}");`
    }
  }