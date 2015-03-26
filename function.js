/*
 Copyright (c) 2015, Kotaro Endo.
 All rights reserved.
 
 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions
 are met:
 
 1. Redistributions of source code must retain the above copyright
    notice, this list of conditions and the following disclaimer.
 
 2. Redistributions in binary form must reproduce the above
    copyright notice, this list of conditions and the following
    disclaimer in the documentation and/or other materials provided
    with the distribution.
 
 3. Neither the name of the copyright holder nor the names of its
    contributors may be used to endorse or promote products derived
    from this software without specific prior written permission.
 
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

'use strict';

// ECMAScript 5.1: 13 Function Definition

function FunctionDeclaration(name, parameters, body) {
	return {
		name : name,
		instantiate : function() {
			var env = VariableEnvironment;
			return FunctionObject(parameters, body, env, body.strict);
		}
	};
}

function FunctionExpression(name, parameters, body) {
	if (name === undefined) return function() {
		var env = LexicalEnvironment;
		return FunctionObject(parameters, body, env, body.strict);
	}

	return function() {
		var env = LexicalEnvironment;
		var funcEnv = NewDeclarativeEnvironment(env);
		var envRec = funcEnv.environmentRecord;
		envRec.CreateImmutableBinding(name);
		var closure = FunctionObject(parameters, body, funcEnv, body.strict);
		envRec.InitializeImmutableBinding(name, closure);
		return closure;
	}
}

function FunctionBody(sourceElements, functions, variables, strict) {
	return {
		isFunctionCode : true,
		strict : strict,
		functions : functions,
		variables : variables,
		evaluate : function() {
			if (sourceElements !== undefined) return sourceElements();
			else return CompletionValue("normal", undefined, empty);
		}
	};
}

function FunctionObject(parameters, body, Scope, Strict) {
	var F = VMObject();
	setAllTheInternalMethods(F);
	F.Class = "Function";
	F.Prototype = builtin_Function_prototype;
	F.Get = FunctionObject_Get;
	F.Call = FunctionObject_Call;
	F.Construct = FunctionObject_Construct;
	F.HasInstance = FunctionObject_HasInstance;
	F.Scope = Scope;
	F.FormalParameters = parameters;
	F.Code = body;
	F.Extensible = true;
	var len = parameters.length;
	F.DefineOwnProperty("length", PropertyDescriptor({
		Value : len,
		Writable : false,
		Enumerable : false,
		Configurable : false
	}), false);
	var proto = Object_Construct([]);
	proto.DefineOwnProperty("constructor", PropertyDescriptor({
		Value : F,
		Writable : true,
		Enumerable : false,
		Configurable : true
	}), false);
	F.DefineOwnProperty("prototype", PropertyDescriptor({
		Value : proto,
		Writable : true,
		Enumerable : false,
		Configurable : false
	}), false);
	if (Strict === true) {
		var thrower = theThrowTypeError;
		F.DefineOwnProperty("caller", PropertyDescriptor({
			Get : thrower,
			Set : thrower,
			Enumerable : false,
			Configurable : false
		}), false);
		F.DefineOwnProperty("arguments", PropertyDescriptor({
			Get : thrower,
			Set : thrower,
			Enumerable : false,
			Configurable : false
		}), false);
	}
	return F;
}

function FunctionObject_Call(thisValue, argumentsList) {
	var F = this;
	var funcCtx = enterExecutionContextForFunctionCode(F, thisValue, argumentsList);
	if (F.Code === undefined) {
		var result = CompletionValue("normal", undefined, empty);
	}
	else {
		var result = F.Code.evaluate();
	}
	exitExecutionContext(funcCtx);
	if (result.type === "throw") throw result.value;
	if (result.type === "return") return result.value;
	assert(result.type === "normal");
	return undefined;
}

function FunctionObject_Construct(argumentsList) {
	var F = this;
	var obj = VMObject();
	setAllTheInternalMethods(obj);
	obj.Class = "Object";
	obj.Extensible = true;
	var proto = F.Get("prototype");
	if (Type(proto) === "Object") {
		obj.Prototype = proto;
	}
	if (Type(proto) !== "Object") {
		obj.Prototype = builtin_Object_prototype;
	}
	var result = F.Call(obj, argumentsList);
	if (Type(result) === "Object") return result;
	return obj;
}

function initializeThrowTypeErrorObject() {
	var F = VMObject();
	setAllTheInternalMethods(F);
	F.Class = "Function";
	F.Prototype = builtin_Function_prototype;
	F.Call = FunctionObject_Call;
	F.Scope = theGlobalEnvironment;
	F.FormalParameters = [];
	F.Code = {
		isFunctionCode : true,
		strict : false,
		functions : [],
		variables : [],
		evaluate : function() {
			throw VMTypeError();
		}
	};
	F.Extensible = false;
	F.DefineOwnProperty("length", PropertyDescriptor({
		Value : 0,
		Writable : false,
		Enumerable : false,
		Configurable : false
	}), false);
	theThrowTypeError = F;
}
