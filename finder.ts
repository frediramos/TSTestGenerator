import * as ts from "typescript";
import * as fs from "fs";


//Class to store parameters type, return type and class type if it is a class method and not a function
class ComposedInfo {
    arg_types:ts.Type[]=[];
    ret_type:ts.Type;
}


//Interface of a simple Hashtable
interface HashTable<T>{
    [key:string] : T;
}


//Hashtables declaration and initialization
var ClassesInfo: HashTable<ts.Type> = {};
var MethodsInfo: HashTable<ComposedInfo> = {};
var ConstructorsInfo: HashTable<ComposedInfo> = {};
var PropertiesInfo: HashTable<ts.Type> = {};
var FunctionsInfo: HashTable<ComposedInfo> = {};


//::::::::Function to set up for the traversation of the AST::::::::
function finder(fileNames:string[],options:ts.CompilerOptions):void{

    const program = ts.createProgram(fileNames, options);
    const checker = program.getTypeChecker();
    const visitASTWithChecker = visitAST.bind(undefined, checker);

    for (const sourceFile of program.getSourceFiles()) 
        if (!sourceFile.isDeclarationFile) 
            ts.forEachChild(sourceFile, visitASTWithChecker);
}


//::::::::Function to traverse the AST::::::::
function visitAST(checker: ts.TypeChecker, node: ts.Node) {

    //Check if the node is exported or not
    if (!isNodeExported(node)) 
        return;
    

    //-----Classes handling-----
    else if (ts.isClassDeclaration(node) && node.name) {

        const symbol = checker.getSymbolAtLocation(node.name);
        
        //Store the type of the class in the position "<ClassName>" of ClassInfo
        ClassesInfo[symbol.getName()] = checker.getTypeAtLocation(node);
        

        //-----Constructors handling-----
        ConstructorsInfo[symbol.getName()]=new ComposedInfo();

        //This constructorType will then be used to get the ConstructSignatures from where we can get the parameters and the return type
        const constructorType = checker.getTypeOfSymbolAtLocation(symbol,symbol.valueDeclaration!);

        for(const signature of constructorType.getConstructSignatures()){

            //Store the types of the parameters in arg_types in the position "<ClassName>" of ConstructorsInfo 
            for(const parameter of signature.parameters)
                ConstructorsInfo[symbol.getName()].arg_types.push(checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!));
            
            //Store the return type of the constructor in ret_type in the position "<ClassName>" of ConstructorsInfo
            ConstructorsInfo[symbol.getName()].ret_type=signature.getReturnType();
        }


        //-----Methods and properties handling-----
        for(const member of node.members) {
            const symbol = checker.getSymbolAtLocation(member.name);

            //-----Methods handling-----
            if (ts.isMethodDeclaration(member)){

                MethodsInfo[symbol.getName()]=new ComposedInfo();

                //Store the types of the parameters in arg_types in the position "<MethodName>" of MethodsInfo 
                for(const parameter of member.parameters){
                    const symbol_p = checker.getSymbolAtLocation(parameter.name);
                    MethodsInfo[symbol.getName()].arg_types.push(checker.getTypeOfSymbolAtLocation(symbol_p, symbol_p.valueDeclaration!));
                }

                //Store the return type of the method in ret_type in the position "<MethodName>" of MethodsInfo 
                MethodsInfo[symbol.getName()].ret_type=checker.getTypeAtLocation(member.type);
            }

            //-----Properties handling-----

            //Stores the property type in the position"<PropertyName>" of PropertiesInfo
            else if(ts.isPropertyDeclaration(member))
                PropertiesInfo[symbol.getName()]=checker.getTypeAtLocation(member.type);
        }
    }

    //-----Functions handling-----
    else if(ts.isFunctionDeclaration(node) && node.name) {
        const symbol = checker.getSymbolAtLocation(node.name);

        FunctionsInfo[symbol.getName()]=new ComposedInfo();
        const functionType = checker.getTypeOfSymbolAtLocation(symbol,symbol.valueDeclaration!);

        for(const signature of functionType.getCallSignatures()){

            //Store the types of the parameters in arg_types in the position "<FunctionName>" of FunctionsInfo 
            for(const parameter of signature.parameters)
            FunctionsInfo[symbol.getName()].arg_types.push(checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!));
            
            //Store the return type of the function in ret_type in the position "<FunctionName>" of FunctionsInfo
            FunctionsInfo[symbol.getName()].ret_type=signature.getReturnType();
        }
    }
}


//::::::::Checks if the node is exported::::::::
function isNodeExported(node: ts.Node): boolean {
    return (
      (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
      (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
  }


//::::::::Call of the function that will find the information we need::::::::
finder(process.argv.slice(2), { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS});



//  (Example to see how the program runs)
//  ______________________________________________________________

const program = ts.createProgram(process.argv.slice(2), { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS});
const checker = program.getTypeChecker();

console.log("Classes:");
console.log("Expected class type: Animal                            Returned class type: "+checker.typeToString(ClassesInfo["Animal"]));
console.log("Expected class type: Person                            Returned class type: "+checker.typeToString(ClassesInfo["Person"]));
console.log("_______________________________________________________________________________________________________________\n\nProperties:");
console.log("Expected property type: Animal                         Returned property type: "+checker.typeToString(PropertiesInfo["friend"]));
console.log("Expected property type: number                         Returned property type: "+checker.typeToString(PropertiesInfo["position"]));
console.log("_______________________________________________________________________________________________________________\n\nConstructors:");
console.log("Expected constructor parameter type: number            Returned constructor parameter type: "+checker.typeToString(ConstructorsInfo["Animal"].arg_types[0]));
console.log("Expected constructor return type: Animal               Returned constructor return type: "+checker.typeToString(ConstructorsInfo["Animal"].ret_type));
console.log("_______________________________________________________________________________________________________________\n\nMethods:");
console.log("Expected method parameter type: number                 Returned method parameter type: "+checker.typeToString(MethodsInfo["walk"].arg_types[0]));
console.log("Expected method parameter type: Animal                 Returned method parameter type: "+checker.typeToString(MethodsInfo["walk"].arg_types[1]));
console.log("Expected method return type: void                      Returned method return type: "+checker.typeToString(MethodsInfo["walk"].ret_type));
console.log("_______________________________________________________________________________________________________________\n\nFunctions:");
console.log("Expected function parameter type: number               Returned function parameter type: "+checker.typeToString(FunctionsInfo["walk"].arg_types[0]));
console.log("Expected function return type: number                  Returned function return type: "+checker.typeToString(FunctionsInfo["walk"].ret_type));

if(!(ClassesInfo["Person"]===ClassesInfo["Animal"])){
    console.log("_______________________________________________________________________________________________________________\nClass Person type different from class Animal type");
}

if(MethodsInfo["walk"].arg_types[1]===ClassesInfo["Animal"]){
    console.log("Parameter partner type equals class Animal type");
}

if(ConstructorsInfo["Animal"].ret_type===ClassesInfo["Animal"]){
    console.log("Constructor of Animal return type equals class Animal type");
}

//  ______________________________________________________________

