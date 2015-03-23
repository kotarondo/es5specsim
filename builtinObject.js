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

// ECMAScript 5.1: 15.2 Object Objects

function Object_Call(thisValue, argumentsList) {
	var value = argumentsList[0];
	if (value === null || value === undefined) return Object_Construct(argumentsList);
	return ToObject(value);
}

function Object_Construct(argumentsList) {
	var value = argumentsList[0];
	if (argumentsList.length >= 1) {
		if (Type(value) === "Object") return value;
		if (Type(value) === "String") return ToObject(value);
		if (Type(value) === "Boolean") return ToObject(value);
		if (Type(value) === "Number") return ToObject(value);
	}
	var obj = VMObject();
	setAllTheInternalMethods(obj);
	obj.Prototype = builtin_Object_prototype;
	obj.Class = "Object";
	obj.Extensible = true;
	return obj;
}

function Object_getPrototypeOf(thisValue, argumentsList) {
	var O = argumentsList[0];
	if (Type(O) !== "Object") throw VMTypeError();
	return O.Prototype;
}

function Object_getOwnPropertyDescriptor(thisValue, argumentsList) {
	var O = argumentsList[0];
	var P = argumentsList[1];
	if (Type(O) !== "Object") throw VMTypeError();
	var name = ToString(P);
	var desc = O.GetOwnProperty(name);
	return FromPropertyDescriptor(desc);
}

function Object_getOwnPropertyNames(thisValue, argumentsList) {
	var O = argumentsList[0];
	var P = argumentsList[1];
	if (Type(O) !== "Object") throw VMTypeError();
	var array = Array_Construct([]);
	var n = 0;
	var next = O.enumerator(true, false);
	var name;
	while ((name = next()) !== undefined) {
		array.DefineOwnProperty(ToString(n), PropertyDescriptor({
			Value : name,
			Writable : true,
			Enumerable : true,
			Configurable : true
		}), false);
		n++;
	}
	return array;
}

function Object_create(thisValue, argumentsList) {
	var O = argumentsList[0];
	var Properties = argumentsList[1];
	if (Type(O) !== "Object" && Type(O) !== "Null") throw VMTypeError();
	var obj = Object_Construct([]);
	obj.Prototype = O;
	if (Properties !== undefined) {
		Object_defineProperties(null, [ obj, Properties ]);
	}
	return obj;
}

function Object_defineProperty(thisValue, argumentsList) {
	var O = argumentsList[0];
	var P = argumentsList[1];
	var Attributes = argumentsList[2];
	if (Type(O) !== "Object") throw VMTypeError();
	var name = ToString(P);
	var desc = ToPropertyDescriptor(Attributes);
	O.DefineOwnProperty(name, desc, true);
	return O;
}

function Object_defineProperties(thisValue, argumentsList) {
	var O = argumentsList[0];
	var Properties = argumentsList[1];
	if (Type(O) !== "Object") throw VMTypeError();
	var props = ToObject(Properties);
	var names = props.enumerator(true, true);
	var descriptors = [];
	var P;
	while ((P = names()) !== undefined) {
		var descObj = props.Get(P);
		var desc = ToPropertyDescriptor(descObj);
		descriptors.push([ P, desc ]);
	}
	for (var i = 0; i < descriptors.length; i++) {
		var pair = descriptors[i];
		var P = pair[0];
		var desc = pair[1];
		O.DefineOwnProperty(P, desc, true);
	}
	return O;
}

function Object_seal(thisValue, argumentsList) {
	var O = argumentsList[0];
	if (Type(O) !== "Object") throw VMTypeError();
	var next = O.enumerator(true, false);
	var P;
	while ((P = next()) !== undefined) {
		var desc = O.GetOwnProperty(P);
		if (desc.Configurable === true) {
			desc.Configurable = false;
		}
		O.DefineOwnProperty(P, desc, true);
	}
	O.Extensible = false;
	return O;
}

function Object_freeze(thisValue, argumentsList) {
	var O = argumentsList[0];
	if (Type(O) !== "Object") throw VMTypeError();
	var next = O.enumerator(true, false);
	var P;
	while ((P = next()) !== undefined) {
		var desc = O.GetOwnProperty(P);
		if (IsDataDescriptor(desc) === true) {
			if (desc.Writable === true) {
				desc.Writable = false;
			}
		}
		if (desc.Configurable === true) {
			desc.Configurable = false;
		}
		O.DefineOwnProperty(P, desc, true);
	}
	O.Extensible = false;
	return O;
}

function Object_preventExtensions(thisValue, argumentsList) {
	var O = argumentsList[0];
	if (Type(O) !== "Object") throw VMTypeError();
	O.Extensible = false;
	return O;
}

function Object_isSealed(thisValue, argumentsList) {
	var O = argumentsList[0];
	if (Type(O) !== "Object") throw VMTypeError();
	var next = O.enumerator(true, false);
	var P;
	while ((P = next()) !== undefined) {
		var desc = O.GetOwnProperty(P);
		if (desc.Configurable === true) return false;
	}
	if (O.Extensible === false) return true;
	return false;
}

function Object_isFrozen(thisValue, argumentsList) {
	var O = argumentsList[0];
	if (Type(O) !== "Object") throw VMTypeError();
	var next = O.enumerator(true, false);
	var P;
	while ((P = next()) !== undefined) {
		var desc = O.GetOwnProperty(P);
		if (IsDataDescriptor(desc) === true) {
			if (desc.Writable === true) return false

		}
		if (desc.Configurable === true) return false;
	}
	if (O.Extensible === false) return true;
	return false;
}

function Object_isExtensible(thisValue, argumentsList) {
	var O = argumentsList[0];
	if (Type(O) !== "Object") throw VMTypeError();
	return O.Extensible;
}

function Object_keys(thisValue, argumentsList) {
	var O = argumentsList[0];
	if (Type(O) !== "Object") throw VMTypeError();
	var next = O.enumerator(true, true);
	var n = next.length;
	var array = Array_Construct([ n ]);
	var index = 0;
	var P;
	while ((P = next()) !== undefined) {
		array.DefineOwnProperty(ToString(index), PropertyDescriptor({
			Value : P,
			Writable : true,
			Enumerable : true,
			Configurable : true
		}), false);
		index++;
	}
	return array;
}

function Object_prototype_toString(thisValue, argumentsList) {
	if (thisValue === undefined) return "[object Undefined]";
	if (thisValue === null) return "[object Null]";
	var O = ToObject(thisValue);
	return "[object " + O.Class + "]";
}

function Object_prototype_toLocaleString(thisValue, argumentsList) {
	var O = ToObject(thisValue);
	var toString = O.Get("toString");
	if (IsCallable(toString) === false) throw VMTypeError();
	return toString.Call(O, []);
}

function Object_prototype_valueOf(thisValue, argumentsList) {
	var O = ToObject(thisValue);
	return O;
}

function Object_prototype_hasOwnProperty(thisValue, argumentsList) {
	var V = argumentsList[0];
	var P = ToString(V);
	var O = ToObject(thisValue);
	var desc = O.GetOwnProperty(P);
	if (desc === undefined) return false;
	return true;
}

function Object_prototype_isPrototypeOf(thisValue, argumentsList) {
	var V = argumentsList[0];
	if (Type(V) !== "Object") return false;
	var O = ToObject(thisValue);
	while (true) {
		var V = V.Prototype;
		if (V === null) return false;
		if (O === V) return true;
	}
}

function Object_prototype_propertyIsEnumerable(thisValue, argumentsList) {
	var V = argumentsList[0];
	var P = ToString(V);
	var O = ToObject(thisValue);
	var desc = O.GetOwnProperty(P);
	if (desc === undefined) return false;
	return desc.Enumerable;
}
