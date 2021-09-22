import { type } from "os";
import * as ts from "typescript";

export function processNode(node: any){
    switch(ts.SyntaxKind[node.kind]){
        case "EnumDeclaration":
            return getNodeEnumDeclarationInfo(node);
        case "ClassDeclaration":
            return getNodeClassDeclarationInfo(node);
        case "Identifier":
            return getNodeIdentifier(node);
        case "ForStatement":
            return getNodeForStatement(node);
        case "ForOfStatement":
            return getForInOfStatement(node);
        case "DoStatement":
            return getDoStatement(node);
        case "ReturnStatement":
            return getNodeReturnStatement(node);
        case "InterfaceDeclaration":
            return getNodeInterface(node);
        case "ForInStatement":
            return getForInOfStatement(node);
        case "ExpressionStatement":
            return processNodeStatement(node);
        case "IfStatement":
            return getNodeIfStatement(node);
        case "TryStatement":
            return getTryStatement(node);
        case "ThrowStatement":
            return getThrowStatement(node);
        case "CatchClause":
            return getCatchClause(node);
        case "FirstStatement":
            return getNodeDeclarationList(node);
        case "WithStatement":
            return getWithStatement(node);
        case "Parameter":
            return getParameterInfo(node);
        case "TypeParameter":
            return getTypeParameterInfo(node);
        case "ArrayLiteralExpression":
            return getNodeArrayLiteralExpression(node);
        case "ParenthesizedExpression":
            return getParenthesizedExpression(node);
        case "CallExpression":
            return getNodeCallExpression(node);
        case "TypeAssertionExpression":
            return getTypeAssertionExpression(node);
        case "FunctionExpression":
            return getNodeFunctionExpression(node);
        case "FunctionDeclaration":
            return getNodeFunctionDeclaration(node);
        case "ObjectLiteralExpression":
            return getNodeObjectLiteralExpression(node as ts.ObjectLiteralExpression);
        case "ConditionalExpression":
            return getConditionalExpression(node as ts.ConditionalExpression);
        case "TypeOfExpression":
            return getTypeOfExpression(node);
        case "BinaryExpression":
            return getNodeBinaryExpression(node as ts.BinaryExpression);
        case "Block":
            return getNodeBlockInfo(node as ts.Block);
        case "NewExpression":
            return getNewExpression(node as ts.NewExpression);
        case "ElementAccessExpression":
            return getElementAccessExpression(node as ts.ElementAccessExpression);
        case "PropertyAccessExpression":
            return getPropertyAccessExpression(node as ts.PropertyAccessExpression);
        case "PostfixUnaryExpression":
        case "PrefixUnaryExpression":
            return getPrePostfixUnaryExpression(node as ts.PostfixUnaryExpression);
        case "TypeReference":
            return getTypeReference(node as ts.TypeReferenceNode);
        case "ArrowFunction":
            return getNodeArrowFunction(node as ts.ArrowFunction);
        case "VariableDeclaration":
            return getNodeVariableDeclaration(node as ts.VariableDeclaration);
        case "StringLiteral":
            return getLiteralExpression(node as ts.StringLiteral);
        case "FirstLiteralToken":
            return getLiteralExpression(node as ts.LiteralExpression);
        case "TypeLiteral":
            return getTypeLiteral(node);
        case "ParenthesizedType":
            return getParenthesizedType(node);
        case "TupleType":
            return getTupleType(node);
        case "LiteralType":
            return getLiteralType(node);
        case "ThisKeyword":
        case "EmptyStatement":
        case "StringKeyword":
        case "SuperKeyword":
        case "FalseKeyword":
        case "TrueKeyword":
        case "NumberKeyword":
        case "VoidKeyword":
        case "AnyKeyword":
        case "BooleanKeyword":
        case "ContinueStatement":
        case "BreakStatement":
        case "NullKeyword":
        case "AsyncKeyword":
        case "PrivateKeyword":
        case "PublicKeyword":
        case "UndefinedKeyword":
        case "StaticKeyword":
        case "ProtectedKeyword":
        case "ConstKeyword":
        case "ExportKeyword":
        case "DefaultKeyword":
        case "ThisType":
        case "ReadonlyKeyword":
        case "NeverKeyword":
        case "UnknownKeyword":
        case "ObjectKeyword":
            return getNodeTypeKeyWord(node);
        case "ArrayType":
            return getArrayType(node as ts.ArrayTypeNode);
        case "SpreadElement":
            return getSpreadElement(node as ts.SpreadElement);
        case "FunctionType":
            return getFunctionTypeNode(node as ts.FunctionTypeNode);
        case "VariableDeclarationList":
            return getVariableDeclarationList(node as ts.VariableDeclarationList);
        case "TypeQuery":
            return getTypeQuery(node);
        case "UnionType":
            return getUnionIntersectionType(node);
        case "ObjectBindingPattern":
            return getObjectBindingPattern(node);
        case "BindingElement":
            return getBindingElement(node);
        case "DeleteExpression":
            return getDeleteExpression(node);
        case "VoidExpression":
            return getVoidExpression(node);
        case "ArrayBindingPattern":
            return getArrayBindingPattern(node);
        case "MethodSignature":
            return getMethodSignature(node);
        case "YieldExpression":
            return getYieldExpression(node);
        case "SwitchStatement":
            return getNodeSwitchStatement(node);
        case "WhileStatement":
            return getWhileStatement(node);
        case "AwaitExpression":
            return getAwaitExpression(node);
        case "FirstTypeNode":
            return getFirstTypeNode(node);
        case "PropertySignature":
            return getNodePropertySignature(node);
        case "CallSignature":
            return getCallSignature(node);
        case "PropertyDeclaration":
            return getNodePropertyDeclaration(node);
        case "MethodDeclaration":
            return getNodeMethodDeclaration(node);
        case "Constructor":
            return getNodeConstructorDeclaration(node);
        case "ConstructSignature":
            return getConstructSignature(node);
        case "ModuleDeclaration":
            return getModuleDeclaration(node);
        case "ModuleBlock":
            return getModuleBlock(node);
        case "HeritageClause":
            return getHeritageClause(node);
        case "ExpressionWithTypeArguments":
            return getExpressionWithTypeArguments(node);
        case "IndexSignature":
            return getIndexSignature(node);
        case "Decorator":
            return getDecorator(node);
        case "FirstNode":
            return getFirstNode(node);
        case "ImportEqualsDeclaration":
            return getImportEqualsDeclaration(node);
        case "ImportDeclaration":
            return getImportDeclaration(node);
        case "ImportClause":
            return getImportClause(node);
        case "NamedImports":
        case "NamedExports":
            return getNamedExportsImports(node);
        case "ImportSpecifier":
        case "ExportSpecifier":
            return getImportExportSpecifier(node);
        case "NamespaceImport":
        case "NamespaceExport":
            return getNamespaceExportImport(node);
        case "ExternalModuleReference":
            return getExternalModuleReference(node);
        case "ShorthandPropertyAssignment":
        case "PropertyAssignment":
            return getNodeObjectProperty(node);
        case "AsExpression":
            return getAsExpression(node);
        case "ExportAssignment":
            return getExportAssignment(node);
        case "ExportDeclaration":
            return getExportDeclaration(node);
        case "SourceFile":
            return getSourceFile(node);
        case "TypeAliasDeclaration":
            return getTypeAliasDeclaration(node);
        case "IntersectionType":
            return getUnionIntersectionType(node);
        case "LabeledStatement":
            return getLabeledStatement(node);
        case "TemplateExpression":
            return getTemplateExpression(node);
        case "TemplateSpan":
            return getTemplateSpan(node);
        case "TemplateHead":
        case "TemplateMiddle":
        case "LastTemplateToken":
            return getTemplateHeadMiddleLast(node);
        case "GetAccessor":
        case "SetAccessor":
            return getGetSetAccessor(node);
        case "IndexedAccessType":
            return getIndexedAccessType(node);
        case "ConditionalType":
            return getConditionalType(node);
        case "InferType":
            return getInferType(node);
        case "RestType":
            return getRestType(node);
        case "MappedType":
            return getMappedType(node);
        case "TypeOperator":
            return getTypeOperator(node);
        case "ComputedPropertyName":
            return getComputedPropertyName(node);
        case "NonNullExpression":
            return getNonNullExpression(node);
        case "VariableStatement":
            return getNodeVariableStatement(node);
        default:
            throw Error("Node type not supported: " + ts.SyntaxKind[node.kind] + " - " + node.kind);
    }
}

function getNonNullExpression(node:ts.NonNullExpression){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression)
    }
}

function getComputedPropertyName(node:ts.ComputedPropertyName){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression)
    }
}

function getTypeOperator(node:ts.TypeOperatorNode){
    return {
        "type": ts.SyntaxKind[node.kind],
        "operator": ts.SyntaxKind[node.operator],
        "TStype": processNode(node.type)
    }
}

function getMappedType(node:ts.MappedTypeNode){
    return {
        "type": ts.SyntaxKind[node.kind],
        "typeParameter": processNode(node.typeParameter),
        "TStype": node.type !== undefined?processNode(node.type):null,
        "optional": node.questionToken !== undefined?true:false
    }
}

function getRestType(node){
    return {
        "type": ts.SyntaxKind[node.kind],
        "TStype": processNode(node.type)
    }
}

function getInferType(node:ts.InferTypeNode){
    return {
        "type": ts.SyntaxKind[node.kind],
        "typeParameter": processNode(node.typeParameter)
    }
}

function getConditionalType(node:ts.ConditionalTypeNode){
    return {
        "type": ts.SyntaxKind[node.kind],
        "checkType": processNode(node.checkType),
        "extendsType": processNode(node.extendsType),
        "trueType": processNode(node.trueType),
        "falseType": processNode(node.falseType)
    }
}

function getIndexedAccessType(node:ts.IndexedAccessTypeNode){
    return {
        "type": ts.SyntaxKind[node.kind],
        "objectType": processNode(node.objectType),
        "indexType": processNode(node.indexType)
    }
}

function getGetSetAccessor(node:ts.GetAccessorDeclaration|ts.SetAccessorDeclaration){
    var type = ts.SyntaxKind[node.kind];
    var TStype = node.type !== undefined ? processNode(node.type) : null;
    var identifier = processNode(node.name);
    var block = node.body !== undefined ? processNode(node.body) : null;
    var parameters = [];
    if(node.parameters.length > 0){
        node.parameters.forEach(function(elem){
            parameters.push(processNode(elem));
        });
    } else {
        parameters = null;
    }
    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }
    var typeP = [];
    if(node.typeParameters !== undefined){
        node.typeParameters.forEach(function(t){
            typeP.push(processNode(t));
        });
    } else {
        typeP = null;
    }
    return {
        "type": type,
        "identifier": identifier,
        "TStype": TStype,
        "modifiers": mod,
        "typeParameters": typeP,
        "parameters": parameters,
        "body": block
    }

}

function getTemplateSpan(node:ts.TemplateSpan){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression),
        "literal": processNode(node.literal)
    }

}

function getTemplateHeadMiddleLast(node:ts.TemplateHead){
    return {
        "type": ts.SyntaxKind[node.kind],
        "text": node.text
    }
}

function getTemplateExpression(node:ts.TemplateExpression){
    var head = processNode(node.head);
    var tempSpan = [];
    node.templateSpans.forEach(function(e){
        tempSpan.push(processNode(e));
    });
    return {
        "type": ts.SyntaxKind[node.kind],
        "head": head,
        "templateSpans": tempSpan
    }
}

function getLabeledStatement(node:ts.LabeledStatement){
    var label = processNode(node.label);
    var stat = processNode(node.statement);
    return {
        "type": ts.SyntaxKind[node.kind],
        "label": label,
        "statement": stat
    }
}

function getTypeAliasDeclaration(node:ts.TypeAliasDeclaration){
    var name = processNode(node.name);
    var typeP = [];
    if(node.typeParameters !== undefined){
        node.typeParameters.forEach(function(t){
            typeP.push(processNode(t));
        });
    } else {
        typeP = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "TStype": processNode(node.type),
        "typeParameters": typeP
    }

}

function getSourceFile(node:ts.SourceFile){

    var stats = [];
    node.statements.forEach(function(s){
        stats.push(processNode(s));
    });

    return {
        "type": ts.SyntaxKind[node.kind],
        "statements": stats
    }
}

function getExportDeclaration(node:ts.ExportDeclaration){
    return {
        "type": ts.SyntaxKind[node.kind],
        "exportClause": node.exportClause!==undefined?processNode(node.exportClause):null,
        "moduleSpecifier:": node.moduleSpecifier!==undefined?processNode(node.moduleSpecifier):null
    }
}

function getExportAssignment(node:ts.ExportAssignment){
    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "modifiers": mod,
        "expression": processNode(node.expression)
    }
}

function getAsExpression(node:ts.AsExpression){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression),
        "TStype": processNode(node.type)
    }
}

function getExternalModuleReference(node:ts.ExternalModuleReference){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression)
    }
}

function getNamespaceExportImport(node:ts.NamespaceImport){
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": processNode(node.name)
    }
}

function getImportExportSpecifier(node:ts.ImportSpecifier|ts.ExportSpecifier){
    var pName = node.propertyName!==undefined?processNode(node.propertyName):null;
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": processNode(node.name),
        "propertyName": pName
    }
}

function getNamedExportsImports(node:ts.NamedImports|ts.NamedExports){
    var elems = [];
    node.elements.forEach(function(e){
        elems.push(processNode(e));
    });
    return {
        "type": ts.SyntaxKind[node.kind],
        "elements": elems
    }
}

function getImportClause(node:ts.ImportClause){
    var name = node.name!==undefined?processNode(node.name):null;
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "namedBindings": node.namedBindings!==undefined?processNode(node.namedBindings):null
    }
}

function getImportDeclaration(node:ts.ImportDeclaration){
    return {
        "type": ts.SyntaxKind[node.kind],
        "importClause": node.importClause!==undefined?processNode(node.importClause):null,
        "moduleSpecifier": processNode(node.moduleSpecifier)
    }
}

function getImportEqualsDeclaration(node:ts.ImportEqualsDeclaration){
    var name = processNode(node.name);
    var modRef = processNode(node.moduleReference);
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "moduleReference": modRef
    }
}

function getFirstNode(node:ts.BinaryExpression){
    return {
        "type": "BinaryExpression",
        "left": processNode(node.left),
        "right": processNode(node.right)
    }

}

function getDecorator(node:ts.Decorator){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression)
    }
}

function getIndexSignature(node:ts.IndexSignatureDeclaration){
    var name = node.name!==undefined?processNode(node.name):null;
    var typeP = [];
    if(node.typeParameters !== undefined){
        node.typeParameters.forEach(function(t){
            typeP.push(processNode(t));
        });
    } else {
        typeP = null;
    }
    var params = [];
    node.parameters.forEach(function(p){
        params.push(processNode(p));
    });
    if(params.length === 0) params = null;
    var TStype = node.type !== undefined?processNode(node.type):null;
    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "TStype": TStype,
        "modifiers": mod,
        "typeParameters": typeP,
        "parameters": params
    }
}
function getExpressionWithTypeArguments(node:ts.ExpressionWithTypeArguments){
    var exp = processNode(node.expression);
    var typeA = [];
    if(node.typeArguments!==undefined){
        node.typeArguments.forEach(function(elem){
            typeA.push(processNode(elem));
        });
    } else {
        typeA = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": exp,
        "typeArguments:": typeA
    }
}

function getModuleBlock(node:ts.ModuleBlock){
    var stat = [];
    node.statements.forEach(function(elem){
        stat.push(processNode(elem));
    });
    return {
        "type": ts.SyntaxKind[node.kind],
        "statements": stat
    }
}

function getModuleDeclaration(node:ts.ModuleDeclaration){
    var name = processNode(node.name);
    var body = node.body!==undefined?processNode(node.body):null;
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "body": body
    }
}

function getConstructSignature(node:ts.ConstructSignatureDeclaration){
    var name = node.name!==undefined?processNode(node.name):null;
    var typeP = [];
    if(node.typeParameters !== undefined){
        node.typeParameters.forEach(function(t){
            typeP.push(processNode(t));
        });
    } else {
        typeP = null;
    }
    var params = [];
    node.parameters.forEach(function(p){
        params.push(processNode(p));
    });
    if(params.length === 0) params = null;
    var TStype = node.type !== undefined?processNode(node.type):null;

    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }

    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "TStype": TStype,
        "modifiers": mod,
        "parameters": params,
        "typeParameters": typeP,
        "optional": node.questionToken !== undefined?true:false
    }
}

function getLiteralType(node:ts.LiteralTypeNode){
    return {
        "type": "LiteralType",
        "literal": processNode(node.literal)
    }
}

function getCallSignature(node:ts.CallSignatureDeclaration){
    var name = node.name!==undefined?processNode(node.name):null;
    var typeP = [];
    if(node.typeParameters !== undefined){
        node.typeParameters.forEach(function(t){
            typeP.push(processNode(t));
        });
    } else {
        typeP = null;
    }
    var params = [];
    node.parameters.forEach(function(p){
        params.push(processNode(p));
    });
    if(params.length === 0) params = null;
    var TStype = node.type !== undefined?processNode(node.type):null;

    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }

    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "TStype": TStype,
        "modifiers": mod,
        "parameters": params,
        "typeParameters": typeP,
        "optional": node.questionToken !== undefined?true:false
    }
}

//type is getting hard codded because of ts.kind incoerences
function getFirstTypeNode(node:ts.TypePredicateNode){
    return {
        "type": "TypePredicate",
        "TStype": node.type!==undefined?processNode(node.type):null,
        "parameterName": processNode(node.parameterName)
    }
}

function getAwaitExpression(node:ts.AwaitExpression){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression)
    }
}

function getYieldExpression(node:ts.YieldExpression){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": node.expression !== undefined?processNode(node.expression):null
    }
}

function getMethodSignature(node:ts.MethodSignature){
    var name = processNode(node.name);
    var typeP = [];
    if(node.typeParameters !== undefined){
        node.typeParameters.forEach(function(t){
            typeP.push(processNode(t));
        });
    } else {
        typeP = null;
    }
    var params = [];
    node.parameters.forEach(function(p){
        params.push(processNode(p));
    });
    if(params.length === 0) params = null;
    var TStype = node.type !== undefined?processNode(node.type):null;
    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "TStype": TStype,
        "parameters": params,
        "typeParameters": typeP,
        "modifiers": mod,
        "optional": node.questionToken !== undefined?true:false
    }
}

function getTupleType(node:ts.TupleTypeNode){
    var elems = [];
    node.elementTypes.forEach(function(elem){
        elems.push(processNode(elem));
    });
    return {
        "type": "TupleType",
        "elements": elems
    }
}

function getCatchClause(node:ts.CatchClause){
    var varDec = node.variableDeclaration !== undefined?
    processNode(node.variableDeclaration):null;
    var block = processNode(node.block);
    return {
        "type": ts.SyntaxKind[node.kind],
        "variableDeclaration": varDec,
        "block": block
    }
}

function getThrowStatement(node:ts.ThrowStatement){
    var exp = processNode(node.expression);
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": exp
    }
}

function getTryStatement(node:ts.TryStatement){
    var block = processNode(node.tryBlock);
    var clause = node.catchClause !== undefined? 
    processNode(node.catchClause):null;
    var final = node.finallyBlock !== undefined?
    processNode(node.finallyBlock):null;
    return {
        "type": ts.SyntaxKind[node.kind],
        "tryBlock:": block,
        "catchClause:": clause,
        "finallyBlock:": final
    }
}

function getWithStatement(node:ts.WithStatement){
    var expression = processNode(node.expression);
    var stat = processNode(node.statement);
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": expression,
        "statement": stat
    }
}

function getDoStatement(node:ts.DoStatement){
    var stat = processNode(node.statement);
    var exp = processNode(node.expression);
    return {
        "type": ts.SyntaxKind[node.kind],
        "statement": stat,
        "expression": exp
    }
}

function getForInOfStatement(node:ts.ForInStatement){
    var init = processNode(node.initializer);
    var exp = processNode(node.expression);
    var stat = processNode(node.statement);
    return {
        "type": ts.SyntaxKind[node.kind],
        "initializer": init,
        "expression": exp,
        "statement": stat
    }
}

function getArrayBindingPattern(node:ts.ArrayBindingPattern){
    var elems = [];
    node.elements.forEach(function(elem){
        elems.push(processNode(elem));
    })
    return {
        "type": ts.SyntaxKind[node.kind],
        "elements": elems
    }
}

function getBindingElement(node:ts.BindingElement){
    var name = processNode(node.name);
    var init = node.initializer !== undefined?
    processNode(node.initializer):null;
    var prop = node.propertyName !== undefined?
    processNode(node.propertyName):null;
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "initializer": init,
        "propertyName": prop
    }
}

function getObjectBindingPattern(node:ts.ObjectBindingPattern){
    var elems = [];
    node.elements.forEach(function(elem){
        elems.push(processNode(elem));
    })
    return {
        "type": ts.SyntaxKind[node.kind],
        "elements": elems
    }
}

function getTypeLiteral(node:ts.TypeLiteralNode){
    var members = [];
    node.members.forEach(function(elem){
        members.push(processNode(elem));
    });
    return {
        "type": "TypeLiteral",
        "members": members
    }
}

function getParenthesizedType(node: ts.ParenthesizedTypeNode){
    return {
        "type": "ParenthesizedType",
        "TStype": processNode(node.type)
    }
}

function getUnionIntersectionType(node: ts.UnionTypeNode){
    var types = [];
    node.types.forEach(function(elem){
        types.push(processNode(elem));
    })
    return {
        "type": ts.SyntaxKind[node.kind],
        "subtypes": types
    }
}

function getNodeInterface(node:ts.InterfaceDeclaration){
    //get identifier
    var identifier = processNode(node.name);
    var properties = [];
    var heritageClauses = [];
    node.members.forEach(function (element) {
       properties.push(processNode(element));
    });

    if(node.heritageClauses !== undefined){
        node.heritageClauses.forEach(function(clause){
            heritageClauses.push(getHeritageClause(clause));
        });
    } else {
        heritageClauses = null;
    }

    if(properties.length === 0) properties = null;

    var typeparams = [];
    if(node.typeParameters !== undefined){
        node.typeParameters.forEach(function(pt){
            typeparams.push(processNode(pt));
        });
    } else {
        typeparams = null;
    }

    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }

    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": identifier,
        "heritageClauses": heritageClauses,
        "modifiers": mod,
        "typeParameters": typeparams,
        "CallSignature": null,
        "PropertySignatures": properties,
        "MethodSignature": null
    }
}

function getNodePropertySignature(node:ts.PropertySignature){
    var id = processNode(node.name);
    var type = node.type !== undefined?processNode(node.type):null;
    var init = node.initializer !== undefined?processNode(node.initializer):null;
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": id,
        "TStype": type,
        "initializer": init,
        "optional": node.questionToken !== undefined?true:false
    }
}

//warning with this function!
function getTypeQuery(node) {
    var exprName = processNode(node.exprName);
    return {
        "type": ts.SyntaxKind[node.kind],
        "exprName": exprName
    };
}

function getTypeOfExpression(node:ts.TypeOfExpression){
    var exp = processNode(node.expression);
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": exp
    }
}

function getTypeAssertionExpression(node:ts.TypeAssertion){
    var exp = processNode(node.expression);
    var type = processNode(node.type);
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": exp,
        "TStype": type
    }
}

function getArrayType(node:ts.ArrayTypeNode){
    return {
        "type": "ArrayType",
        "subtypes": processNode(node.elementType)
    }
}

function getTypeReference(node:ts.TypeReferenceNode){
    var typeA = [];
    if(node.typeArguments !== undefined){
        node.typeArguments.forEach(function(elem){
            typeA.push(processNode(elem));
        })
    }else{
        typeA = null;
    }
    return {
        "type": "TypeReference",
        "identifier": processNode(node.typeName),
        "typeArguments": typeA
    }
}

function getConditionalExpression(node:ts.ConditionalExpression){
    var condition = processNode(node.condition);
    var whenTrue = processNode(node.whenTrue);
    var whenFalse = processNode(node.whenFalse);
    return {
        "type": ts.SyntaxKind[node.kind],
        "condition": condition,
        "whenTrue": whenTrue,
        "whenFalse": whenFalse
    }
}

function getNodeFunctionDeclaration(node: ts.FunctionDeclaration){
    var params = [];
    if(node.parameters.length > 0){
        node.parameters.forEach(function(p){
            params.push(processNode(p));
        });
    } else {
        params = null;
    }
    var typeparams = [];
    if(node.typeParameters !== undefined){
        node.typeParameters.forEach(function(pt){
            typeparams.push(processNode(pt));
        });
    } else {
        typeparams = null;
    }
    var body = node.body !== undefined ? processNode(node.body) : null;
    var type = node.type !== undefined ? processNode(node.type) : null;
    var name = node.name !== undefined ? processNode(node.name) : null;
    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "TStype": type,
        "generator": node.asteriskToken !== undefined?true:false,
        "parameters": params,
        "typeParameters": typeparams,
        "modifiers": mod,
        "body": body
    }
}

function getTypeParameterInfo(node:ts.TypeParameterDeclaration){
    var exp = node.expression !== undefined ? processNode(node.expression): null;
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": processNode(node.name),
        "expression": exp,
        "constraint": node.constraint !== undefined?processNode(node.constraint):null
    }
}

function getElementAccessExpression(node:ts.ElementAccessExpression){
    var exp = processNode(node.expression);
    var argExp = processNode(node.argumentExpression);
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": exp,
        "argumentExpression:": argExp
    }
}

function getNodeObjectLiteralExpression(node:ts.ObjectLiteralExpression){
    var props = [];
    node.properties.forEach(function(elem){
        props.push(processNode(elem as ts.PropertyAssignment));
    });
    return {
        "type": ts.SyntaxKind[node.kind],
        "properties": props
    }
}

function getNodeObjectProperty(node:ts.PropertyAssignment){
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": processNode(node.name),
        "initializer": node.initializer!==undefined?processNode(node.initializer):null
    }
}

function getNewExpression(node: ts.NewExpression){
    var args = (node.arguments || []) as ts.Node[];
    var newArgs = args.map(processNode);
    var typeA = [];
    if(node.typeArguments !== undefined){
        node.typeArguments.forEach(function(elem){
            typeA.push(processNode(elem));
        });
    }else{
        typeA = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression),
        "arguments": newArgs,
        "typeArguments": typeA
    }
}

function getNodeArrayLiteralExpression(node: ts.ArrayLiteralExpression){
    var elems = [];
    if(node.elements.length > 0){
        node.elements.forEach(function(e){
            elems.push(processNode(e));
        });
    } else {
        elems = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "elements": elems
    }
}

function getNodeTypeKeyWord(node:any){
    return {
        "type": ts.SyntaxKind[node.kind]
    };
}

//function to build a enum ast
function getNodeEnumDeclarationInfo(node: ts.EnumDeclaration){    
    var members = [];
    if(node.members.length > 0){
        node.members.forEach(function (element) {
            members.push(getEnumMemberInfo(element));
        });
    } else {
        members = null;
    }
    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }

    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": processNode(node.name),
        "modifiers": mod,
        "EnumMembers": members
    }
}

function getEnumMemberInfo(node: ts.EnumMember){
    var init = node.initializer !== undefined ? processNode(node.initializer) : null;
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": processNode(node.name),
        "initializer": init
    }
}

//function to build a class ast
function getNodeClassDeclarationInfo(node: ts.ClassDeclaration){
    var identifier = node.name !== undefined?processNode(node.name):null;
    var properties = [];
    var constructors = [];
    var methods = [];
    var heritageClauses = [];
    var indexSignatures = [];
    var getAccessors = [];
    var setAccessors = [];
    node.members.forEach(function (element) {
        //get properties
        switch(ts.SyntaxKind[element.kind]){
            case "PropertyDeclaration":
                properties.push(processNode(element));
                break;
            case "MethodDeclaration":
                methods.push(processNode(element));
                break;
            case "Constructor":
                constructors.push(processNode(element))
                break;
            case "IndexSignature":
                indexSignatures.push(processNode(element));
                break;
            case "GetAccessor":
                getAccessors.push(processNode(element));
                break;
            case "SetAccessor":
                setAccessors.push(processNode(element));
                break;
            default:
                throw Error("Class member not supported: "  + ts.SyntaxKind[element.kind] + " " + element.kind);
        }
    });

    if(node.heritageClauses !== undefined){
        node.heritageClauses.forEach(function(clause){
            heritageClauses.push(processNode(clause));
        });
    } else {
        heritageClauses = null;
    }

    var typeparams = [];
    if(node.typeParameters !== undefined){
        node.typeParameters.forEach(function(pt){
            typeparams.push(processNode(pt));
        });
    } else {
        typeparams = null;
    }

    var decs = [];
    if(node.decorators !== undefined){
        node.decorators.forEach(function(d){
            decs.push(processNode(d));
        });
    } else {
        decs = null;
    }

    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }

    if(properties.length === 0) properties = null;
    if(methods.length === 0) methods = null;
    if(constructors.length === 0) constructors = null;
    if(getAccessors.length === 0) getAccessors = null;
    if(setAccessors.length === 0) setAccessors = null;
    if(indexSignatures.length === 0) indexSignatures = null;

    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": identifier,
        "heritageClauses": heritageClauses,
        "typeParameters": typeparams,
        "decorators": decs,
        "modifiers": mod,
        "PropertyDeclarations": properties,
        "IndexMemberDeclarations": indexSignatures,
        "GetAccessors": getAccessors,
        "SetAccessors": setAccessors,
        "Constructors": constructors,
        "Methods": methods
    }
}

function getHeritageClause(node: ts.HeritageClause){
    var types = [];
    node.types.forEach(function(type){
        types.push(processNode(type));
    });
    return {
        "type": ts.SyntaxKind[node.kind],
        "types": types
    }
}


//function to build a property declaration ast
function getNodePropertyDeclaration(node: ts.PropertyDeclaration){

    var init = node.initializer === undefined ? null : processNode(node.initializer);

    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }

    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": processNode(node.name),
        "TStype": node.type !== undefined ? processNode(node.type) : null,
        "modifiers": mod,
        "initializer": init,
        "optional": node.questionToken !== undefined?true:false
    };
}

//function to build a expression declaration ast
function processNodeStatement(node: ts.ExpressionStatement){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression)
    }
}

function getVoidExpression(node:ts.VoidExpression){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression)
    }
}

function getDeleteExpression(node: ts.DeleteExpression){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression)
    }
}

function getNodeArrowFunction(node: ts.ArrowFunction){
    var name = node.name !== undefined ? processNode(node.name) : null;
    var params = [];
    node.parameters.forEach(function(elem){
        params.push(getParameterInfo(elem as ts.ParameterDeclaration));
    });

    if(params.length === 0) params = null;

    var body = processNode(node.body);

    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "TStype": node.type !== undefined ? processNode(node.type) : null,
        "parameters": params,
        "body": body
    }
}

function getParenthesizedExpression(node: ts.ParenthesizedExpression){
    return{
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression)
    }
}

function getNodeCallExpression(node: ts.CallExpression){
    var exp = processNode(node.expression);
    var arg = [];
    if(node.arguments !== undefined && node.arguments.length > 0){
        node.arguments.forEach(function(elem){
            arg.push(processNode(elem as ts.Expression));
        });
    } else {
        arg = null;
    }
    var typeA = [];
    if(node.typeArguments !== undefined){
        node.typeArguments.forEach(function(t){
            typeA.push(processNode(t));
        });
    } else {
        typeA = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "typeArguments": typeA,
        "expression": exp,
        "arguments": arg
    };
}

function getNodeIdentifier(node: ts.Identifier){
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": node.escapedText
    }
}

//function to build a binary expression ast
function getNodeBinaryExpression(node: ts.BinaryExpression){
    var bin = {
        "type": ts.SyntaxKind[node.kind],
        "left": processNode(node.left),
        "operatorToken": processOperand(node.operatorToken),
        "right": processNode(node.right)
    };
    return bin;
}

//function to build a block ast
function getNodeBlockInfo(node: ts.Block){
    var statements = [];
    if(node.statements !== undefined && node.statements.length > 0){
        node.statements.forEach(function(elem){
            statements.push(processNode(elem as ts.Node));
        });
    } else {
        statements = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "statements": statements
    }
}

//function to build a contructor ast
function getNodeConstructorDeclaration(node: ts.ConstructorDeclaration){
    var params = [];
    node.parameters.forEach(function(param){
        params.push(getParameterInfo(param));
    });
    if(params.length === 0) params = null;
    var typeP = [];
    if(node.typeParameters !== undefined){
        node.typeParameters.forEach(function(t){
            typeP.push(processNode(t));
        });
    } else {
        typeP = null;
    }
    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }
    var body = node.body !== undefined ? getNodeBlockInfo(node.body): null;
    var result = {
        "type":ts.SyntaxKind[node.kind],
        "parameters": params,
        "typeParameters": typeP,
        "modifiers": mod,
        "body": body
    }
    return result;
}

//function to build a property access expression ast
function getPropertyAccessExpression(node: ts.PropertyAccessExpression){
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": processNode(node.name),
        "expression": processNode(node.expression)
    }
}

//function to process a operand
function processOperand(node: any){
    return ts.SyntaxKind[node.kind];
}

//function to build a method declaration ast
function getNodeMethodDeclaration(node:ts.MethodDeclaration) {
    var type = ts.SyntaxKind[node.kind];
    var TStype = node.type !== undefined ? processNode(node.type) : null;
    var identifier = processNode(node.name);
    var block = node.body !== undefined ? processNode(node.body) : null;
    var parameters = [];
    if(node.parameters.length > 0){
        node.parameters.forEach(function(elem){
            parameters.push(processNode(elem));
        });
    } else {
        parameters = null;
    }
    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }

    return {
        "type": type,
        "identifier": identifier,
        "TStype": TStype,
        "modifiers": mod,
        "parameters": parameters,
        "block": block
    }
}

function getWhileStatement(node: ts.WhileStatement){
    var exp = processNode(node.expression);
    var stat = processNode(node.statement);
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": exp,
        "statement": stat,
    }
}

function getNodeSwitchStatement(node: ts.SwitchStatement){
    var expression = processNode(node.expression);
    var caseBlock = getNodeCaseBlock(node.caseBlock);
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": expression,
        "caseBlock": caseBlock
    }
}

function getNodeCaseBlock(node: ts.CaseBlock){
    var clauses = [];
    node.clauses.forEach(function(elem){
        clauses.push(getClauseInfo(elem as ts.CaseClause));
    });
    if(clauses.length === 0) clauses = null;
    return {
        "type": ts.SyntaxKind[node.kind],
        "clauses": clauses
    }
}

function getClauseInfo(node: ts.CaseClause){
    var exp = node.expression !== undefined ? processNode(node.expression) : null;
    var stats = [];
    node.statements.forEach(function(elem){
        stats.push(processNode(elem as ts.ExpressionStatement));
    });
    if(stats.length === 0) stats = null;
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": exp,
        "statements": stats
    }
}

function getNodeForStatement(node: ts.ForStatement){
    var init = node.initializer !== undefined ?
    processNode(node.initializer as ts.Expression) : null;
    var cond = node.condition !== undefined ?
    processNode(node.condition) : null;
    var inc = node.incrementor !== undefined ? 
    processNode(node.incrementor) : null;
    var stat = processNode(node.statement);
    return {
        "type": ts.SyntaxKind[node.kind],
        "initializer": init,
        "condition": cond,
        "incrementor": inc,
        "statement": stat
    }
}

function getNodeReturnStatement(node: ts.ReturnStatement){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": node.expression !== undefined ? 
        processNode(node.expression) : null
    }
}

function getNodeDeclarationList(node: ts.VariableStatement){
    var declarations = [];
    node.declarationList.declarations.forEach(function(elem){
        declarations.push(processDeclaration(elem as ts.Declaration));
    });
    if(declarations.length === 0) declarations = null;
    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "modifiers": mod,
        "Declarations": declarations
    }
}

function processDeclaration(node: ts.Declaration){
    switch(ts.SyntaxKind[node.kind]){
        case "VariableDeclaration":
            return getNodeVariableDeclaration(node as ts.VariableDeclaration);
        default:
            throw Error("Declaration not supported: " + ts.SyntaxKind[node.kind]);
    }
}

function getNodeVariableStatement(node: ts.VariableStatement){
    var dec = node.declarationList.declarations[0];
    var init = dec.initializer === undefined ? null : processNode(dec.initializer);
    var type = dec.type === undefined ? null : processNode(dec.type);
    var mod = [];
    if(dec.modifiers !== undefined){
        dec.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": processNode(dec.name),
        "TStype": type,
        "modifiers": mod,
        "initializer": init
    }
}

function getNodeVariableDeclaration(node: ts.VariableDeclaration){
    var init = node.initializer === undefined ? null : processNode(node.initializer);
    var type = node.type === undefined ? null : processNode(node.type);
    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": processNode(node.name),
        "TStype": type,
        "modifiers": mod,
        "initializer": init
    };
}

function getFunctionTypeNode(node: ts.FunctionTypeNode){
    var params = [];
    if(node.parameters.length > 0){
        node.parameters.forEach(element => {
            params.push(getParameterInfo(element));
        });
    } else {
        params = null;
    }
    return {
        "type": "FunctionType",
        "TStype": node.type !== undefined ? processNode(node.type) : null,
        "parameters": params
    }
}

function getNodeIfStatement(node: ts.IfStatement){
    var type = ts.SyntaxKind[node.kind];
    var expression = processNode(node.expression);
    var thenStatement = processNode(node.thenStatement);
    var elseStatement = node.elseStatement !== undefined ? 
    processNode(node.elseStatement): null;

    return {
        "type": type,
        "expression": expression,
        "thenStatement": thenStatement,
        "elseStatement": elseStatement
    }
}

function getVariableDeclarationList(node: ts.VariableDeclarationList){
    var dec = [];
    node.declarations.forEach(function(elem){
        dec.push(processNode(elem));
    });
    return {
        "type": ts.SyntaxKind[node.kind],
        "declarations": dec
    }
}

function getSpreadElement(node: ts.SpreadElement){
    return {
        "type": ts.SyntaxKind[node.kind],
        "expression": processNode(node.expression)
    }
}

function getLiteralExpression(node: ts.LiteralExpression){
    return {
        "type": ts.SyntaxKind[node.kind],
        "value": node.text
    }
}

function getNodeFunctionExpression(node: ts.FunctionExpression){
    var name = node.name !== undefined ? processNode(node.name): null;
    var params = [];
    node.parameters.forEach(function(elem){
        params.push(getParameterInfo(elem as ts.ParameterDeclaration));
    });

    if(params.length === 0) params = null;

    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": name,
        "TStype": node.type !== undefined ? processNode(node.type) : null,
        "parameters": params,
        "body": getNodeBlockInfo(node.body)
    }
}

function getParameterInfo(node: ts.ParameterDeclaration){
    var mod = [];
    if(node.modifiers !== undefined){
        node.modifiers.forEach(function(m){
            mod.push(processNode(m));
        });
    } else {
        mod = null;
    }
    return {
        "type": ts.SyntaxKind[node.kind],
        "identifier": processNode(node.name),
        "TStype": node.type !== undefined ? processNode(node.type) : null,
        "initializer": node.initializer !== undefined ? processNode(node.initializer) : null,
        "modifiers": mod,
        "optional": node.questionToken !== undefined ? true : false,
        "rest": node.dotDotDotToken !== undefined ? true : false
    }
}

function getPrePostfixUnaryExpression(node: ts.PostfixUnaryExpression|ts.PrefixUnaryExpression){
    return {
        "type": ts.SyntaxKind[node.kind],
        "operator": ts.SyntaxKind[node.operator],
        "operand": processNode(node.operand)
    }
}