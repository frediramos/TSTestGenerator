import * as ts from "typescript";
import {IProgramInfo} from "./IProgramInfo"

//Class to store parameters type, return type and class type if it is a class method and not a function
export class ComposedInfo {
    arg_types:ts.Type[]=[];
    ret_type:ts.Type;
}


//Interface of a simple Hashtable
export interface HashTable<T> {
    [key:string] : T;
}

class ClassVertex{
    visited:number;
    edges:string[];
}


//Class that will store all the information in the program
export class ProgramInfo implements IProgramInfo<ts.Type> {
    Checker: ts.TypeChecker;
    ClassesInfo: HashTable<ts.Type> = {};
    MethodsInfo: HashTable<HashTable<ComposedInfo>> = {};
    ConstructorsInfo: HashTable<ComposedInfo []> = {};
    PropertiesInfo: HashTable<HashTable<ts.Type>> = {};
    FunctionsInfo: HashTable<ComposedInfo> = {};
    InterfacesInfo: HashTable<ts.Type> = {};
    cycles_hash : HashTable<string[][]> = {};
    max_constructors_recursive_objects:number = 0;

    getClassesInfo() :  HashTable<ts.Type> {
        return this.ClassesInfo;
    }

    getConstructorsInfo() : HashTable<ComposedInfo []> {
        return this.ConstructorsInfo;
    }

    getClassConstructorsInfo(class_name:string): ComposedInfo[] {
        return this.ConstructorsInfo[class_name];
    }

    getMethodsInfo(): HashTable<HashTable<ComposedInfo>> {
        return this.MethodsInfo;
    }
    
    getClassMethodsInfo(class_name:string): HashTable<ComposedInfo> {
        return this.MethodsInfo[class_name];
    }

    getClassMethodInfo(class_name:string, method_name:string): ComposedInfo {
        return this.MethodsInfo[class_name][method_name];
    }

    getFunctionsInfo(): HashTable<ComposedInfo> {
        return this.FunctionsInfo;
    }

    getFunctionInfo(function_name: string): ComposedInfo {
        return this.FunctionsInfo[function_name];
    }

    getInterfacesInfo(): HashTable<ts.Type> {
        return this.InterfacesInfo;
    }
    
    getInterfacePropertiesInfo(interface_name: string): HashTable<ts.Type> {
        return this.PropertiesInfo[interface_name];
    }

    getCyclesHashTable(): HashTable<string[][]> {
        return this.cycles_hash;
    }

    getMaxConstructorsRecursiveObjects(): number {
        return this.max_constructors_recursive_objects;
    }

    setMaxConstructorsRecursiveObjects(new_max:number): void {
        this.max_constructors_recursive_objects = new_max;
    }
    
    //This function gets the parameters and return types of a function
    getFunctionElements(fun_type:ts.Type):{params:ts.Type[], ret:ts.Type}[]{
        var ret = [];
        
        //Checks signatures in the fun_type in order to find the parameters types and the function return value
        for (const signature of fun_type.getCallSignatures()){

            var params = [];
            for(const parameter of signature.parameters){
                var parameter_type = this.Checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!);
                params.push(parameter_type);
            }
            var ret_type = signature.getReturnType();
            
            ret.push({
                params:params,
                ret: ret_type
            })
        }
    
        return ret;
    }
    
    //This function returns the type of the array
    getTypeOfTheArray(arr_type:ts.Type): ts.Type {
        return arr_type.getNumberIndexType();
    }

    hasCycle(class_name:string):boolean {
        if (this.cycles_hash[class_name])
            return true;
        else
            return false;
    }

    hasClass(class_name:string):boolean {
        if(this.ClassesInfo[class_name])
            return true;
        else
            return false;
    }

    hasInterface(interface_name:string):boolean {
        if(this.InterfacesInfo[interface_name])
            return true;
        else
            return false;
    }

    //::::::::Checks if the given type is a function type::::::::
    isFunctionType(arg_type:ts.Type):boolean {
        var arg_str =this.Checker.typeToString(arg_type);
        return arg_str.includes("=>"); 
    }

    //::::::::Checks if the given type is an array type::::::::
    isArrayType(arr_type:ts.Type):boolean {
        return arr_type.symbol && arr_type.symbol.name === "Array";
    }

    //::::::::Checks if the given type is an union type::::::::
    isUnionType(union_type:ts.Type):boolean {
        return union_type.hasOwnProperty("types");
    }
  

    //::::::::Checks if the given type is an object literal type::::::::
    isObjectLiteralType(object_literal_type:ts.Type):boolean {
        var ret =<boolean><unknown> (object_literal_type.symbol && object_literal_type.symbol.declarations && object_literal_type.symbol.members);
        return ret; 
    }
    
    //::::::::Checks if the given type is an object literal type::::::::
    isLiteralType(literal_type:ts.Type):boolean {
        var literal_type_node:ts.TypeLiteralNode = <ts.TypeLiteralNode> this.Checker.typeToTypeNode(literal_type);
        return typeof literal_type_node["literal"] === "object";
    }

    getStringFromType(type:ts.Type):string {
        return this.Checker.typeToString(type);
    }

    getObjectLiteralPropertyTypes(type:ts.Type):{[property_name: string] : ts.Type;} {
        var propertiesTypeDictionary:{[property_name: string] : ts.Type;} = {};
        var checker = this.Checker;

        //Stores the symbols of the object literal properties in a variable
        var object_literal_symbols = type.getProperties();   

        //Generates the property type variable 
        Object.keys(object_literal_symbols).forEach(function (property_number) {
            
            var property_symbol = object_literal_symbols[property_number];
            var property_type = checker.getTypeOfSymbolAtLocation(property_symbol, property_symbol.valueDeclaration!);
            propertiesTypeDictionary[property_symbol.escapedName] = property_type;
        });

        return propertiesTypeDictionary;
    }
}

//::::::::Function to set up for the traversation of the AST::::::::
export function finder(fileNames:string[]):ProgramInfo {

    var prog_info = new ProgramInfo();  
    const program = ts.createProgram(fileNames, { target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS, strictNullChecks: true});
    const checker = program.getTypeChecker();
    prog_info.Checker = checker; 
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
    

    //-----Classes and Interfaces handling-----
    else if ((ts.isClassDeclaration(node) || ts.isInterfaceDeclaration(node)) && node.name) {
        
        const symbol = checker.getSymbolAtLocation(node.name);
        
        //Store the type of the class in the position "<ClassName>" of ClassesInfo
        if(ts.isClassDeclaration(node))
            prog_info.ClassesInfo[symbol.getName()] = checker.getTypeAtLocation(node);
        
        //Store the type of the interface in the position "<InterfaceName>" of InterfacesInfo
        else if(ts.isInterfaceDeclaration(node)){
            prog_info.InterfacesInfo[symbol.getName()] = checker.getTypeAtLocation(node);

            //Placing an interface constructor in the constructors info that will be generated in testGenerator.ts
            //It will have no arguments because the property types will be generated and assigned to the object fields

            //Must initialize sub-array, otherwise it is undefined
            if(prog_info.ConstructorsInfo[symbol.getName()]===undefined)
                prog_info.ConstructorsInfo[symbol.getName()] = [];
            
            //Creating a ComposedInfo object in the position "<InterfaceName><0>" of ConstructorsInfo since it will only have 1 constructor
            prog_info.ConstructorsInfo[symbol.getName()][0] = new ComposedInfo();

            //Store the types of the parameters in arg_types in the position "<InterfaceName><0>" of ConstructorsInfo which will be []
            prog_info.ConstructorsInfo[symbol.getName()][0].arg_types = [];

            //Store the return type of the constructor in ret_type in the position "<InterfaceName><0>" of ConstructorsInfo 
            prog_info.ConstructorsInfo[symbol.getName()][0].ret_type = checker.getTypeAtLocation(node);
        }
            
        //-----Constructors, methods and properties handling-----
        
        var constructor_count:number = 0;

        for(const member of node.members) {
            const member_symbol = checker.getSymbolAtLocation(member.name);

            //-----Constructors handling-----
            if(ts.isConstructorDeclaration(member)) {
                
                //Must initialize sub-array, otherwise it is undefined
                if(prog_info.ConstructorsInfo[symbol.getName()]===undefined)
                    prog_info.ConstructorsInfo[symbol.getName()] = [];
                    
                prog_info.ConstructorsInfo[symbol.getName()][constructor_count] = new ComposedInfo();

                //Store the types of the parameters in arg_types in the position "<ClassName><ConstructorNumber>" of ConstructorsInfo 
                for(const parameter of member.parameters) {
                    const symbol_p = checker.getSymbolAtLocation(parameter.name);
                    prog_info.ConstructorsInfo[symbol.getName()][constructor_count].arg_types.push(checker.getTypeOfSymbolAtLocation(symbol_p, symbol_p.valueDeclaration!));
                }

                //Store the return type of the constructor in ret_type in the position "<ClassName><ConstructorNumber>" of ConstructorsInfo 
                prog_info.ConstructorsInfo[symbol.getName()][constructor_count].ret_type=checker.getTypeAtLocation(node);

                constructor_count++;
            }

            //-----Methods handling-----
            else if (ts.isMethodDeclaration(member) || ts.isMethodSignature(member)) {

                //Must initialize sub-hashtable, otherwise it is undefined
                if(prog_info.MethodsInfo[symbol.getName()]===undefined)
                    prog_info.MethodsInfo[symbol.getName()] = {};

                prog_info.MethodsInfo[symbol.getName()][member_symbol.getName()] = new ComposedInfo();

                //Store the types of the parameters in arg_types in the position "<Class/InterfaceName><MethodName>" of MethodsInfo 
                for(const parameter of member.parameters) {
                    const symbol_p = checker.getSymbolAtLocation(parameter.name);
                    prog_info.MethodsInfo[symbol.getName()][member_symbol.getName()].arg_types.push(checker.getTypeOfSymbolAtLocation(symbol_p, symbol_p.valueDeclaration!));
                }

                //Store the return type of the method in ret_type in the position "<Class/InterfaceName><MethodName>" of MethodsInfo 
                prog_info.MethodsInfo[symbol.getName()][member_symbol.getName()].ret_type = checker.getTypeAtLocation(member.type);
            }

            //-----Properties handling-----
            else if(ts.isPropertyDeclaration(member) || ts.isPropertySignature(member)){

                //Must initialize sub-hashtable, otherwise it is undefined
                if(prog_info.PropertiesInfo[symbol.getName()]===undefined)
                    prog_info.PropertiesInfo[symbol.getName()] = {};

                //Stores the property type in the position"<Class/InterfaceName><PropertyName>" of PropertiesInfo
                prog_info.PropertiesInfo[symbol.getName()][member_symbol.getName()] = checker.getTypeAtLocation(member.type);
            }
        }
    }

    //-----Functions handling-----
    else if(ts.isFunctionDeclaration(node) && node.name) {
        const symbol = checker.getSymbolAtLocation(node.name);

        prog_info.FunctionsInfo[symbol.getName()]=new ComposedInfo();
        const functionType = checker.getTypeOfSymbolAtLocation(symbol,symbol.valueDeclaration!);

        for(const signature of functionType.getCallSignatures()) {

            //Store the types of the parameters in arg_types in the position "<FunctionName>" of FunctionsInfo 
            for(const parameter of signature.parameters) {
                prog_info.FunctionsInfo[symbol.getName()].arg_types.push(checker.getTypeOfSymbolAtLocation(parameter, parameter.valueDeclaration!));
            }
            
            //Store the return type of the function in ret_type in the position "<FunctionName>" of FunctionsInfo
            prog_info.FunctionsInfo[symbol.getName()].ret_type = signature.getReturnType();
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
function initializeClassesGraph(classes_graph:HashTable<ClassVertex>,program_info:ProgramInfo) {

    Object.keys(program_info.ConstructorsInfo).forEach(function (class_name) { 
        
        if(classes_graph[class_name]===undefined) {
            classes_graph[class_name] = new ClassVertex();
            classes_graph[class_name].edges = [];
            classes_graph[class_name].visited = 0;
        }

        for(var i = 0; i<program_info.ConstructorsInfo[class_name].length; i++) {
            for (var j = 0; j<program_info.ConstructorsInfo[class_name][i].arg_types.length; j++) {
                
                var arg_type = program_info.ConstructorsInfo[class_name][i].arg_types[j];
                var arg_type_str = program_info.Checker.typeToString(arg_type);

                if (program_info.hasClass(arg_type_str)) {
                    classes_graph[class_name].edges.push(arg_type_str);
                }
                   
                else if(program_info.isFunctionType(arg_type)){
                    var ret_func_elements = program_info.getFunctionElements(arg_type);
                    for(var k = 0; k < ret_func_elements[0].params.length; k++) {
                        var param_type = ret_func_elements[0].params[k];
                        var param_type_str = program_info.Checker.typeToString(param_type);
                        if (program_info.hasClass(param_type_str)) {
                            classes_graph[class_name].edges.push(param_type_str);
                        }
                    }
                }
                
                else if(program_info.isArrayType(arg_type)){
                    var arr_type = program_info.getTypeOfTheArray(arg_type);
                    var arr_type_str = program_info.Checker.typeToString(arr_type);
                    if (program_info.hasClass(arr_type_str)) {
                        classes_graph[class_name].edges.push(arr_type_str);
                    }
                }

                else if(program_info.isUnionType(arg_type)){
                    var union_types = arg_type["types"];
                    for(var k = 0; k < union_types.length; k++) {
                        var union_type = union_types[k];
                        var union_type_str = program_info.Checker.typeToString(union_type);
                        if (program_info.hasClass(union_type_str)) {
                            classes_graph[class_name].edges.push(union_type_str);
                        }
                    }
                }

                else if(program_info.isObjectLiteralType(arg_type)){
                    var object_literal_dictionary = program_info.getObjectLiteralPropertyTypes(arg_type);
                    Object.keys(object_literal_dictionary).forEach(function (property_name) {
                        var object_literal_type = object_literal_dictionary[property_name];
                        var object_literal_type_str = program_info.Checker.typeToString(object_literal_type);
                        if (program_info.hasClass(object_literal_type_str)) {
                            classes_graph[class_name].edges.push(object_literal_type_str);
                        }
                    });
                }
            }
        }
    });
}


////::::::::This function visits the classes graph::::::::
function visitGraph(graph:HashTable<ClassVertex>,curr_path:string[],cycles:string[][],cycles_hash:HashTable<string[][]>) {
    var vertex = graph[curr_path[curr_path.length-1]];

    for(var i = 0;i<vertex.edges.length;i++){
        
        if(graph[vertex.edges[i]]!==undefined && graph[vertex.edges[i]].visited===1) {
            cycles.push(curr_path);
            for(var i = 0;i<curr_path.length;i++) {

                if(cycles_hash[curr_path[i]]===undefined)
                    cycles_hash[curr_path[i]] = [];
                
                cycles_hash[curr_path[i]].push(curr_path);
            }
        }

        else if(graph[vertex.edges[i]]!==undefined && graph[vertex.edges[i]].visited===0) {
            curr_path.push(vertex.edges[i]);
            graph[vertex.edges[i]].visited = 1;
            visitGraph(graph,curr_path,cycles,cycles_hash);
        }
    }
    graph[curr_path[curr_path.length-1]].visited = 2;
}


//::::::::Returns the method and properties that will generate a cycle while generating the tests::::::::
export function findCycles(program_info:ProgramInfo) {
    var classes_graph:HashTable<ClassVertex> = {};
    var cycles:string[][] = [];

    initializeClassesGraph(classes_graph,program_info);

    Object.keys(classes_graph).forEach(function (class_name) {

        if(classes_graph[class_name].visited!==2) {

            var curr_path = [];
            curr_path.push(class_name);
            classes_graph[class_name].visited = 1;
            visitGraph(classes_graph,curr_path,cycles,program_info.cycles_hash);
            classes_graph[class_name].visited = 2;
        }
    });
    
    return cycles;
}