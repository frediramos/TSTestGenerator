import * as parser from "../parsing/Parser";
import * as fs from "fs";
import * as selected_growers from './SelectedGrowers.json';

var _AST_;

class Dependency {
    private static __OH__ = true;
    private static __TH__ = false;

    public static isTH(dep){
        return !dep;
    }

    public static getTH(){
        return this.__TH__;
    }

    public static getOH(){
        return this.__OH__;
    }
}

class Effect {
    private static __BOT__ = 1;
    private static __GROW__ = 2;
    private static __SHRINK__ = 3;
    private static __TOP__ = 4;

    public static getBOT(){
        return this.__BOT__;
    }

    public static getGROW(){
        return this.__GROW__;
    }

    public static getSHRINK(){
        return this.__SHRINK__;
    }

    public static lubWithTwo(e1, e2) : number{
        if(e1 === this.__BOT__) return e2;
        if(e2 === this.__BOT__) return e1;
        if(e1 === e2) return e1;
        return this.__TOP__;
    }

    public static lub(es){
        var res = es.reduce(function(a,b){
            var r = Effect.lubWithTwo(a, b);
            return r;
        }, this.__BOT__);
        return res;
    }
}

class TypEnv {
    private gama;
    constructor(){
        this.gama = {};
    }
    public add(name, type_value, thisDep_value){
        this.gama[name] = {
            type: type_value,
            thisDep: thisDep_value
        }
    }

    public get(name){
        return this.gama[name];
    }

    public copy(){
        var cloneObj = new TypEnv();
        for (var name in this.gama) {
            var g = this.get(name);
            cloneObj.add(name, g.type, g.thisDep);
        }
        return cloneObj;
    }

    public lub(gama){
        for (var name in this.gama){
            var ret_1 = this.get(name);
            var ret_2 = gama.get(name);
            if(ret_2 !== undefined){
                if(Dependency.isTH(ret_2.thisDep)){
                    this.update(name, ret_2.type, ret_2.thisDep);
                }
            }
        }
        for(var name in gama.gama){

            var ret_3 = gama.get(name);
            if(this.get(name) === undefined){
                this.add(name, ret_3.type, ret_3.thisDep);
            }
        }
    }

    public update(name, type_value, thisDep_value){
        if(this.gama[name] === undefined){
            this.add(name, type_value, thisDep_value);
        } else {
            this.gama[name].type = type_value;
            this.gama[name].thisDep = thisDep_value
        }
    }
}

function getEffFromArgs(args){
    var effect = [];
    args.forEach(element => {
        effect.push(element.eff);
    });
    return effect;
}

export function finder(filename:string){
    var ast = parser.getAST(filename);
    return analyse(ast);
}

//receives the parsed ast and prepares the algorithm
function analyse(ast){
    _AST_ = ast;
    //get all the classes from the ast
    var classes = getClassesFromAST(ast);
    //build gama
    var typ_env = new TypEnv();
    //build ctx
    var ctx = createContext(classes);
    console.log(ctx);
    var result = {'growers':{}};
    classes.forEach(c => {
        var grow_methods = analyseClass(c.identifier.identifier, ctx, typ_env, c);
        result['growers'][c.identifier.identifier] = grow_methods;
    });
    return result;
}

//get ast representing the classes from the main program ast
function getClassesFromAST(ast){
    var results = [];
    var searchField = "type";
    var searchVal = "ClassDeclaration";
    for (var i=0 ; i < ast.statements.length ; i++)
    {
        if (ast.statements[i][searchField] == searchVal) {
            results.push(ast.statements[i]);
        }
    }
    return results;
}

/*
create ctx with the following format:
{classes:[
    methods:[
        method_name:{
            type:{
                type:string,
                subtypes:[]
            },
            eff:string,
            parameters:[{
                identifier:string,
                type:{
                    type:string,
                    subtypes:[]
                }
            }]
        }],
    properties:[
        prop_name:{
            type:{
                type:string,
                subtypes:[]
            }
        }
    ]
]}
*/
function createContext(classes){
    var res = {'classes':[]};

    //get pre-selected growers
    for(var c_name in selected_growers.growers){
        res.classes[c_name] = {
            'methods' : [],
            'properties' : []
        }
        for(var m_name in selected_growers.growers[c_name]){
            res.classes[c_name].methods[m_name] = {
                'type' : selected_growers.growers[c_name].type,
                'eff': Effect.getGROW(),
                'parameters': [],
                'analysed' : true
            }
        }
    }

    classes.forEach(c => {
        res.classes[c.identifier.identifier] = {'methods':[], 'properties':[]};
        if(c.Methods !== null){
            c.Methods.forEach(m => {
                var name = m.identifier.identifier;
                var type = m.TStype;
                res.classes[c.identifier.identifier].methods[name] = {
                    'type' : type,
                    'eff' : undefined,
                    'parameters': getParams(m.parameters),
                    'analysed' : false
                }
            });
        }
        if(c.PropertyDeclarations !== null){
            c.PropertyDeclarations.forEach(prop => {
                var name = prop.identifier.identifier;
                var type = prop.TStype;
                res.classes[c.identifier.identifier].properties[name] = {
                    'type' : type
                }
            });
        }
    });
    return res;
}

//get params from methods to create ctx
function getParams(params){
    if(params === null){
        return [];
    } else {
        var res = [];
        params.forEach(p => {
            res.push({
                'identifier' : p.identifier.identifier,
                'type': p.TStype
            })
        });
        return res;
    }
}

//analyse each class of the program
//returns the grower methods
function analyseClass(class_name, ctx, typ_env, c){
    var grow_methods = [];
    //prevent classes without methods
    if(c.Methods !== null){
        c.Methods.forEach(m => {
            var res = analyseMethod(class_name, ctx, typ_env, m);
            
            //push to result if grower
            if(res === Effect.getGROW()){
                grow_methods.push(m.identifier.identifier);
            }
        });
    }

    console.log(ctx);
    console.log(typ_env);
    return grow_methods;
}

//analyse the methods of the class
//returns if the methods make the class grow
function analyseMethod(class_name, ctx, typ_env, m){
    if(m.block.statements === null) return Effect.getBOT();
    if(ctx.classes[class_name].methods[m.identifier.identifier].analysed) {
        return ctx.classes[class_name].methods[m.identifier.identifier].eff;
    }
    var effs = [];
    m.block.statements.forEach(s => {
        effs.push(analyseStatement(class_name, m.identifier.identifier, ctx, typ_env, s));
    });
    //update ctx
    var res = Effect.lub(effs);
    ctx.classes[class_name].methods[m.identifier.identifier].eff = res;
    ctx.classes[class_name].methods[m.identifier.identifier].analysed = true;
    return res;
}

function preAnalyseMethod(class_name, meth_name, ctx, typ_env){
    var searchField = "type";
    var searchVal = "ClassDeclaration";
    for (var i=0 ; i < _AST_.statements.length ; i++)
    {
        if (_AST_.statements[i][searchField] === searchVal &&
            _AST_.statements[i]['identifier']['identifier'] === class_name) {
            for(var j=0 ; j < _AST_.statements[i]['Methods'].length ; j++){
                if(_AST_.statements[i]['Methods'][j]['identifier']['identifier'] === meth_name){
                    return analyseMethod(class_name, ctx, typ_env, _AST_.statements[i]['Methods'][j])
                }
            }
        }
    }
    return undefined;
}

//analyse each statement of a method
//returns the effect of the statement
function analyseStatement(class_name, meth_name, ctx, typ_env, s){
    switch(s.type){
        case 'IfStatement':
            var ret_exp = analyseExpression(class_name, meth_name, ctx, typ_env, s.expression);
            if(s.elseStatement !== null){
                var copy_typ_env = typ_env.copy();
                var eff_then = analyseStatement(class_name, meth_name, ctx, typ_env, s.thenStatement);            
                var eff_else = analyseStatement(class_name, meth_name, ctx, copy_typ_env, s.elseStatement);
                typ_env.lub(copy_typ_env);
                return  Effect.lubWithTwo(eff_then, eff_else);
            } else {
                return analyseStatement(class_name, meth_name, ctx, typ_env, s.thenStatement);
            }

        case 'Block':
            if(s.statements === null) return Effect.getBOT();
            var effs = s.statements.map((s) => {
                var r = analyseStatement(class_name, meth_name, ctx, typ_env, s);
                return r;
            });

            return Effect.lub(effs);

        case 'ExpressionStatement':
            var exp = analyseExpression(class_name, meth_name, ctx, 
                    typ_env, s.expression);
            return exp.eff;
        case 'ReturnStatement':
            if(s.expression !== null) {
                return analyseExpression(class_name, meth_name, ctx, typ_env, s.expression).eff;
            } else {
                //return statemnts without any expression
                return Effect.getBOT();
            }
        case 'FirstStatement':
            var effs = s.Declarations.map((d) => {
                return analyseExpression(class_name, meth_name, ctx, typ_env, d).eff;
            });
            return Effect.lub(effs);
        case 'ForStatement':
            return analyseStatement(class_name, meth_name, ctx, typ_env, s.statement);
        case 'SwitchStatement':
            var effs;
            s.caseBlock.clauses.forEach(c => {
                effs = c.statements.map((d) => {
                    return analyseStatement(class_name, meth_name, ctx, typ_env, d);
                });
            });
            return Effect.lub(effs);
        case 'BreakStatement':
        case 'ContinueStatement':
            return Effect.getBOT();
        case 'WhileStatement':
            return analyseStatement(class_name, meth_name, ctx, typ_env, s.statement);
        case 'VariableStatement':
            return analyseExpression(class_name, meth_name, ctx, typ_env, s).eff;
        default:
            throw Error("Statement type not supported: " + s.type);
    }
}

//analyse each expression of a statement
function analyseExpression(class_name, meth_name, ctx, typ_env, e){
    switch(e.type){
        case 'FalseKeyword':
        case 'TrueKeyword':
        case 'NullKeyword':
        case 'FirstLiteralToken':
        case 'StringLiteral':
        case 'ArrayLiteralExpression':
            return {
                typ_env: typ_env,
                eff: Effect.getBOT(),
                dep: Dependency.getOH(),
                type: e.type
            }
        case 'ElementAccessExpression':
            //bassically return the expression but go down one level on type
            var exp = analyseExpression(class_name, meth_name, ctx, 
                typ_env, e.expression);
            //get type
            var type;
            if(exp.type !== undefined){
                if(exp.type.subtypes !== undefined){
                    type = exp.type.subtypes;
                } else {
                    type = exp.type
                }
            }
            return {
                typ_env: typ_env,
                eff: exp.eff,
                dep: exp.dep,
                type: type
            }
        case 'Identifier':
            var dep : boolean = findDep(typ_env, e.identifier);
            var type = searchClass(e.identifier, typ_env, ctx, class_name, meth_name);
            //console.log('ID: ' + e.identifier + ' Type: ' + type);
            return {
                typ_env: typ_env,
                eff: Effect.getBOT(),
                dep: dep,
                type: type
            }
        case 'ThisKeyword':
            return {
                typ_env: typ_env,
                eff: Effect.getBOT(),
                dep: Dependency.getTH(),
                type: {
                    type: class_name,
                    subtypes: undefined
                }
            }
        //x = e; x;
        case 'VariableDeclaration':
        case 'VariableStatement':
            if(e.initializer !== null){
                var ret = analyseExpression(class_name, meth_name, ctx, typ_env, e.initializer);
                //update gama
                typ_env.update(e.identifier.identifier, ret.type, ret.dep);
                return {
                    typ_env: typ_env,
                    eff: ret.eff,
                    dep: ret.dep,
                    type: ret.type
                }
            } else {
                //update gama
                typ_env.add(e.identifier.identifier, undefined, Dependency.getOH());
                return {
                    typ_env: typ_env,
                    eff: Effect.getBOT(),
                    dep: Dependency.getOH(),
                    type: undefined
                }
            }
        
        case 'BinaryExpression':
            //e = e
            if(e.operatorToken === 'FirstAssignment'){
                var ret1 = analyseExpression(class_name, meth_name, ctx, typ_env, e.left);
                var ret2 = analyseExpression(class_name, meth_name, ctx, ret1.typ_env, e.right);
                var eff : number;
                if(Dependency.isTH(ret1.dep)){
                    eff = Effect.getGROW();
                } else {
                    eff = Effect.getBOT();
                }
                return {
                    typ_env: typ_env,
                    eff: Effect.lub([ret1.eff, ret2.eff, eff]),
                    dep: ret2.dep,
                    type: ret2.type
                }
            }
            // e_1 + e_2
            else {
                var ret1 = analyseExpression(class_name, meth_name, ctx, typ_env, e.left);
                var ret2 = analyseExpression(class_name, meth_name, ctx, ret1.typ_env, e.right);
                return {
                    typ_env: typ_env,
                    eff: Effect.lub([ret1.eff, ret2.eff]),
                    dep: ret2.dep,
                    type: ret2.type
                }
            }
        // e_1[e_2]
        case 'PropertyAccessExpression':
            var ret1 = analyseExpression(class_name, meth_name, ctx, typ_env, e.expression);
            var ret2 = analyseExpression(class_name, meth_name, ctx, ret1.typ_env, e.identifier);
            var type = undefined;
            if(ret1.type !== undefined){
                type = getFieldType(ret1.type,e.identifier.identifier,ctx);
            }
             
            return {
                typ_env: typ_env,
                eff: Effect.lub([ret1.eff, ret2.eff]),
                dep: ret1.dep,
                type: type
            }
        case 'CallExpression':
            //catch foreach calls
            if(e.expression.identifier.identifier === 'forEach'){
                var ret = analyseExpression(class_name, meth_name, ctx, typ_env, e.arguments[0]);
                return ret;
            } else {
            //prepare eff for the lub
            var args = sumForLUB(class_name, meth_name, ctx, typ_env, e.arguments)
            //f(e...)
            if(e.expression.type === 'Identifier'){
                var effect = [];
                args.forEach(element => {
                    effect.push(element.eff);
                });
                var type = typ_env.get(e.expression.identifier);
                return {
                    typ_env: typ_env,
                    eff: Effect.lub(effect),
                    dep: Dependency.getOH(),
                    type: type
                }
            }
            //e.f(e...)
            else {
                var effect = [];
                args.forEach(element => {
                    effect.push(element.eff);
                });
                var exp = analyseExpression(class_name, meth_name, ctx, typ_env, e.expression.expression);
                var type = exp.type;
                //prevent declarations without initializer
                if(exp.type !== undefined){
                    var eff_typ = getEffType(type,e.expression.identifier.identifier, class_name, ctx, typ_env);
                    if(eff_typ.eff !== undefined && Dependency.isTH(exp.dep)){
                        effect.push(eff_typ.eff);
                    }
                }
                return {
                    typ_env: typ_env,
                    eff: Effect.lub(effect),
                    dep: Dependency.getOH(),
                    type: type
                }
            }
            }
            
        //new e(e...)
        case 'NewExpression':
            var args = [];
            if(e.arguments.length > 0){
                args.push(analyseExpression(class_name, meth_name, ctx, 
                    typ_env, e.arguments[0]));
                for (var _i = 1; _i < e.arguments.length; _i++) {
                    args.push(analyseExpression(class_name, meth_name, ctx, 
                        args[_i - 1].typ_env, e.arguments[_i]));
                }
            }
            var effects = getEffFromArgs(args);
            var exp = analyseExpression(class_name, meth_name, ctx, 
                typ_env, e.expression);
            effects.push(exp.eff);

            return {
                typ_env: typ_env,
                eff: Effect.lub(effects),
                dep: Dependency.getOH(),
                type: exp.type
            }
        case 'ParenthesizedExpression':
            return analyseExpression(class_name, meth_name, ctx, 
                typ_env, e.expression);
        case 'FunctionExpression':
            var params = [];
            if(e.parameters.length > 0){
                params.push(analyseExpression(class_name, meth_name, ctx, 
                    typ_env, e.parameters[0]));
                for (var _i = 1; _i < e.parameters.length; _i++) {
                    params.push(analyseExpression(class_name, meth_name, ctx, 
                        e.parameters[_i - 1].typ_env, e.parameters[_i]));
                }
            }
            var effects = getEffFromArgs(params);
            effects.push(analyseStatement(class_name, meth_name, ctx, 
                typ_env, e.body));
            return {
                typ_env: typ_env,
                eff: Effect.lub(effects),
                dep: Dependency.getOH(),
                type: e.TStype === null?undefined:e.TStype
            }
        case 'Parameter':
            var eff = Effect.getBOT();
            var dep = Dependency.getOH();
            if(e.initializer !== null){
                var init = analyseExpression(class_name, meth_name, ctx, 
                    typ_env, e.initializer);
                eff = init.eff;
                dep = init.dep;
            }
            return {
                typ_env: typ_env,
                eff: eff,
                dep: dep,
                type: e.TStype === null?undefined:e.TStype
            }
        case 'PrefixUnaryExpression':
        case 'PostfixUnaryExpression':
            var op = analyseExpression(class_name, meth_name, ctx, 
                typ_env, e.operand);
                return {
                    typ_env: typ_env,
                    eff: op.eff,
                    dep: Dependency.getOH(),
                    type: op.type
                }
        case 'ArrowFunction':
            var body_eff = analyseStatement(class_name, meth_name, ctx, 
                typ_env, e.body);
            return {
                typ_env: typ_env,
                eff: body_eff,
                dep: Dependency.getOH(),
                type: undefined
            }
        default:
            throw Error("Expression type not supported: " + e.type);
    }
}

//get the type of a given of a given type when accessed by exp
function getFieldType(type,exp,ctx) : string{
    var typ = type;

    //go into type node
    if(type.type !== undefined){
        typ = type.type;
    }
    //catch typereference node
    if(typ === 'TypeReference') typ = type.identifier.identifier;

    if(ctx.classes[typ] === undefined) {
        console.log('Warning: Type ' + typ + ' is not processed');
        return undefined;
    }

    if(ctx.classes[typ].methods[exp] === undefined &&
        ctx.classes[typ].properties[exp] === undefined) {
        console.log('Warning: Expression ' + exp + ' is not processed');
        return undefined;
    }

    return ctx.classes[typ].properties[exp] !== undefined?
    ctx.classes[typ].properties[exp].type:
    ctx.classes[typ].methods[exp].type;
}

function getEffType(type,meth_name, class_name, ctx, typ_env){
    var ret_eff;
    var ret_type;
    var typ_name;
    if(type.type === 'TypeReference'){
        typ_name = type.identifier.identifier;
    } else if (type.type !== undefined){
        typ_name = type.type;
    }
    //check if the type exists in ctx
    if(ctx.classes[typ_name] !== undefined && 
        ctx.classes[typ_name].methods[meth_name] !== undefined){
        var ret_ctx = ctx.classes[typ_name].methods[meth_name];
        ret_type = ret_ctx.type;
        if(!ctx.classes[typ_name].methods[meth_name].analysed){
            ret_eff = preAnalyseMethod(class_name,meth_name, ctx, typ_env);
        } else {
            ret_eff = ret_ctx.eff;
        }
    }
    return {
        type: ret_type,
        eff: ret_eff
    }
}

function sumForLUB(class_name, meth_name, ctx, typ_env, elements){
    var result = [];
    if(elements !== null){
        result.push(analyseExpression(class_name, meth_name, ctx, 
            typ_env, elements[0]));
        for (var _i = 1; _i < elements.length; _i++) {
            result.push(analyseExpression(class_name, meth_name, ctx, 
                result[_i - 1].typ_env, elements[_i]));
        }
    }
    return result;
}

//search for the type of a given var x
function searchClass(x, typ_env, ctx, class_name, method_name){
    //is it in gama
    var res = findType(typ_env, x);
    if(res !== undefined)return res;
    //is it a class property

        for (var prop in ctx.classes[class_name].properties) {
            if(prop === x){
                return ctx.classes[class_name].properties[prop].type;
            }
        }

    //is it in the params of the method
        ctx.classes[class_name].methods[method_name].parameters.forEach(param => {
            if(param.identifier === x){
                res = param.type;
            }
        }); 

        return res;
}

function findDep(gama, id){
    var res = gama.get(id);
    if(res === undefined){
        return Dependency.getOH();
    } else {
        return res.thisDep;
    }
}

function findType(gama, id){
    var res = gama.get(id);
    if(res === undefined){
        return undefined;
    } else {
        return res.type;
    }
}