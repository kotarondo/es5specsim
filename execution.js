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

// ECMAScript 5.1: 10 Executable Code and Execution Contexts

function DeclarativeEnvironmentRecord() {
	return {
		values : Object.create(null),
		attributes : Object.create(null),
		// 0: Mutable Deletable
		// 1: Mutable Undeletable
		// 2: Immutable Initialized
		// 3: Immutable Uninitialized

		HasBinding : function(N) {
			var envRec = this;
			if (envRec.attributes[N] !== undefined) return true;
			return false;
		},

		CreateMutableBinding : function(N, D) {
			var envRec = this;
			assert(envRec.attributes[N] === undefined);
			if (D === true) {
				envRec.attributes[N] = 0;
			}
			else {
				envRec.attributes[N] = 1;
			}
		},

		SetMutableBinding : function(N, V, S) {
			var envRec = this;
			if (envRec.attributes[N] === undefined) return;
			if (envRec.attributes[N] <= 1) {
				envRec.values[N] = V;
			}
			else throw VMTypeError();
		},

		GetBindingValue : function(N, S) {
			var envRec = this;
			assert(envRec.attributes[N] !== undefined);
			if (envRec.attributes[N] === 3) {
				if (S === false) return undefined;
				throw VMReferenceError();
			}
			return envRec.values[N];
		},

		DeleteBinding : function(N) {
			var envRec = this;
			if (envRec.attributes[N] === undefined) return true;
			if (envRec.attributes[N] !== 0) return false;
			delete (envRec.values[N]);
			delete (envRec.attributes[N]);
			return true;
		},

		ImplicitThisValue : function() {
			return undefined;
		},

		CreateImmutableBinding : function(N) {
			var envRec = this;
			assert(envRec.attributes[N] === undefined);
			envRec.attributes[N] = 3;
		},

		InitializeImmutableBinding : function(N, V) {
			var envRec = this;
			assert(envRec.attributes[N] === 3);
			envRec.values[N] = V;
			envRec.attributes[N] = 2;
		},
	};
}

function ObjectEnvironmentRecord(bindings) {
	return {
		bindings : bindings,
		provideThis : false,

		HasBinding : function(N) {
			var envRec = this;
			var bindings = envRec.bindings;
			return bindings.HasProperty(N);
		},

		CreateMutableBinding : function(N, D) {
			var envRec = this;
			var bindings = envRec.bindings;
			assert(bindings.HasProperty(N) === false);
			if (D === true) {
				var configValue = true;
			}
			else {
				var configValue = false;
			}
			bindings.DefineOwnProperty(N, PropertyDescriptor({
				Value : undefined,
				Writable : true,
				Enumerable : true,
				Configurable : configValue
			}), true);
		},

		SetMutableBinding : function(N, V, S) {
			var envRec = this;
			var bindings = envRec.bindings;
			bindings.Put(N, V, S);
		},

		GetBindingValue : function(N, S) {
			var envRec = this;
			var bindings = envRec.bindings;
			var value = bindings.HasProperty(N);
			if (value === false) {
				if (S === false) return undefined;
				throw VMReferenceError();
			}
			return bindings.Get(N);
		},

		DeleteBinding : function(N) {
			var envRec = this;
			var bindings = envRec.bindings;
			return bindings.Delete(N, false);
		},

		ImplicitThisValue : function() {
			var envRec = this;
			if (envRec.provideThis === true) return envRec.bindings;
			return undefined;
		},
	};
}

function GetIdentifierReference(lex, name, strict) {
	if (lex === null) return ReferenceValue(undefined, name, strict);
	var envRec = lex.environmentRecord;
	var exists = envRec.HasBinding(name);
	if (exists === true) return ReferenceValue(envRec, name, strict);
	else {
		var outer = lex.outer;
		return GetIdentifierReference(outer, name, strict);
	}
}

function NewDeclarativeEnvironment(E) {
	return {
		environmentRecord : DeclarativeEnvironmentRecord(),
		outer : E,
	};
}

function NewObjectEnvironment(O, E) {
	return {
		environmentRecord : ObjectEnvironmentRecord(O),
		outer : E,
	};
}

var LexicalEnvironment;
var VariableEnvironment;
var ThisBinding;

function saveExecutionContext() {
	return {
		LexicalEnvironment : LexicalEnvironment,
		VariableEnvironment : VariableEnvironment,
		ThisBinding : ThisBinding,
	};
}

function exitExecutionContext(savedCtx) {
	LexicalEnvironment = savedCtx.LexicalEnvironment;
	VariableEnvironment = savedCtx.VariableEnvironment;
	ThisBinding = savedCtx.ThisBinding;
}

function enterExecutionContextForGlobalCode(code) {
	var savedCtx = saveExecutionContext();
	LexicalEnvironment = theGlobalEnvironment;
	VariableEnvironment = theGlobalEnvironment;
	ThisBinding = theGlobalObject;
	DeclarationBindingInstantiation(code);
	return savedCtx;
}

function enterExecutionContextForEvalCode(code, direct) {
	var savedCtx = saveExecutionContext();
	if (direct !== true) {
		LexicalEnvironment = theGlobalEnvironment;
		VariableEnvironment = theGlobalEnvironment;
		ThisBinding = theGlobalObject;
	}
	if (code.strict) {
		var strictVarEnv = NewDeclarativeEnvironment(LexicalEnvironment);
		LexicalEnvironment = strictVarEnv;
		VariableEnvironment = strictVarEnv;
	}
	DeclarationBindingInstantiation(code);
	return savedCtx;
}

function enterExecutionContextForFunctionCode(F, thisValue, argumentsList) {
	var savedCtx = saveExecutionContext();
	var code = F.Code;
	if (code.strict) {
		ThisBinding = thisValue;
	}
	else if (thisValue === null || thisValue === undefined) {
		ThisBinding = theGlobalObject;
	}
	else if (Type(thisValue) !== "Object") {
		ThisBinding = ToObject(thisValue);
	}
	else {
		ThisBinding = thisValue;
	}
	var localEnv = NewDeclarativeEnvironment(F.Scope);
	LexicalEnvironment = localEnv;
	VariableEnvironment = localEnv;
	DeclarationBindingInstantiation(code, argumentsList, F);
	return savedCtx;
}

function DeclarationBindingInstantiation(code, args, func) {
	var env = VariableEnvironment.environmentRecord;
	if (code.isEvalCode) {
		var configurableBindings = true;
	}
	else {
		var configurableBindings = false;
	}
	if (code.strict) {
		var strict = true;
	}
	else {
		var strict = false;
	}
	if (code.isFunctionCode) {
		var names = func.FormalParameters;
		var n = 0;
		for (var i = 0; i < names.length; i++) {
			var argName = names[i];
			var v = args[n++];
			var argAlreadyDeclared = env.HasBinding(argName);
			if (argAlreadyDeclared === false) {
				env.CreateMutableBinding(argName);
			}
			env.SetMutableBinding(argName, v, strict);
		}
	}
	var functions = code.functions;
	for (var i = 0; i < functions.length; i++) {
		var f = functions[i];
		var fn = f.name;
		var fo = f.instantiate();
		var funcAlreadyDeclared = env.HasBinding(fn);
		if (funcAlreadyDeclared === false) {
			env.CreateMutableBinding(fn, configurableBindings);
		}
		else if (env === theGlobalEnvironment.envRec) {
			var go = theGlobalObject;
			var existingProp = go.GetProperty(fn);
			if (existingProp.Configurable === true) {
				go.DefineOwnProperty(fn, PropertyDescriptor({
					Value : undefined,
					Writable : true,
					Enumerable : true,
					Configurable : configurableBindings
				}), true);
			}
			else if (IsAccessorDescriptor(existingProp) || !(existingProp.Writable === true && existingProp.Enumerable === true)) throw VMTypeError();
		}
		env.SetMutableBinding(fn, fo, strict);
	}
	var argumentsAlreadyDeclared = env.HasBinding("arguments");
	if (code.isFunctionCode && argumentsAlreadyDeclared === false) {
		var argsObj = CreateArgumentsObject(func, names, args, VariableEnvironment, strict);
		if (strict === true) {
			env.CreateImmutableBinding("arguments");
			env.InitializeImmutableBinding("arguments", argsObj);
		}
		else {
			env.CreateMutableBinding("arguments");
			env.SetMutableBinding("arguments", argsObj, false);
		}
	}
	var variables = code.variables;
	for (var i = 0; i < variables.length; i++) {
		var dn = variables[i];
		var varAlreadyDeclared = env.HasBinding(dn);
		if (varAlreadyDeclared === false) {
			env.CreateMutableBinding(dn);
			env.SetMutableBinding(dn, undefined, strict);
		}
	}
}

function CreateArgumentsObject(func, names, args, env, strict) {
	var len = args.length;
	var obj = VMObject();
	setAllTheInternalMethods(obj);
	obj.Class = "Arguments";
	obj.Prototype = builtin_Object_prototype;
	obj.Extensible = true;
	obj.DefineOwnProperty("length", PropertyDescriptor({
		Value : len,
		Writable : true,
		Enumerable : false,
		Configurable : true
	}), false);
	var map = Object_Construct([]);
	var mappedNames = [];
	var indx = len - 1;
	while (indx >= 0) {
		var val = args[indx];
		obj.DefineOwnProperty(ToString(indx), PropertyDescriptor({
			Value : val,
			Writable : true,
			Enumerable : true,
			Configurable : true
		}), false);
		if (indx < names.length) {
			var name = names[indx];
			if (strict === false && isIncluded(name, mappedNames) === false) {
				mappedNames.push(name);
				var g = MakeArgGetter(name, env);
				var p = MakeArgSetter(name, env);
				map.DefineOwnProperty(ToString(indx), PropertyDescriptor({
					Set : p,
					Get : g,
					Configurable : true
				}), false);
			}
		}
		var indx = indx - 1;
	}
	if (mappedNames.length !== 0) {
		obj.ParameterMap = map;
		obj.Get = Arguments_Get;
		obj.GetOwnProperty = Arguments_GetOwnProperty;
		obj.DefineOwnProperty = Arguments_DefineOwnProperty;
		obj.Delete = Arguments_Delete;
	}
	if (strict === false) {
		obj.DefineOwnProperty("callee", PropertyDescriptor({
			Value : func,
			Writable : true,
			Enumerable : false,
			Configurable : true
		}), false);
	}
	else {
		var thrower = theThrowTypeError;
		obj.DefineOwnProperty("caller", PropertyDescriptor({
			Get : thrower,
			Set : thrower,
			Enumerable : false,
			Configurable : false
		}), false);
		obj.DefineOwnProperty("callee", PropertyDescriptor({
			Get : thrower,
			Set : thrower,
			Enumerable : false,
			Configurable : false
		}), false);
	}
	return obj;
}

function MakeArgGetter(name, env) {
	var body = "return " + name + ";";
	var parameters = [];
	var body = theParser.readFunctionCode(body, parameters);
	return FunctionObject(parameters, body, env, true);
}

function MakeArgSetter(name, env) {
	var param = name + "_arg";
	var body = name + " = " + param + ";"
	var parameters = [ param ];
	var body = theParser.readFunctionCode(body, parameters);
	return FunctionObject(parameters, body, env, true);
}

function Arguments_Get(P) {
	var map = this.ParameterMap;
	var isMapped = map.GetOwnProperty(P);
	if (isMapped === undefined) {
		var v = default_Get.call(this, P);
		if (P === "caller" && Type(v) === "Object" && v.Class === "Function" && v.Code !== undefined && v.Code.strict) throw VMTypeError();
		return v;
	}
	else return map.Get(P);
}

function Arguments_GetOwnProperty(P) {
	var desc = default_GetOwnProperty.call(this, P);
	if (desc === undefined) return desc;
	var map = this.ParameterMap;
	var isMapped = map.GetOwnProperty(P);
	if (isMapped !== undefined) {
		desc.Value = map.Get(P);
	}
	return desc;
}

function Arguments_DefineOwnProperty(P, Desc, Throw) {
	var map = this.ParameterMap;
	var isMapped = map.GetOwnProperty(P);
	var allowed = default_DefineOwnProperty.call(this, P, Desc, false);
	if (allowed === false) {
		if (Throw === true) throw VMTypeError();
		else return false;
	}
	if (isMapped !== undefined) {
		if (IsAccessorDescriptor(Desc) === true) {
			map.Delete(P, false);
		}
		else {
			if (Desc.Value !== absent) {
				map.Put(P, Desc.Value, Throw);
			}
			if (Desc.Writable === false) {
				map.Delete(P, false);
			}
		}
	}
	return true;
}

function Arguments_Delete(P, Throw) {
	var map = this.ParameterMap;
	var isMapped = map.GetOwnProperty(P);
	var result = default_Delete.call(this, P, Throw);
	if (result === true && isMapped !== undefined) {
		map.Delete(P, false);
	}
	return result;
}
