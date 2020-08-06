import * as ts from "typescript";
import * as fs from "fs";

class ComposedInfo {
    arg_types:ts.Type[]=[];
    ret_type:ts.Type;
}

interface HashTable<T>{
    [key:string] : T;
}

var ClassesInfo: HashTable<ts.Type> = {};
var MethodsInfo: HashTable<ComposedInfo> = {};
var ConstructorsInfo: HashTable<ComposedInfo> = {};

function findStuff(fileNames:string[],options:ts.CompilerOptions):void{
    const program = ts.createProgram(fileNames, options);
    const checker = program.getTypeChecker();
    const visitWithChecker = visit.bind(undefined, checker);

    for (const sourceFile of program.getSourceFiles()) {
        if (!sourceFile.isDeclarationFile) {
            ts.forEachChild(sourceFile, visitWithChecker);
        }
    }
}

function visit(checker: ts.TypeChecker, node: ts.Node) {

    const visitWithChecker = visit.bind(undefined, checker);

    if (!isNodeExported(node)) {
        return;
    }

    else if (ts.isClassDeclaration(node) && node.name) {

        //Classes handling
        const symbol = checker.getSymbolAtLocation(node.name);
        if (symbol) {
            console.log("Class type: "+checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!)));
            ClassesInfo[symbol.getName()] = checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
        }

        //Constructors handling
        const constructorType = checker.getTypeOfSymbolAtLocation(symbol,symbol.valueDeclaration!);
        
        ConstructorsInfo[symbol.getName()]=new ComposedInfo();
        for(const signature of constructorType.getConstructSignatures()){
            for(const parameter of signature.parameters){
                console.log("Constructor parameter type: "+checker.typeToString(checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!)));
                ConstructorsInfo[symbol.getName()].arg_types.push(checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!));
            }
        }
        console.log("Constructor return type: "+symbol.getName())
        ConstructorsInfo[symbol.getName()].ret_type=checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);


        //Methods and properties handling
        for(const member of node.members) {
            const symbol = checker.getSymbolAtLocation(member.name);

            //Methods handling
            if (ts.isMethodDeclaration(member)){
                MethodsInfo[symbol.getName()]=new ComposedInfo();
                for(const parameter of member.parameters){
                    const symbol_p = checker.getSymbolAtLocation(parameter.name);
                    console.log("Parameter type: "+ checker.typeToString(checker.getTypeOfSymbolAtLocation(symbol_p, symbol_p.valueDeclaration!)));
                    MethodsInfo[symbol.getName()].arg_types.push(checker.getTypeOfSymbolAtLocation(symbol_p, symbol_p.valueDeclaration!));
                }
                console.log("Return type: "+member.type.getText());
                
                MethodsInfo[symbol.getName()].ret_type=checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration!);
            }

            /*
            //Properties handling
            else if(ts.isPropertyDeclaration(member))
                console.log("Atribute type: "+member.type.getText());
            */
        }
        ts.forEachChild(node, visitWithChecker);
    } 

    /*
    //Functions handling
    else if(ts.isFunctionDeclaration(node) && node.name) {
        const symbol = checker.getSymbolAtLocation(node.name);
        if (symbol) {
            console.log("Function name: "+symbol.getName());
        }
    }

    //Modules handling
    else if (ts.isModuleDeclaration(node)) {
        ts.forEachChild(node, visitWithChecker);
    }
    */
}

function isNodeExported(node: ts.Node): boolean {
    return (
      (ts.getCombinedModifierFlags(node as ts.Declaration) & ts.ModifierFlags.Export) !== 0 ||
      (!!node.parent && node.parent.kind === ts.SyntaxKind.SourceFile)
    );
  }


findStuff(process.argv.slice(2), { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS});
const program = ts.createProgram(process.argv.slice(2), { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS});
const checker = program.getTypeChecker();

console.log("\nClasses:");
console.log("\nExpected: typeof Animal     Returned: "+checker.typeToString(ClassesInfo["Animal"]));
console.log("\n\nConstructors:");
console.log("\nExpected: number            Returned: "+checker.typeToString(ConstructorsInfo["Animal"].arg_types[0]));
console.log("\nExpected: typeof Animal     Returned: "+checker.typeToString(ConstructorsInfo["Animal"].ret_type));
console.log("\n\nMethods:");
console.log("\nExpected: number            Returned: "+checker.typeToString(MethodsInfo["walk"].arg_types[0]));
console.log("\nExpected: string            Returned: "+checker.typeToString(MethodsInfo["walk"].arg_types[1]));
console.log("\nExpected: void              Returned: "+checker.typeToString(MethodsInfo["walk"].ret_type));


