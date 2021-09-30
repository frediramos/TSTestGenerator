import * as parser from "../parsing/Parser"
import {IProgramInfo} from "./IProgramInfo"

export class TSType{
    type;
    flag;

    constructor(type, flag?){
        if(type === null){
            this.type = {
                type: 'VoidKeyword'
            }
        } else {
            this.type = type;
        }
        if(flag !== undefined) this.flag = flag;
    }

    getType(){
        return this.type;
    }

    getFlag(){
        return this.flag;
    }
}

//Class to store parameters type, return type and class type if it is a class method and not a function
export class ComposedInfo {

    arg_types:TSType[]=[];
    ret_type:TSType;
    flag:string;

    constructor(flag?){
        if(flag !== undefined) this.flag = flag
    }
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
export class ProgramInfo implements IProgramInfo<TSType> {
    ClassesInfo: string[] = [];
    MethodsInfo: HashTable<HashTable<ComposedInfo>> = {};
    ConstructorsInfo: HashTable<ComposedInfo []> = {};
    PropertiesInfo: HashTable<HashTable<TSType>> = {};
    FunctionsInfo: HashTable<ComposedInfo> = {};
    InterfacesInfo: string[] = [];
    cycles_hash : HashTable<string[][]> = {};
    max_constructors_recursive_objects:number = 0;
    create_functions_info: HashTable<number[]> = {};
    growers_info: HashTable<string[]> = {};


    getClassesInfo() : string[]{
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

    getInterfacesInfo(): string[] {
        return this.InterfacesInfo;
    }
    
    getInterfacePropertiesInfo(interface_name: string): HashTable<TSType> {
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
    getFunctionElements(fun_type:TSType):{params:TSType[], ret:TSType}{
        var params = [];

        fun_type.getType().parameters.forEach(parameter => {
            var parameter_type = new TSType(parameter.TStype);
            params.push(parameter_type);
        });

        return {
            params:params,
            ret: new TSType(fun_type.getType().TStype)
        };
    }

    getUnionTypes(uni_type:TSType):TSType[]{
        var res = [];
        uni_type.getType().subtypes.forEach(subtype => {
            res.push(new TSType(subtype));
        });
        return res;
    }
    
    //This function returns the type of the array
    getTypeOfTheArray(arr_type:TSType): TSType{
        var arr_TSType = arr_type.getType()
        //check if it Array<type>
        if(arr_TSType.type === 'TypeReference'){
            return new TSType(arr_type.getType().typeArguments[0]);
        }
        return new TSType(arr_TSType.subtypes);
    }

    hasCycle(class_name:string):boolean {
        if (this.cycles_hash[class_name])
            return true;
        else
            return false;
    }

    hasClass(class_name:string):boolean {
        if(this.ClassesInfo.indexOf(class_name) > -1)
            return true;
        else
            return false;
    }

    hasInterface(interface_name:string):boolean {
        if(this.InterfacesInfo.indexOf(interface_name) > -1)
            return true;
        else
            return false;
    }

    //::::::::Checks if the given type is a function type::::::::
    isFunctionType(arg_type:TSType):boolean {
        var arg_str = arg_type.getType().type;
        return arg_str && arg_str === 'ArrowFunction' || 
        arg_str === 'Function' || 
        arg_str === 'FunctionType'; 
    }

    //::::::::Checks if the given type is an array type::::::::
    isArrayType(arr_type:TSType):boolean {
        return arr_type.getType().type === 'ArrayType' || 
        (arr_type.getType().type === 'TypeReference' && 
        arr_type.getType().identifier.identifier === 'Array');
    }

    //::::::::Checks if the given type is an union type::::::::
    isUnionType(union_type:TSType):boolean {
        return union_type.getType().type === 'UnionType';
    }
  

    //::::::::Checks if the given type is an object literal type::::::::
    isObjectLiteralType(object_literal_type:TSType):boolean {
        return object_literal_type.getType().type === 'TypeLiteral';
    }
    
    //::::::::Checks if the given type is an object literal type::::::::
    isLiteralType(literal_type:TSType):boolean {
        var arg_str = literal_type.getType().type;
        return arg_str && arg_str.indexOf('Literal') !== -1;
    }

    isGenericType(generic_type:TSType):boolean {
        return generic_type.getType().type === 'TypeParameter';
    }

    isInterfaceCallSignature(interface_type:TSType):boolean {
        return interface_type.getFlag() === 'CallSignature';
    }

    getStringFromType(type):string {
        var res = type;
        if(type instanceof TSType){
            res = type.getType();
        }
        if(res.type === 'TypeReference'){
            return res.identifier.identifier;
        }
        return res.type;
    }  

    getObjectLiteralPropertyTypes(type:TSType):{[property_name: string] : TSType;} {
        var propertiesTypeDictionary:{[property_name: string] : TSType;} = {};

        //Stores the symbols of the object literal properties in a variable
        var object_literal = type.getType();

        //Generates the property type variable 
        object_literal.members.forEach(function (property) {
            
            var property_name = property.identifier.identifier;
            var property_type = new TSType(property.TStype);
            propertiesTypeDictionary[property_name] = property_type;
        });

        return propertiesTypeDictionary;
    }

    updateCreateInfo(name:string, control_nums:number[]) : void {
        this.create_functions_info[name] = control_nums;
    }

    getCreateInfo(name:string) : number[] {
        return this.create_functions_info[name];
    }

    getGrowers(class_name:string) : string[] {
        return this.growers_info[class_name];
    }

    addClassGrower(class_name:string, method_name:string) : void {
        if(this.growers_info[class_name]) {
            this.growers_info[class_name].push(method_name);
        } else {
            this.growers_info[class_name] = [method_name];
        }
    }

    showGrowers() : void {
        console.log(this.growers_info);
    }
}

//::::::::Function to set up for the traversation of the AST::::::::
export function finder(filename:string):ProgramInfo {
    var prog_info = new ProgramInfo();  
    //call custom parser
    var ast = parser.getAST(filename);
    visitAST(ast,prog_info);
    return prog_info;
}

//::::::::Function to traverse the AST::::::::
function visitAST(ast, prog_info:ProgramInfo) {
    ast.statements.forEach(stat => {
        
        if(stat.type === 'ClassDeclaration' || stat.type === 'InterfaceDeclaration'){
            var name = stat.identifier.identifier;
             //Store the type of the class in the position "<ClassName>" of ClassesInfo
            if(stat.type === 'ClassDeclaration')
                prog_info.ClassesInfo.push(name);
    
            //Store the type of the interface in the position "<InterfaceName>" of InterfacesInfo
            else if(stat.type === 'InterfaceDeclaration'){
                prog_info.InterfacesInfo.push(name);

                //Placing an interface constructor in the constructors info that will be generated in testGenerator.ts
                //It will have no arguments because the property types will be generated and assigned to the object fields

                //Must initialize sub-array, otherwise it is undefined
                if (prog_info.ConstructorsInfo[name] === undefined)
                    prog_info.ConstructorsInfo[name] = [];

                //Creating a ComposedInfo object in the position "<InterfaceName><0>" of ConstructorsInfo since it will only have 1 constructor
                prog_info.ConstructorsInfo[name][0] = new ComposedInfo();

                //Store the types of the parameters in arg_types in the position "<InterfaceName><0>" of ConstructorsInfo which will be []
                prog_info.ConstructorsInfo[name][0].arg_types = [];

                //Store the return type of the constructor in ret_type in the position "<InterfaceName><0>" of ConstructorsInfo 
                prog_info.ConstructorsInfo[name][0].ret_type = new TSType(name);;
                    
            }
            
            //handle constructors
            if(stat.Constructors !== null && stat.Constructors !== undefined){
                var constructor_count:number = 0;
                //Must initialize sub-array, otherwise it is undefined
                if(prog_info.ConstructorsInfo[name]===undefined){
                    prog_info.ConstructorsInfo[name] = [];
                }
                stat.Constructors.forEach(cons => {
                    prog_info.ConstructorsInfo[name][constructor_count] = new ComposedInfo();
                
                    if(cons.parameters !== null){
                        //Store the types of the parameters in arg_types in the position "<ClassName><ConstructorNumber>" of ConstructorsInfo 
                        for(const parameter of cons.parameters) {
                            prog_info.ConstructorsInfo[name][constructor_count].arg_types.push(new TSType(parameter.TStype));
                        }                
                    }
                
                    //Store the return type of the constructor in ret_type in the position "<ClassName><ConstructorNumber>" of ConstructorsInfo 
                    prog_info.ConstructorsInfo[name][constructor_count].ret_type= new TSType(name);
                
                    constructor_count++;
                });
            }

            //handle methods
            if(stat.Methods !== null && stat.Methods !== undefined){
                //Must initialize sub-hashtable, otherwise it is undefined
                if(prog_info.MethodsInfo[name]===undefined){
                    prog_info.MethodsInfo[name] = {};
                }
                stat.Methods.forEach(meth => {
                    prog_info.MethodsInfo[name][meth.identifier.identifier] = new ComposedInfo();
    
                    //Store the types of the parameters in arg_types in the position "<Class/InterfaceName><MethodName>" of MethodsInfo
                    if(meth.parameters !== null){
                        for(const parameter of meth.parameters) {
                            prog_info.MethodsInfo[name][meth.identifier.identifier].arg_types.push(new TSType(parameter.TStype));
                        }
                    }
    
                    //Store the return type of the method in ret_type in the position "<Class/InterfaceName><MethodName>" of MethodsInfo 
                    prog_info.MethodsInfo[name][meth.identifier.identifier].ret_type = new TSType(meth.TStype);
                });
            }

            //handle properties
            if((stat.PropertyDeclarations !== null && stat.PropertyDeclarations !== undefined)){
                //Must initialize sub-hashtable, otherwise it is undefined
                if(prog_info.PropertiesInfo[name]===undefined){
                    prog_info.PropertiesInfo[name] = {};
                }
                stat.PropertyDeclarations.forEach(prop => {
                    //Stores the property type in the position"<Class/InterfaceName><PropertyName>" of PropertiesInfo
                    prog_info.PropertiesInfo[name][prop.identifier.identifier] = new TSType(prop.TStype);
                });            
            }

            //handle interface properties
            if(stat.PropertySignatures !== null && stat.PropertySignatures !== undefined){
                stat.PropertySignatures.forEach(prop => {
                    //handle properties
                    if(prop.type === 'PropertySignature'){
                        //Must initialize sub-hashtable, otherwise it is undefined
                        if(prog_info.PropertiesInfo[name]===undefined){
                            prog_info.PropertiesInfo[name] = {};
                        }
                        //Stores the property type in the position"<Class/InterfaceName><PropertyName>" of PropertiesInfo
                        prog_info.PropertiesInfo[name][prop.identifier.identifier] = new TSType(prop.TStype);
                    }

                    //handle methods
                    if(prop.type === 'MethodSignature'){
                        //Must initialize sub-hashtable, otherwise it is undefined
                        if(prog_info.MethodsInfo[name]===undefined){
                            prog_info.MethodsInfo[name] = {};
                        }
                        prog_info.MethodsInfo[name][prop.identifier.identifier] = new ComposedInfo();
    
                        //Store the types of the parameters in arg_types in the position "<Class/InterfaceName><MethodName>" of MethodsInfo
                        if(prop.parameters !== null){
                            for(const parameter of prop.parameters) {
                                prog_info.MethodsInfo[name][prop.identifier.identifier].arg_types.push(new TSType(parameter.TStype));
                            }
                        }
    
                        //Store the return type of the method in ret_type in the position "<Class/InterfaceName><MethodName>" of MethodsInfo 
                        prog_info.MethodsInfo[name][prop.identifier.identifier].ret_type = new TSType(prop.TStype);
                    }

                    //handle functions
                    if(prop.type === 'CallSignature'){
                        prop.type = 'Function';

                        //Must initialize sub-hashtable, otherwise it is undefined
                        if(prog_info.PropertiesInfo[name]===undefined){
                            prog_info.PropertiesInfo[name] = {};
                        }
                        //Stores the property type in the position"<Class/InterfaceName><PropertyName>" of PropertiesInfo
                        prog_info.PropertiesInfo[name]['FunctionType'] = new TSType(prop, 'CallSignature');
        
                        /*
                        //Store the types of the parameters in arg_types in the position "<Class/InterfaceName><MethodName>" of MethodsInfo 
                        if(prop.parameters !== null){
                            prop.parameters.forEach(parameter => {
                                prog_info.FunctionsInfo[name].arg_types.push(new TSType(parameter.TStype));
                            });
                        }

                        //Store the return type of the function in ret_type in the position "<FunctionName>" of FunctionsInfo
                        prog_info.FunctionsInfo[name].ret_type = new TSType(prop.TStype);
                        */
                    }
                    
                });   

            }
        }
        else if(stat.type === 'FunctionDeclaration'){
            prog_info.FunctionsInfo[stat.identifier.identifier]=new ComposedInfo();
        
            //Store the types of the parameters in arg_types in the position "<Class/InterfaceName><MethodName>" of MethodsInfo 
            if(stat.parameters !== null){
                stat.parameters.forEach(parameter => {
                    prog_info.FunctionsInfo[stat.identifier.identifier].arg_types.push(new TSType(parameter.TStype));
                });
            }

            //Store the return type of the function in ret_type in the position "<FunctionName>" of FunctionsInfo
            prog_info.FunctionsInfo[stat.identifier.identifier].ret_type = new TSType(stat.TStype);
        }
    });
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
                var arg_type_str = program_info.getStringFromType(arg_type);

                if (program_info.hasClass(arg_type_str)) {
                    classes_graph[class_name].edges.push(arg_type_str);
                }
                   
                else if(program_info.isFunctionType(arg_type)){
                    var ret_func_elements = program_info.getFunctionElements(arg_type);
                    for(var k = 0; k < ret_func_elements.params.length ; k++) {
                        var param_type = ret_func_elements.params[k];
                        var param_type_str = program_info.getStringFromType(param_type);
                        if (program_info.hasClass(param_type_str)) {
                            classes_graph[class_name].edges.push(param_type_str);
                        }
                    }
                }
                
                else if(program_info.isArrayType(arg_type)){
                    var arr_type = program_info.getTypeOfTheArray(arg_type);
                    var arr_type_str = program_info.getStringFromType(arr_type);
                    if (program_info.hasClass(arr_type_str)) {
                        classes_graph[class_name].edges.push(arr_type_str);
                    }
                }

                else if(program_info.isUnionType(arg_type)){
                    var union_types = arg_type.getType().subtypes;
                    for(var k = 0; k < union_types.length; k++) {
                        var union_type = union_types[k];
                        var union_type_str = program_info.getStringFromType(union_type);
                        if (program_info.hasClass(union_type_str)) {
                            classes_graph[class_name].edges.push(union_type_str);
                        }
                    }
                }

                else if(program_info.isObjectLiteralType(arg_type)){
                    var object_literal_dictionary = program_info.getObjectLiteralPropertyTypes(arg_type);
                    Object.keys(object_literal_dictionary).forEach(function (property_name) {
                        var object_literal_type = object_literal_dictionary[property_name];
                        var object_literal_type_str = program_info.getStringFromType(object_literal_type);
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