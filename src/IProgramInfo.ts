export interface IProgramInfo <ts_type>{
    getClassesInfo() : {[class_name: string] :ts_type};

    getConstructorsInfo() : {[class_name: string] : {arg_types:ts_type[], ret_type:ts_type}[];};
    getClassConstructorsInfo(class_name:string):{arg_types:ts_type[], ret_type:ts_type}[];

    getMethodsInfo(): {[class_name: string] : {[method_name : string] :{arg_types:ts_type[], ret_type:ts_type};};}
    getClassMethodsInfo(class_name:string): {[class_name:string]:{arg_types:ts_type[], ret_type:ts_type};}
    getClassMethodInfo(class_name:string, method_name:string): {arg_types:ts_type[], ret_type:ts_type};

    getFunctionsInfo(): {[class_name: string] : {arg_types:ts_type[], ret_type:ts_type};};
    getFunctionInfo(function_name: string): {arg_types:ts_type[], ret_type:ts_type};

    getInterfacesInfo(): {[interface_name: string] : ts_type};
    getInterfacePropertiesInfo(interface_name: string): {[class_name:string]: ts_type;};

    getCyclesHashTable(): {[class_name: string] : string[][];};

    getMaxConstructorsRecursiveObjects(): number;
    setMaxConstructorsRecursiveObjects(new_max:number): void;

    getFunctionElements(fun_type:ts_type):{params:ts_type[], ret:ts_type}[];
    getTypeOfTheArray(arr_type:ts_type): ts_type;

    hasCycle(class_name:string):boolean;
    hasClass(class_name:string):boolean;
    hasInterface(interface_name:string):boolean;

    isFunctionType(arg_type:ts_type):boolean;
    isArrayType(arr_type:ts_type):boolean;
    isUnionType(union_type:ts_type):boolean;
    isObjectLiteralType(object_literal_type:ts_type):boolean;
    isLiteralType(literal_type:ts_type):boolean;

    getStringFromType(ts_type):string;
    getObjectLiteralPropertyTypes(ts_type):{[property_name: string] : ts_type;};

    updateCreateInfo(name:string, control_nums:number[]) : void;
    getCreateInfo(name:string) : number[];
}