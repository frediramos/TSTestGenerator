import * as ts from "typescript";
import * as fs from "fs";


//Class to store parameters type, return type and class type if it is a class method and not a function
export class ComposedInfo {
    arg_types:ts.Type[]=[];
    ret_type:ts.Type;
}


//Interface of a simple Hashtable
export interface HashTable<T>{
    [key:string] : T;
}

class ClassVertex{
    visited:boolean = false;
    edges:string[];
}


//Class that will store all the information in the program
export class ProgramInfo{
    Checker: ts.TypeChecker;
    ClassesInfo: HashTable<ts.Type> = {};
    MethodsInfo: HashTable<HashTable<ComposedInfo>> = {};
    ConstructorsInfo: HashTable<ComposedInfo []> = {};
    PropertiesInfo: HashTable<HashTable<ts.Type>> = {};
    FunctionsInfo: HashTable<ComposedInfo> = {};

    hasClass(class_name:string):boolean{
        if(this.ClassesInfo[class_name]===undefined)
            return false;
        return true;
    }
}

//::::::::Function to set up for the traversation of the AST::::::::
export function finder(fileNames:string[]):ProgramInfo{

    var prog_info=new ProgramInfo();
    const program = ts.createProgram(fileNames, { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS});
    const checker = program.getTypeChecker();
    prog_info.Checker=checker;
    const visitASTWithChecker = visitAST.bind(undefined, checker,prog_info);

    for (const sourceFile of program.getSourceFiles()) 
        if (!sourceFile.isDeclarationFile) 
            ts.forEachChild(sourceFile, visitASTWithChecker);
    return prog_info;
}


//::::::::Function to traverse the AST::::::::
function visitAST(checker: ts.TypeChecker,  prog_info:ProgramInfo, node: ts.Node) {

    //Check if the node is exported or not
    if (!isNodeExported(node)) 
        return;
    

    //-----Classes handling-----
    else if (ts.isClassDeclaration(node) && node.name) {
        
        const symbol = checker.getSymbolAtLocation(node.name);
        
        //Store the type of the class in the position "<ClassName>" of ClassInfo
        prog_info.ClassesInfo[symbol.getName()] = checker.getTypeAtLocation(node);


        //-----Constructors, methods and properties handling-----
        
        var constructor_count:number = 0;

        for(const member of node.members) {
            const member_symbol = checker.getSymbolAtLocation(member.name);

            //-----Constructors handling-----
            if(ts.isConstructorDeclaration(member)){
                
                //Must initialize sub-array, otherwise it is undefined
                if(prog_info.ConstructorsInfo[symbol.getName()]===undefined)
                    prog_info.ConstructorsInfo[symbol.getName()] = [];
                    
                prog_info.ConstructorsInfo[symbol.getName()][constructor_count]=new ComposedInfo();

                //Store the types of the parameters in arg_types in the position "<ClassName><ConstructorNumber>" of ConstructorsInfo 
                for(const parameter of member.parameters){
                    const symbol_p = checker.getSymbolAtLocation(parameter.name);
                    prog_info.ConstructorsInfo[symbol.getName()][constructor_count].arg_types.push(checker.getTypeOfSymbolAtLocation(symbol_p, symbol_p.valueDeclaration!));
                }

                //Store the return type of the constructor in ret_type in the position "<ClassName><ConstructorNumber>" of ConstructorsInfo 
                prog_info.ConstructorsInfo[symbol.getName()][constructor_count].ret_type=checker.getTypeAtLocation(node);

                constructor_count++;
            }

            //-----Methods handling-----
            else if (ts.isMethodDeclaration(member)){

                //Must initialize sub-hashtable, otherwise it is undefined
                if(prog_info.MethodsInfo[symbol.getName()]===undefined)
                    prog_info.MethodsInfo[symbol.getName()] = {};

                prog_info.MethodsInfo[symbol.getName()][member_symbol.getName()]=new ComposedInfo();

                //Store the types of the parameters in arg_types in the position "<ClassName><MethodName>" of MethodsInfo 
                for(const parameter of member.parameters){
                    const symbol_p = checker.getSymbolAtLocation(parameter.name);
                    prog_info.MethodsInfo[symbol.getName()][member_symbol.getName()].arg_types.push(checker.getTypeOfSymbolAtLocation(symbol_p, symbol_p.valueDeclaration!));
                }

                //Store the return type of the method in ret_type in the position "<ClassName><MethodName>" of MethodsInfo 
                prog_info.MethodsInfo[symbol.getName()][member_symbol.getName()].ret_type=checker.getTypeAtLocation(member.type);
            }

            //-----Properties handling-----
            else if(ts.isPropertyDeclaration(member)){

                //Must initialize sub-hashtable, otherwise it is undefined
                if(prog_info.PropertiesInfo[symbol.getName()]===undefined)
                    prog_info.PropertiesInfo[symbol.getName()]={};

                //Stores the property type in the position"<ClassName><PropertyName>" of PropertiesInfo
                prog_info.PropertiesInfo[symbol.getName()][member_symbol.getName()]=checker.getTypeAtLocation(member.type);
            }
        }
    }

    //-----Functions handling-----
    else if(ts.isFunctionDeclaration(node) && node.name) {
        const symbol = checker.getSymbolAtLocation(node.name);

        prog_info.FunctionsInfo[symbol.getName()]=new ComposedInfo();
        const functionType = checker.getTypeOfSymbolAtLocation(symbol,symbol.valueDeclaration!);

        for(const signature of functionType.getCallSignatures()){

            //Store the types of the parameters in arg_types in the position "<FunctionName>" of FunctionsInfo 
            for(const parameter of signature.parameters)
            prog_info.FunctionsInfo[symbol.getName()].arg_types.push(checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!));
            
            //Store the return type of the function in ret_type in the position "<FunctionName>" of FunctionsInfo
            prog_info.FunctionsInfo[symbol.getName()].ret_type=signature.getReturnType();
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


////::::::::This function initializes the classes graph::::::::
function initializeClassesGraph(classes_graph:HashTable<ClassVertex>,program_info:ProgramInfo){

    Object.keys(program_info.ConstructorsInfo).forEach(function (class_name) { 
        
        if(classes_graph[class_name]===undefined){
            classes_graph[class_name]=new ClassVertex();
            classes_graph[class_name].edges=[];
        }

        for(var i=0; i<program_info.ConstructorsInfo[class_name].length; i++){
            for (var j=0; j<program_info.ConstructorsInfo[class_name][i].arg_types.length; j++){
                
                var arg_type = program_info.ConstructorsInfo[class_name][i].arg_types[j];
                var arg_type_str = program_info.Checker.typeToString(arg_type);
                
                if(arg_type_str !=="string" && arg_type_str !=="number"){

                        
                    classes_graph[class_name].edges.push(arg_type_str);
                }
            }
        }
    });
}

////::::::::This function initializes the classes graph::::::::
function visitGraph(vertex:ClassVertex,graph:HashTable<ClassVertex>){

    if(vertex.visited){
        return{
            path: [],
            cycle: true
        };
    }
    
    vertex.visited=true;
    var hasCycle = false;
    var paths = [];

    for(var i=0;i<vertex.edges.length;i++){
        
        var ret_edge_visit = visitGraph(graph[vertex.edges[i]],graph);
        for(var j=0;j<ret_edge_visit.paths.length;j++){
            var path=" -> "+vertex.edges[i]+ret_edge_visit.paths[j];
            if(ret_edge_visit.cycle){
                hasCycle = true;
                paths.push(path);
            }   
        }
    }

    return {
        paths:paths,
        cycle:hasCycle
    }

}


//::::::::Sets all vertices to non visited::::::::
function setAllVerticesNotVisited(graph:HashTable<ClassVertex>){
    Object.keys(graph).forEach(function (class_name) {
        graph[class_name].visited=false;
    });
}


//::::::::Returns the method and properties that will generate a cycle while generating the tests::::::::
export function findCycles(program_info:ProgramInfo){
    var classes_graph:HashTable<ClassVertex> = {};
    var cycles =[];

    initializeClassesGraph(classes_graph,program_info);

    Object.keys(classes_graph).forEach(function (class_name) {

        var ret_cycle=visitGraph(classes_graph[class_name],classes_graph);

        for(var i=0;i<ret_cycle.paths.length;i++){
            var start=class_name;
            start=start+ret_cycle.paths[i];

            if(ret_cycle.cycle)
                cycles.push(start);
        }   
        
        setAllVerticesNotVisited(classes_graph);
    });

    return cycles;
}