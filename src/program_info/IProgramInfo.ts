export interface IProgramInfo <ts_type>{
    getClassesInfo() : string[];

    getConstructorsInfo() : {[class_name: string] : {arg_types:ts_type[], ret_type:ts_type}[];};
    getClassConstructorsInfo(class_name:string):{arg_types:ts_type[], ret_type:ts_type}[];

    getMethodsInfo(): {[class_name: string] : {[method_name : string] :{arg_types:ts_type[], ret_type:ts_type};};}
    getClassMethodsInfo(class_name:string): {[class_name:string]:{arg_types:ts_type[], ret_type:ts_type};}
    getClassMethodInfo(class_name:string, method_name:string): {arg_types:ts_type[], ret_type:ts_type};

    getFunctionsInfo(): {[class_name: string] : {arg_types:ts_type[], ret_type:ts_type};};
    getFunctionInfo(function_name: string): {arg_types:ts_type[], ret_type:ts_type};

    getInterfacesInfo(): string[];
    getInterfacePropertiesInfo(interface_name: string): {[class_name:string]: ts_type;};
    isInterfaceCallSignature(interface_name:ts_type):boolean;

    getCyclesHashTable(): {[class_name: string] : string[][];};

    getMaxConstructorsRecursiveObjects(): number;
    setMaxConstructorsRecursiveObjects(new_max:number): void;

    getFunctionElements(fun_type:ts_type):{params:ts_type[], ret:ts_type};
    getTypeOfTheArray(arr_type:ts_type): ts_type;

    hasCycle(class_name:string):boolean;
    hasClass(class_name:string):boolean;
    hasInterface(interface_name:string):boolean;

    isFunctionType(arg_type:ts_type):boolean;
    isArrayType(arr_type:ts_type):boolean;
    isUnionType(union_type:ts_type):boolean;
    isObjectLiteralType(object_literal_type:ts_type):boolean;
    isLiteralType(literal_type:ts_type):boolean;
    isGenericType(generic_type:ts_type):boolean;

    getStringFromType(ts_type):string;
    getObjectLiteralPropertyTypes(ts_type):{[property_name: string] : ts_type;};
    getUnionTypes(ts_type):ts_type[];

    updateCreateInfo(name:string, control_nums:number[]) : void;
    getCreateInfo(name:string) : number[];

    getGrowers(class_name:string) : string[];
    addClassGrower(class_name:string, method_name:string) : void;
    showGrowers() : void;
}