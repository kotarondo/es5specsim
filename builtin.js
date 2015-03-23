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

// ECMAScript 5.1: 15 Standard Built-in ECMAScript Objects

function define(obj, name, value) {
	intrinsic_createData(obj, name, PropertyDescriptor({
		Value : value,
		Writable : true,
		Enumerable : false,
		Configurable : true
	}));
}

function defineFinal(obj, name, value) {
	intrinsic_createData(obj, name, PropertyDescriptor({
		Value : value,
		Writable : false,
		Enumerable : false,
		Configurable : false
	}));
}

function defineFree(obj, name, value) {
	intrinsic_createData(obj, name, PropertyDescriptor({
		Value : value,
		Writable : true,
		Enumerable : true,
		Configurable : true
	}));
}

function defineWritable(obj, name, value) {
	intrinsic_createData(obj, name, PropertyDescriptor({
		Value : value,
		Writable : true,
		Enumerable : false,
		Configurable : false
	}));
}

function defineFunction(obj, name, length, func) {
	var F = VMObject();
	setAllTheInternalMethods(F);
	F.Class = "Function";
	F.Prototype = builtin_Function_prototype;
	F.Extensible = true;
	F.Call = func;
	defineFinal(F, "length", length);
	define(obj, name, F);
	return F;
}

var builtin_Object_prototype;
var builtin_Function_prototype;
var builtin_Array_prototype;
var builtin_String_prototype;
var builtin_Boolean_prototype;
var builtin_Number_prototype;
var builtin_Date_prototype;
var builtin_RegExp_prototype;
var builtin_Error_prototype;
var builtin_EvalError_prototype;
var builtin_RangeError_prototype;
var builtin_ReferenceError_prototype;
var builtin_SyntaxError_prototype;
var builtin_TypeError_prototype;
var builtin_URIError_prototype;

var builtin_Object;
var builtin_Function;
var builtin_Array;
var builtin_String;
var builtin_Boolean;
var builtin_Number;
var builtin_Math;
var builtin_Date;
var builtin_RegExp;
var builtin_Error;
var builtin_EvalError;
var builtin_RangeError;
var builtin_ReferenceError;
var builtin_SyntaxError;
var builtin_TypeError;
var builtin_URIError;
var builtin_JSON;

var theGlobalObject;
var theGlobalEnvironment;
var theEvalFunction;
var theThrowTypeError;

function initializeVM() {

	builtin_Object_prototype = VMObject();
	setAllTheInternalMethods(builtin_Object_prototype);
	builtin_Object_prototype.Class = "Object";
	builtin_Object_prototype.Prototype = null;
	builtin_Object_prototype.Extensible = true;

	builtin_Function_prototype = VMObject();
	setAllTheInternalMethods(builtin_Function_prototype);
	builtin_Function_prototype.Class = "Function";
	builtin_Function_prototype.Prototype = builtin_Object_prototype;
	builtin_Function_prototype.Extensible = true;
	builtin_Function_prototype.Call = function() {
		return undefined;
	};

	builtin_Array_prototype = VMObject();
	setAllTheInternalMethods(builtin_Array_prototype);
	builtin_Array_prototype.Class = "Array";
	builtin_Array_prototype.Prototype = builtin_Object_prototype;
	builtin_Array_prototype.Extensible = true;
	builtin_Array_prototype.DefineOwnProperty = ArrayObject_DefineOwnProperty;

	builtin_String_prototype = VMObject();
	setAllTheInternalMethods(builtin_String_prototype);
	builtin_String_prototype.Class = "String";
	builtin_String_prototype.Prototype = builtin_Object_prototype;
	builtin_String_prototype.Extensible = true;
	builtin_String_prototype.PrimitiveValue = "";

	builtin_Boolean_prototype = VMObject();
	setAllTheInternalMethods(builtin_Boolean_prototype);
	builtin_Boolean_prototype.Class = "Boolean";
	builtin_Boolean_prototype.Prototype = builtin_Object_prototype;
	builtin_Boolean_prototype.Extensible = true;
	builtin_Boolean_prototype.PrimitiveValue = false;

	builtin_Number_prototype = VMObject();
	setAllTheInternalMethods(builtin_Number_prototype);
	builtin_Number_prototype.Class = "Number";
	builtin_Number_prototype.Prototype = builtin_Object_prototype;
	builtin_Number_prototype.Extensible = true;
	builtin_Number_prototype.PrimitiveValue = 0;

	builtin_Date_prototype = VMObject();
	setAllTheInternalMethods(builtin_Date_prototype);
	builtin_Date_prototype.Class = "Date";
	builtin_Date_prototype.Prototype = builtin_Object_prototype;
	builtin_Date_prototype.Extensible = true;
	builtin_Date_prototype.PrimitiveValue = NaN;

	builtin_RegExp_prototype = VMObject();
	setAllTheInternalMethods(builtin_RegExp_prototype);
	builtin_RegExp_prototype.Class = "RegExp";
	builtin_RegExp_prototype.Prototype = builtin_Object_prototype;
	builtin_RegExp_prototype.Extensible = true;

	builtin_Error_prototype = VMObject();
	setAllTheInternalMethods(builtin_Error_prototype);
	builtin_Error_prototype.Class = "Error";
	builtin_Error_prototype.Prototype = builtin_Object_prototype;
	builtin_Error_prototype.Extensible = true;

	builtin_EvalError_prototype = VMObject();
	setAllTheInternalMethods(builtin_EvalError_prototype);
	builtin_EvalError_prototype.Class = "Error";
	builtin_EvalError_prototype.Prototype = builtin_Error_prototype;
	builtin_EvalError_prototype.Extensible = true;

	builtin_RangeError_prototype = VMObject();
	setAllTheInternalMethods(builtin_RangeError_prototype);
	builtin_RangeError_prototype.Class = "Error";
	builtin_RangeError_prototype.Prototype = builtin_Error_prototype;
	builtin_RangeError_prototype.Extensible = true;

	builtin_ReferenceError_prototype = VMObject();
	setAllTheInternalMethods(builtin_ReferenceError_prototype);
	builtin_ReferenceError_prototype.Class = "Error";
	builtin_ReferenceError_prototype.Prototype = builtin_Error_prototype;
	builtin_ReferenceError_prototype.Extensible = true;

	builtin_SyntaxError_prototype = VMObject();
	setAllTheInternalMethods(builtin_SyntaxError_prototype);
	builtin_SyntaxError_prototype.Class = "Error";
	builtin_SyntaxError_prototype.Prototype = builtin_Error_prototype;
	builtin_SyntaxError_prototype.Extensible = true;

	builtin_TypeError_prototype = VMObject();
	setAllTheInternalMethods(builtin_TypeError_prototype);
	builtin_TypeError_prototype.Class = "Error";
	builtin_TypeError_prototype.Prototype = builtin_Error_prototype;
	builtin_TypeError_prototype.Extensible = true;

	builtin_URIError_prototype = VMObject();
	setAllTheInternalMethods(builtin_URIError_prototype);
	builtin_URIError_prototype.Class = "Error";
	builtin_URIError_prototype.Prototype = builtin_Error_prototype;
	builtin_URIError_prototype.Extensible = true;

	theGlobalObject = VMObject();
	setAllTheInternalMethods(theGlobalObject);
	theGlobalObject.Class = "Global";
	theGlobalObject.Prototype = builtin_Object_prototype;
	theGlobalObject.Extensible = true;

	builtin_Object = VMObject();
	setAllTheInternalMethods(builtin_Object);
	builtin_Object.Call = Object_Call;
	builtin_Object.Construct = Object_Construct;
	builtin_Object.HasInstance = FunctionObject_HasInstance;
	builtin_Object.Class = "Function";
	builtin_Object.Prototype = builtin_Function_prototype;
	builtin_Object.Extensible = true;

	builtin_Function = VMObject();
	setAllTheInternalMethods(builtin_Function);
	builtin_Function.Call = Function_Call;
	builtin_Function.Construct = Function_Construct;
	builtin_Function.HasInstance = FunctionObject_HasInstance;
	builtin_Function.Class = "Function";
	builtin_Function.Prototype = builtin_Function_prototype;
	builtin_Function.Extensible = true;

	builtin_Array = VMObject();
	setAllTheInternalMethods(builtin_Array);
	builtin_Array.Call = Array_Call;
	builtin_Array.Construct = Array_Construct;
	builtin_Array.HasInstance = FunctionObject_HasInstance;
	builtin_Array.Class = "Function";
	builtin_Array.Prototype = builtin_Function_prototype;
	builtin_Array.Extensible = true;

	builtin_String = VMObject();
	setAllTheInternalMethods(builtin_String);
	builtin_String.Call = String_Call;
	builtin_String.Construct = String_Construct;
	builtin_String.HasInstance = FunctionObject_HasInstance;
	builtin_String.Class = "Function";
	builtin_String.Prototype = builtin_Function_prototype;
	builtin_String.Extensible = true;

	builtin_Boolean = VMObject();
	setAllTheInternalMethods(builtin_Boolean);
	builtin_Boolean.Call = Boolean_Call;
	builtin_Boolean.Construct = Boolean_Construct;
	builtin_Boolean.HasInstance = FunctionObject_HasInstance;
	builtin_Boolean.Class = "Function";
	builtin_Boolean.Prototype = builtin_Function_prototype;
	builtin_Boolean.Extensible = true;

	builtin_Number = VMObject();
	setAllTheInternalMethods(builtin_Number);
	builtin_Number.Call = Number_Call;
	builtin_Number.Construct = Number_Construct;
	builtin_Number.HasInstance = FunctionObject_HasInstance;
	builtin_Number.Class = "Function";
	builtin_Number.Prototype = builtin_Function_prototype;
	builtin_Number.Extensible = true;

	builtin_Math = VMObject();
	setAllTheInternalMethods(builtin_Math);
	builtin_Math.Class = "Math";
	builtin_Math.Prototype = builtin_Object_prototype;
	builtin_Math.Extensible = true;

	builtin_Date = VMObject();
	setAllTheInternalMethods(builtin_Date);
	builtin_Date.Call = Date_Call;
	builtin_Date.Construct = Date_Construct;
	builtin_Date.HasInstance = FunctionObject_HasInstance;
	builtin_Date.Class = "Function";
	builtin_Date.Prototype = builtin_Function_prototype;
	builtin_Date.Extensible = true;

	builtin_RegExp = VMObject();
	setAllTheInternalMethods(builtin_RegExp);
	builtin_RegExp.Call = RegExp_Call;
	builtin_RegExp.Construct = RegExp_Construct;
	builtin_RegExp.HasInstance = FunctionObject_HasInstance;
	builtin_RegExp.Class = "Function";
	builtin_RegExp.Prototype = builtin_Function_prototype;
	builtin_RegExp.Extensible = true;

	builtin_Error = VMObject();
	setAllTheInternalMethods(builtin_Error);
	builtin_Error.Call = Error_Call;
	builtin_Error.Construct = Error_Construct;
	builtin_Error.HasInstance = FunctionObject_HasInstance;
	builtin_Error.Class = "Function";
	builtin_Error.Prototype = builtin_Function_prototype;
	builtin_Error.Extensible = true;

	builtin_EvalError = VMObject();
	setAllTheInternalMethods(builtin_EvalError);
	builtin_EvalError.Call = EvalError_Call;
	builtin_EvalError.Construct = EvalError_Construct;
	builtin_EvalError.HasInstance = FunctionObject_HasInstance;
	builtin_EvalError.Class = "Function";
	builtin_EvalError.Prototype = builtin_Function_prototype;
	builtin_EvalError.Extensible = true;

	builtin_RangeError = VMObject();
	setAllTheInternalMethods(builtin_RangeError);
	builtin_RangeError.Call = RangeError_Call;
	builtin_RangeError.Construct = RangeError_Construct;
	builtin_RangeError.HasInstance = FunctionObject_HasInstance;
	builtin_RangeError.Class = "Function";
	builtin_RangeError.Prototype = builtin_Function_prototype;
	builtin_RangeError.Extensible = true;

	builtin_ReferenceError = VMObject();
	setAllTheInternalMethods(builtin_ReferenceError);
	builtin_ReferenceError.Call = ReferenceError_Call;
	builtin_ReferenceError.Construct = ReferenceError_Construct;
	builtin_ReferenceError.HasInstance = FunctionObject_HasInstance;
	builtin_ReferenceError.Class = "Function";
	builtin_ReferenceError.Prototype = builtin_Function_prototype;
	builtin_ReferenceError.Extensible = true;

	builtin_SyntaxError = VMObject();
	setAllTheInternalMethods(builtin_SyntaxError);
	builtin_SyntaxError.Call = SyntaxError_Call;
	builtin_SyntaxError.Construct = SyntaxError_Construct;
	builtin_SyntaxError.HasInstance = FunctionObject_HasInstance;
	builtin_SyntaxError.Class = "Function";
	builtin_SyntaxError.Prototype = builtin_Function_prototype;
	builtin_SyntaxError.Extensible = true;

	builtin_TypeError = VMObject();
	setAllTheInternalMethods(builtin_TypeError);
	builtin_TypeError.Call = TypeError_Call;
	builtin_TypeError.Construct = TypeError_Construct;
	builtin_TypeError.HasInstance = FunctionObject_HasInstance;
	builtin_TypeError.Class = "Function";
	builtin_TypeError.Prototype = builtin_Function_prototype;
	builtin_TypeError.Extensible = true;

	builtin_URIError = VMObject();
	setAllTheInternalMethods(builtin_URIError);
	builtin_URIError.Call = URIError_Call;
	builtin_URIError.Construct = URIError_Construct;
	builtin_URIError.HasInstance = FunctionObject_HasInstance;
	builtin_URIError.Class = "Function";
	builtin_URIError.Prototype = builtin_Function_prototype;
	builtin_URIError.Extensible = true;

	builtin_JSON = VMObject();
	setAllTheInternalMethods(builtin_JSON);
	builtin_JSON.Class = "JSON";
	builtin_JSON.Prototype = builtin_Object_prototype;
	builtin_JSON.Extensible = true;

	theGlobalEnvironment = NewObjectEnvironment(theGlobalObject, null);
	defineFinal(theGlobalObject, "NaN", NaN);
	defineFinal(theGlobalObject, "Infinity", Infinity);
	defineFinal(theGlobalObject, "undefined", undefined);
	theEvalFunction = //
	defineFunction(theGlobalObject, "eval", 1, Global_eval);
	defineFunction(theGlobalObject, "parseInt", 2, Global_parseInt);
	defineFunction(theGlobalObject, "parseFloat", 1, Global_parseFloat);
	defineFunction(theGlobalObject, "isNaN", 1, Global_isNaN);
	defineFunction(theGlobalObject, "isFinite", 1, Global_isFinite);
	defineFunction(theGlobalObject, "decodeURI", 1, Global_decodeURI);
	defineFunction(theGlobalObject, "decodeURIComponent", 1, Global_decodeURIComponent);
	defineFunction(theGlobalObject, "encodeURI", 1, Global_encodeURI);
	defineFunction(theGlobalObject, "encodeURIComponent", 1, Global_encodeURIComponent);
	if (STRICT_CONFORMANCE === false) {
		defineFunction(theGlobalObject, "escape", 1, Global_escape);
		defineFunction(theGlobalObject, "unescape", 1, Global_unescape);
	}
	define(theGlobalObject, "Object", builtin_Object);
	define(theGlobalObject, "Function", builtin_Function);
	define(theGlobalObject, "Array", builtin_Array);
	define(theGlobalObject, "String", builtin_String);
	define(theGlobalObject, "Boolean", builtin_Boolean);
	define(theGlobalObject, "Number", builtin_Number);
	define(theGlobalObject, "Date", builtin_Date);
	define(theGlobalObject, "RegExp", builtin_RegExp);
	define(theGlobalObject, "Error", builtin_Error);
	define(theGlobalObject, "EvalError", builtin_EvalError);
	define(theGlobalObject, "RangeError", builtin_RangeError);
	define(theGlobalObject, "ReferenceError", builtin_ReferenceError);
	define(theGlobalObject, "SyntaxError", builtin_SyntaxError);
	define(theGlobalObject, "TypeError", builtin_TypeError);
	define(theGlobalObject, "URIError", builtin_URIError);
	define(theGlobalObject, "Math", builtin_Math);
	define(theGlobalObject, "JSON", builtin_JSON);

	defineFinal(builtin_Object, "length", 1);
	defineFinal(builtin_Object, "prototype", builtin_Object_prototype);
	defineFunction(builtin_Object, "getPrototypeOf", 1, Object_getPrototypeOf);
	defineFunction(builtin_Object, "getOwnPropertyDescriptor", 2, Object_getOwnPropertyDescriptor);
	defineFunction(builtin_Object, "getOwnPropertyNames", 1, Object_getOwnPropertyNames);
	defineFunction(builtin_Object, "create", 2, Object_create);
	defineFunction(builtin_Object, "defineProperty", 3, Object_defineProperty);
	defineFunction(builtin_Object, "defineProperties", 2, Object_defineProperties);
	defineFunction(builtin_Object, "seal", 1, Object_seal);
	defineFunction(builtin_Object, "freeze", 1, Object_freeze);
	defineFunction(builtin_Object, "preventExtensions", 1, Object_preventExtensions);
	defineFunction(builtin_Object, "isSealed", 1, Object_isSealed);
	defineFunction(builtin_Object, "isFrozen", 1, Object_isFrozen);
	defineFunction(builtin_Object, "isExtensible", 1, Object_isExtensible);
	defineFunction(builtin_Object, "keys", 1, Object_keys);
	define(builtin_Object_prototype, "constructor", builtin_Object);
	defineFunction(builtin_Object_prototype, "toString", 0, Object_prototype_toString);
	defineFunction(builtin_Object_prototype, "toLocaleString", 0, Object_prototype_toLocaleString);
	defineFunction(builtin_Object_prototype, "valueOf", 0, Object_prototype_valueOf);
	defineFunction(builtin_Object_prototype, "hasOwnProperty", 1, Object_prototype_hasOwnProperty);
	defineFunction(builtin_Object_prototype, "isPrototypeOf", 1, Object_prototype_isPrototypeOf);
	defineFunction(builtin_Object_prototype, "propertyIsEnumerable", 1, Object_prototype_propertyIsEnumerable);

	defineFinal(builtin_Function, "length", 1);
	defineFinal(builtin_Function, "prototype", builtin_Function_prototype);
	defineFinal(builtin_Function_prototype, "length", 0);
	define(builtin_Function_prototype, "constructor", builtin_Function);
	defineFunction(builtin_Function_prototype, "toString", 0, Function_prototype_toString);
	defineFunction(builtin_Function_prototype, "apply", 2, Function_prototype_apply);
	defineFunction(builtin_Function_prototype, "call", 1, Function_prototype_call);
	defineFunction(builtin_Function_prototype, "bind", 1, Function_prototype_bind);

	defineFinal(builtin_Array, "length", 1);
	defineFinal(builtin_Array, "prototype", builtin_Array_prototype);
	defineFunction(builtin_Array, "isArray", 1, Array_isArray);
	defineWritable(builtin_Array_prototype, "length", 0);
	define(builtin_Array_prototype, "constructor", builtin_Array);
	defineFunction(builtin_Array_prototype, "toString", 0, Array_prototype_toString);
	defineFunction(builtin_Array_prototype, "toLocaleString", 0, Array_prototype_toLocaleString);
	defineFunction(builtin_Array_prototype, "concat", 1, Array_prototype_concat);
	defineFunction(builtin_Array_prototype, "join", 1, Array_prototype_join);
	defineFunction(builtin_Array_prototype, "pop", 0, Array_prototype_pop);
	defineFunction(builtin_Array_prototype, "push", 1, Array_prototype_push);
	defineFunction(builtin_Array_prototype, "reverse", 0, Array_prototype_reverse);
	defineFunction(builtin_Array_prototype, "shift", 0, Array_prototype_shift);
	defineFunction(builtin_Array_prototype, "slice", 2, Array_prototype_slice);
	defineFunction(builtin_Array_prototype, "sort", 1, Array_prototype_sort);
	defineFunction(builtin_Array_prototype, "splice", 2, Array_prototype_splice);
	defineFunction(builtin_Array_prototype, "unshift", 1, Array_prototype_unshift);
	defineFunction(builtin_Array_prototype, "indexOf", 1, Array_prototype_indexOf);
	defineFunction(builtin_Array_prototype, "lastIndexOf", 1, Array_prototype_lastIndexOf);
	defineFunction(builtin_Array_prototype, "every", 1, Array_prototype_every);
	defineFunction(builtin_Array_prototype, "some", 1, Array_prototype_some);
	defineFunction(builtin_Array_prototype, "forEach", 1, Array_prototype_forEach);
	defineFunction(builtin_Array_prototype, "map", 1, Array_prototype_map);
	defineFunction(builtin_Array_prototype, "filter", 1, Array_prototype_filter);
	defineFunction(builtin_Array_prototype, "reduce", 1, Array_prototype_reduce);
	defineFunction(builtin_Array_prototype, "reduceRight", 1, Array_prototype_reduceRight);

	defineFinal(builtin_String, "length", 1);
	defineFinal(builtin_String, "prototype", builtin_String_prototype);
	defineFunction(builtin_String, "fromCharCode", 1, String_fromCharCode);
	defineFinal(builtin_String_prototype, "length", 0);
	define(builtin_String_prototype, "constructor", builtin_String);
	defineFunction(builtin_String_prototype, "toString", 0, String_prototype_toString);
	defineFunction(builtin_String_prototype, "valueOf", 0, String_prototype_valueOf);
	defineFunction(builtin_String_prototype, "charAt", 1, String_prototype_charAt);
	defineFunction(builtin_String_prototype, "charCodeAt", 1, String_prototype_charCodeAt);
	defineFunction(builtin_String_prototype, "concat", 1, String_prototype_concat);
	defineFunction(builtin_String_prototype, "indexOf", 1, String_prototype_indexOf);
	defineFunction(builtin_String_prototype, "lastIndexOf", 1, String_prototype_lastIndexOf);
	defineFunction(builtin_String_prototype, "localeCompare", 1, String_prototype_localeCompare);
	defineFunction(builtin_String_prototype, "match", 1, String_prototype_match);
	defineFunction(builtin_String_prototype, "replace", 2, String_prototype_replace);
	defineFunction(builtin_String_prototype, "search", 1, String_prototype_search);
	defineFunction(builtin_String_prototype, "slice", 2, String_prototype_slice);
	defineFunction(builtin_String_prototype, "split", 2, String_prototype_split);
	defineFunction(builtin_String_prototype, "substring", 2, String_prototype_substring);
	defineFunction(builtin_String_prototype, "toLowerCase", 0, String_prototype_toLowerCase);
	defineFunction(builtin_String_prototype, "toLocaleLowerCase", 0, String_prototype_toLocaleLowerCase);
	defineFunction(builtin_String_prototype, "toUpperCase", 0, String_prototype_toUpperCase);
	defineFunction(builtin_String_prototype, "toLocaleUpperCase", 0, String_prototype_toLocaleUpperCase);
	defineFunction(builtin_String_prototype, "trim", 0, String_prototype_trim);
	if (STRICT_CONFORMANCE === false) {
		defineFunction(builtin_String_prototype, "substr", 2, String_prototype_substr);
	}

	defineFinal(builtin_Boolean, "length", 1);
	defineFinal(builtin_Boolean, "prototype", builtin_Boolean_prototype);
	define(builtin_Boolean_prototype, "constructor", builtin_Boolean);
	defineFunction(builtin_Boolean_prototype, "toString", 0, Boolean_prototype_toString);
	defineFunction(builtin_Boolean_prototype, "valueOf", 0, Boolean_prototype_valueOf);

	defineFinal(builtin_Number, "length", 1);
	defineFinal(builtin_Number, "prototype", builtin_Number_prototype);
	defineFinal(builtin_Number, "MAX_VALUE", Number.MAX_VALUE);
	defineFinal(builtin_Number, "MIN_VALUE", Number.MIN_VALUE);
	defineFinal(builtin_Number, "NaN", NaN);
	defineFinal(builtin_Number, "POSITIVE_INFINITY", Infinity);
	defineFinal(builtin_Number, "NEGATIVE_INFINITY", -Infinity);
	define(builtin_Number_prototype, "constructor", builtin_Number);
	defineFunction(builtin_Number_prototype, "toString", 0, Number_prototype_toString);
	defineFunction(builtin_Number_prototype, "toLocaleString", 0, Number_prototype_toLocaleString);
	defineFunction(builtin_Number_prototype, "valueOf", 0, Number_prototype_valueOf);
	defineFunction(builtin_Number_prototype, "toFixed", 1, Number_prototype_toFixed);
	defineFunction(builtin_Number_prototype, "toExponential", 1, Number_prototype_toExponential);
	defineFunction(builtin_Number_prototype, "toPrecision", 1, Number_prototype_toPrecision);

	defineFinal(builtin_Math, "E", Math.E);
	defineFinal(builtin_Math, "LN10", Math.LN10);
	defineFinal(builtin_Math, "LN2", Math.LN2);
	defineFinal(builtin_Math, "LOG2E", Math.LOG2E);
	defineFinal(builtin_Math, "LOG10E", Math.LOG10E);
	defineFinal(builtin_Math, "PI", Math.PI);
	defineFinal(builtin_Math, "SQRT1_2", Math.SQRT1_2);
	defineFinal(builtin_Math, "SQRT2", Math.SQRT2);
	defineFunction(builtin_Math, "abs", 1, Math_abs);
	defineFunction(builtin_Math, "acos", 1, Math_acos);
	defineFunction(builtin_Math, "asin", 1, Math_asin);
	defineFunction(builtin_Math, "atan", 1, Math_atan);
	defineFunction(builtin_Math, "atan2", 2, Math_atan2);
	defineFunction(builtin_Math, "ceil", 1, Math_ceil);
	defineFunction(builtin_Math, "cos", 1, Math_cos);
	defineFunction(builtin_Math, "exp", 1, Math_exp);
	defineFunction(builtin_Math, "floor", 1, Math_floor);
	defineFunction(builtin_Math, "log", 1, Math_log);
	defineFunction(builtin_Math, "max", 2, Math_max);
	defineFunction(builtin_Math, "min", 2, Math_min);
	defineFunction(builtin_Math, "pow", 2, Math_pow);
	defineFunction(builtin_Math, "random", 0, Math_random);
	defineFunction(builtin_Math, "round", 1, Math_round);
	defineFunction(builtin_Math, "sin", 1, Math_sin);
	defineFunction(builtin_Math, "sqrt", 1, Math_sqrt);
	defineFunction(builtin_Math, "tan", 1, Math_tan);

	defineFinal(builtin_Date, "length", 7);
	defineFinal(builtin_Date, "prototype", builtin_Date_prototype);
	defineFunction(builtin_Date, "parse", 1, Date_parse);
	defineFunction(builtin_Date, "UTC", 7, Date_UTC);
	defineFunction(builtin_Date, "now", 0, Date_now);
	define(builtin_Date_prototype, "constructor", builtin_Date);
	defineFunction(builtin_Date_prototype, "toString", 0, Date_prototype_toString);
	defineFunction(builtin_Date_prototype, "toDateString", 0, Date_prototype_toDateString);
	defineFunction(builtin_Date_prototype, "toTimeString", 0, Date_prototype_toTimeString);
	defineFunction(builtin_Date_prototype, "toLocaleString", 0, Date_prototype_toLocaleString);
	defineFunction(builtin_Date_prototype, "toLocaleDateString", 0, Date_prototype_toLocaleDateString);
	defineFunction(builtin_Date_prototype, "toLocaleTimeString", 0, Date_prototype_toLocaleTimeString);
	defineFunction(builtin_Date_prototype, "valueOf", 0, Date_prototype_valueOf);
	defineFunction(builtin_Date_prototype, "getTime", 0, Date_prototype_getTime);
	defineFunction(builtin_Date_prototype, "getFullYear", 0, Date_prototype_getFullYear);
	defineFunction(builtin_Date_prototype, "getUTCFullYear", 0, Date_prototype_getUTCFullYear);
	defineFunction(builtin_Date_prototype, "getMonth", 0, Date_prototype_getMonth);
	defineFunction(builtin_Date_prototype, "getUTCMonth", 0, Date_prototype_getUTCMonth);
	defineFunction(builtin_Date_prototype, "getDate", 0, Date_prototype_getDate);
	defineFunction(builtin_Date_prototype, "getUTCDate", 0, Date_prototype_getUTCDate);
	defineFunction(builtin_Date_prototype, "getDay", 0, Date_prototype_getDay);
	defineFunction(builtin_Date_prototype, "getUTCDay", 0, Date_prototype_getUTCDay);
	defineFunction(builtin_Date_prototype, "getHours", 0, Date_prototype_getHours);
	defineFunction(builtin_Date_prototype, "getUTCHours", 0, Date_prototype_getUTCHours);
	defineFunction(builtin_Date_prototype, "getMinutes", 0, Date_prototype_getMinutes);
	defineFunction(builtin_Date_prototype, "getUTCMinutes", 0, Date_prototype_getUTCMinutes);
	defineFunction(builtin_Date_prototype, "getSeconds", 0, Date_prototype_getSeconds);
	defineFunction(builtin_Date_prototype, "getUTCSeconds", 0, Date_prototype_getUTCSeconds);
	defineFunction(builtin_Date_prototype, "getMilliseconds", 0, Date_prototype_getMilliseconds);
	defineFunction(builtin_Date_prototype, "getUTCMilliseconds", 0, Date_prototype_getUTCMilliseconds);
	defineFunction(builtin_Date_prototype, "getTimezoneOffset", 0, Date_prototype_getTimezoneOffset);
	defineFunction(builtin_Date_prototype, "setTime", 1, Date_prototype_setTime);
	defineFunction(builtin_Date_prototype, "setMilliseconds", 1, Date_prototype_setMilliseconds);
	defineFunction(builtin_Date_prototype, "setUTCMilliseconds", 1, Date_prototype_setUTCMilliseconds);
	defineFunction(builtin_Date_prototype, "setSeconds", 2, Date_prototype_setSeconds);
	defineFunction(builtin_Date_prototype, "setUTCSeconds", 2, Date_prototype_setUTCSeconds);
	defineFunction(builtin_Date_prototype, "setMinutes", 3, Date_prototype_setMinutes);
	defineFunction(builtin_Date_prototype, "setUTCMinutes", 3, Date_prototype_setUTCMinutes);
	defineFunction(builtin_Date_prototype, "setHours", 4, Date_prototype_setHours);
	defineFunction(builtin_Date_prototype, "setUTCHours", 4, Date_prototype_setUTCHours);
	defineFunction(builtin_Date_prototype, "setDate", 1, Date_prototype_setDate);
	defineFunction(builtin_Date_prototype, "setUTCDate", 1, Date_prototype_setUTCDate);
	defineFunction(builtin_Date_prototype, "setMonth", 2, Date_prototype_setMonth);
	defineFunction(builtin_Date_prototype, "setUTCMonth", 2, Date_prototype_setUTCMonth);
	defineFunction(builtin_Date_prototype, "setFullYear", 3, Date_prototype_setFullYear);
	defineFunction(builtin_Date_prototype, "setUTCFullYear", 3, Date_prototype_setUTCFullYear);
	defineFunction(builtin_Date_prototype, "toUTCString", 0, Date_prototype_toUTCString);
	defineFunction(builtin_Date_prototype, "toISOString", 0, Date_prototype_toISOString);
	defineFunction(builtin_Date_prototype, "toJSON", 1, Date_prototype_toJSON);
	if (STRICT_CONFORMANCE === false) {
		defineFunction(builtin_Date_prototype, "getYear", 0, Date_prototype_getYear);
		defineFunction(builtin_Date_prototype, "setYear", 1, Date_prototype_setYear);
		defineFunction(builtin_Date_prototype, "toGMTString", 0, Date_prototype_toUTCString);
	}

	defineFinal(builtin_RegExp, "length", 2);
	defineFinal(builtin_RegExp, "prototype", builtin_RegExp_prototype);
	builtin_RegExp_prototype.pattern = "";
	builtin_RegExp_prototype.flags = "";
	builtin_RegExp_prototype.Match = theRegExpFactory.compile("", "");
	builtin_RegExp_prototype.NCapturingParens = 0;
	defineFinal(builtin_RegExp_prototype, "source", "(?:)");
	defineFinal(builtin_RegExp_prototype, "global", false);
	defineFinal(builtin_RegExp_prototype, "ignoreCase", false);
	defineFinal(builtin_RegExp_prototype, "multiline", false);
	defineWritable(builtin_RegExp_prototype, "lastIndex", 0);
	define(builtin_RegExp_prototype, "constructor", builtin_RegExp);
	defineFunction(builtin_RegExp_prototype, "exec", 1, RegExp_prototype_exec);
	defineFunction(builtin_RegExp_prototype, "test", 1, RegExp_prototype_test);
	defineFunction(builtin_RegExp_prototype, "toString", 0, RegExp_prototype_toString);

	defineFinal(builtin_Error, "length", 1);
	defineFinal(builtin_Error, "prototype", builtin_Error_prototype);
	define(builtin_Error_prototype, "constructor", builtin_Error);
	define(builtin_Error_prototype, "name", "Error");
	define(builtin_Error_prototype, "message", "");
	defineFunction(builtin_Error_prototype, "toString", 0, Error_prototype_toString);

	defineFinal(builtin_EvalError, "length", 1);
	defineFinal(builtin_EvalError, "prototype", builtin_EvalError_prototype);
	define(builtin_EvalError_prototype, "constructor", builtin_EvalError);
	define(builtin_EvalError_prototype, "name", "EvalError");
	define(builtin_EvalError_prototype, "message", "");

	defineFinal(builtin_RangeError, "length", 1);
	defineFinal(builtin_RangeError, "prototype", builtin_RangeError_prototype);
	define(builtin_RangeError_prototype, "constructor", builtin_RangeError);
	define(builtin_RangeError_prototype, "name", "RangeError");
	define(builtin_RangeError_prototype, "message", "");

	defineFinal(builtin_ReferenceError, "length", 1);
	defineFinal(builtin_ReferenceError, "prototype", builtin_ReferenceError_prototype);
	define(builtin_ReferenceError_prototype, "constructor", builtin_ReferenceError);
	define(builtin_ReferenceError_prototype, "name", "ReferenceError");
	define(builtin_ReferenceError_prototype, "message", "");

	defineFinal(builtin_SyntaxError, "length", 1);
	defineFinal(builtin_SyntaxError, "prototype", builtin_SyntaxError_prototype);
	define(builtin_SyntaxError_prototype, "constructor", builtin_SyntaxError);
	define(builtin_SyntaxError_prototype, "name", "SyntaxError");
	define(builtin_SyntaxError_prototype, "message", "");

	defineFinal(builtin_TypeError, "length", 1);
	defineFinal(builtin_TypeError, "prototype", builtin_TypeError_prototype);
	define(builtin_TypeError_prototype, "constructor", builtin_TypeError);
	define(builtin_TypeError_prototype, "name", "TypeError");
	define(builtin_TypeError_prototype, "message", "");

	defineFinal(builtin_URIError, "length", 1);
	defineFinal(builtin_URIError, "prototype", builtin_URIError_prototype);
	define(builtin_URIError_prototype, "constructor", builtin_URIError);
	define(builtin_URIError_prototype, "name", "URIError");
	define(builtin_URIError_prototype, "message", "");

	defineFunction(builtin_JSON, "parse", 2, JSON_parse);
	defineFunction(builtin_JSON, "stringify", 3, JSON_stringify);

	initializeThrowTypeErrorObject();
}
