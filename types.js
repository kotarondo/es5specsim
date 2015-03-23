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

// ECMAScript 5.1: 8 Types
// ECMAScript 5.1: 9 Type Conversion and Testing

function Type(x) {
	switch (typeof x) {
	case "undefined":
		return "Undefined";
	case "boolean":
		return "Boolean";
	case "number":
		return "Number";
	case "string":
		return "String";
	}
	if (x === null) return "Null";
	if (x.Class !== undefined) return "Object";
	if (x.referencedName !== undefined) return "Reference";
	if (x.HasBinding !== undefined) return "EnvironmentRecord";
	assert(false);
}

function ReferenceValue(base, referencedName, strictReference) {
	return {
		base : base,
		referencedName : referencedName,
		strictReference : strictReference,
	};
}

function GetBase(V) {
	return V.base;
}

function GetReferencedName(V) {
	return V.referencedName;
}

function IsStrictReference(V) {
	return V.strictReference;
}

function HasPrimitiveBase(V) {
	switch (typeof V.base) {
	case "boolean":
	case "string":
	case "number":
		return true;
	}
	return false;
}

function IsPropertyReference(V) {
	if (Type(V.base) === "Object") return true;
	return HasPrimitiveBase(V);
}

function IsUnresolvableReference(V) {
	if (V.base === undefined) return true;
	return false;
}

function GetValue(V) {
	if (Type(V) !== "Reference") return V;
	var base = GetBase(V);
	if (IsUnresolvableReference(V)) throw VMReferenceError();
	if (IsPropertyReference(V)) {
		if (HasPrimitiveBase(V) === false) return base.Get(GetReferencedName(V));
		else return specialGet(base, GetReferencedName(V));
	}
	else {
		assert(Type(base) === "EnvironmentRecord");
		return base.GetBindingValue(GetReferencedName(V), IsStrictReference(V));
	}
}

function specialGet(base, P) {
	var O = ToObject(base);
	var desc = O.GetProperty(P);
	if (desc === undefined) return undefined;
	if (IsDataDescriptor(desc) === true) return desc.Value;
	else {
		assert(IsAccessorDescriptor(desc) === true);
		var getter = desc.Get;
		if (getter === undefined) return undefined;
		return getter.Call(base, []);
	}
}

function PutValue(V, W) {
	if (Type(V) !== "Reference") throw VMReferenceError();
	var base = GetBase(V);
	if (IsUnresolvableReference(V)) {
		if (IsStrictReference(V) === true) throw VMReferenceError();
		theGlobalObject.Put(GetReferencedName(V), W, false);
	}
	else if (IsPropertyReference(V)) {
		if (HasPrimitiveBase(V) === false) {
			base.Put(GetReferencedName(V), W, IsStrictReference(V));
		}
		else {
			specialPut(base, GetReferencedName(V), W, IsStrictReference(V));
		}
	}
	else {
		assert(Type(base) === "EnvironmentRecord");
		base.SetMutableBinding(GetReferencedName(V), W, IsStrictReference(V));
	}
	return;
}

function specialPut(base, P, W, Throw) {
	var O = ToObject(base);
	if (O.CanPut(P) === false) {
		if (Throw === true) throw VMTypeError();
		else return;
	}
	var ownDesc = O.GetOwnProperty(P);
	if (IsDataDescriptor(ownDesc) === true) {
		if (Throw === true) throw VMTypeError();
		else return;
	}
	var desc = O.GetProperty(P);
	if (IsAccessorDescriptor(desc) === true) {
		var setter = desc.Set;
		setter.Call(base, [ W ]);
	}
	else if (Throw === true) throw VMTypeError();
	return;
}

function CompletionValue(type, value, target) {
	return {
		type : type,
		value : value,
		target : target,
	};
}

function PropertyDescriptor(Desc) {
	if (!Desc.hasOwnProperty("Value")) {
		Desc.Value = absent;
	}
	if (!Desc.hasOwnProperty("Writable")) {
		Desc.Writable = absent;
	}
	if (!Desc.hasOwnProperty("Get")) {
		Desc.Get = absent;
	}
	if (!Desc.hasOwnProperty("Set")) {
		Desc.Set = absent;
	}
	if (!Desc.hasOwnProperty("Configurable")) {
		Desc.Configurable = absent;
	}
	if (!Desc.hasOwnProperty("Enumerable")) {
		Desc.Enumerable = absent;
	}
	return Desc;
}

function copyPropertyDescriptor(Desc) {
	return {
		Value : Desc.Value,
		Writable : Desc.Writable,
		Get : Desc.Get,
		Set : Desc.Set,
		Configurable : Desc.Configurable,
		Enumerable : Desc.Enumerable,
	}
	return Desc;
}

function IsAccessorDescriptor(Desc) {
	if (Desc === undefined) return false;
	if (Desc.Get === absent && Desc.Set === absent) return false;
	return true;
}

function IsDataDescriptor(Desc) {
	if (Desc === undefined) return false;
	if (Desc.Value === absent && Desc.Writable === absent) return false;
	return true;
}

function IsGenericDescriptor(Desc) {
	if (Desc === undefined) return false;
	if (IsAccessorDescriptor(Desc) === false && IsDataDescriptor(Desc) === false) return true;
	return false;
}

function FromPropertyDescriptor(Desc) {
	if (Desc === undefined) return undefined;
	var obj = Object_Construct([]);
	if (IsDataDescriptor(Desc) === true) {
		assert(Desc.Value !== absent);
		assert(Desc.Writable !== absent);
		obj.DefineOwnProperty("value", PropertyDescriptor({
			Value : Desc.Value,
			Writable : true,
			Enumerable : true,
			Configurable : true
		}), false);
		obj.DefineOwnProperty("writable", PropertyDescriptor({
			Value : Desc.Writable,
			Writable : true,
			Enumerable : true,
			Configurable : true
		}), false);
	}
	else {
		assert(IsAccessorDescriptor(Desc) === true);
		assert(Desc.Get !== absent);
		assert(Desc.Set !== absent);
		obj.DefineOwnProperty("get", PropertyDescriptor({
			Value : Desc.Get,
			Writable : true,
			Enumerable : true,
			Configurable : true
		}), false);
		obj.DefineOwnProperty("set", PropertyDescriptor({
			Value : Desc.Set,
			Writable : true,
			Enumerable : true,
			Configurable : true
		}), false);
	}
	assert(Desc.Enumerable !== absent);
	assert(Desc.Configurable !== absent);
	obj.DefineOwnProperty("enumerable", PropertyDescriptor({
		Value : Desc.Enumerable,
		Writable : true,
		Enumerable : true,
		Configurable : true
	}), false);
	obj.DefineOwnProperty("configurable", PropertyDescriptor({
		Value : Desc.Configurable,
		Writable : true,
		Enumerable : true,
		Configurable : true
	}), false);
	return obj;
}

function ToPropertyDescriptor(Obj) {
	if (Type(Obj) !== "Object") throw VMTypeError();
	var desc = PropertyDescriptor({});
	if (Obj.HasProperty("enumerable") === true) {
		var enume = Obj.Get("enumerable");
		desc.Enumerable = ToBoolean(enume);
	}
	if (Obj.HasProperty("configurable") === true) {
		var conf = Obj.Get("configurable");
		desc.Configurable = ToBoolean(conf);
	}
	if (Obj.HasProperty("value") === true) {
		var value = Obj.Get("value");
		desc.Value = value;
	}
	if (Obj.HasProperty("writable") === true) {
		var writable = Obj.Get("writable");
		desc.Writable = ToBoolean(writable);
	}
	if (Obj.HasProperty("get") === true) {
		var getter = Obj.Get("get");
		if (IsCallable(getter) === false && getter !== undefined) throw VMTypeError();
		desc.Get = getter;
	}
	if (Obj.HasProperty("set") === true) {
		var setter = Obj.Get("set");
		if (IsCallable(setter) === false && setter !== undefined) throw VMTypeError();
		desc.Set = setter;
	}
	if (desc.Get !== absent || desc.Set !== absent) {
		if (desc.Value !== absent || desc.Writable !== absent) throw VMTypeError();
	}
	return desc;
}

function default_GetOwnProperty(P) {
	var O = this;
	if (intrinsic_get(O, P) === undefined) return undefined;
	var D = PropertyDescriptor({});
	var X = intrinsic_get(O, P);
	if (IsDataDescriptor(X)) {
		D.Value = X.Value;
		D.Writable = X.Writable
	}
	else {
		assert(IsAccessorDescriptor(X));
		D.Get = X.Get;
		D.Set = X.Set;
	}
	D.Enumerable = X.Enumerable;
	D.Configurable = X.Configurable;
	return D;
}

function default_GetProperty(P) {
	var O = this;
	var prop = O.GetOwnProperty(P);
	if (prop !== undefined) return prop;
	var proto = O.Prototype;
	if (proto === null) return undefined;
	return proto.GetProperty(P);
}

function default_Get(P) {
	var O = this;
	var desc = O.GetProperty(P);
	if (desc === undefined) return undefined;
	if (IsDataDescriptor(desc) === true) return desc.Value;
	else {
		assert(IsAccessorDescriptor(desc) === true);
		var getter = desc.Get;
		if (getter === undefined) return undefined;
		return getter.Call(O, []);
	}
}

function default_CanPut(P) {
	var O = this;
	var desc = O.GetOwnProperty(P);
	if (desc !== undefined) {
		if (IsAccessorDescriptor(desc) === true) {
			if (desc.Set === undefined) return false;
			else return true;
		}
		else {
			assert(IsDataDescriptor(desc));
		}
		return desc.Writable;
	}
	var proto = O.Prototype;
	if (proto === null) return O.Extensible;
	var inherited = proto.GetProperty(P);
	if (inherited === undefined) return O.Extensible;
	if (IsAccessorDescriptor(inherited) === true) {
		if (inherited.Set === undefined) return false;
		else return true;
	}
	else {
		assert(IsDataDescriptor(inherited));
		if (O.Extensible === false) return false;
		else return inherited.Writable;
	}
}

function default_Put(P, V, Throw) {
	var O = this;
	if (O.CanPut(P) === false) {
		if (Throw === true) throw VMTypeError();
		else return;
	}
	var ownDesc = O.GetOwnProperty(P);
	if (IsDataDescriptor(ownDesc) === true) {
		var valueDesc = PropertyDescriptor({
			Value : V
		});
		O.DefineOwnProperty(P, valueDesc, Throw);
		return;
	}
	var desc = O.GetProperty(P);
	if (IsAccessorDescriptor(desc) === true) {
		var setter = desc.Set;
		assert(setter !== undefined);
		setter.Call(O, [ V ]);
	}
	else {
		var newDesc = PropertyDescriptor({
			Value : V,
			Writable : true,
			Enumerable : true,
			Configurable : true
		});
		O.DefineOwnProperty(P, newDesc, Throw);
	}
	return;
}

function default_HasProperty(P) {
	var O = this;
	var desc = O.GetProperty(P);
	if (desc === undefined) return false;
	else return true;
}

function default_Delete(P, Throw) {
	var O = this;
	var desc = O.GetOwnProperty(P);
	if (desc === undefined) return true;
	if (desc.Configurable === true) {
		intrinsic_remove(O, P);
		return true;
	}
	else if (Throw) throw VMTypeError();
	return false;
}

function default_DefaultValue(hint) {
	var O = this;
	if (hint === undefined) {
		if (O.Class === "Date") {
			hint = "String";
		}
		else {
			hint = "Number";
		}
	}
	if (hint === "String") {
		var toString = O.Get("toString");
		if (IsCallable(toString) === true) {
			var str = toString.Call(O, []);
			if (Type(str) !== "Object") return str;
		}
		var valueOf = O.Get("valueOf");
		if (IsCallable(valueOf) === true) {
			var val = valueOf.Call(O, []);
			if (Type(val) !== "Object") return val;
		}
		throw VMTypeError();
	}
	if (hint === "Number") {
		var valueOf = O.Get("valueOf");
		if (IsCallable(valueOf) === true) {
			var val = valueOf.Call(O, []);
			if (Type(val) !== "Object") return val;
		}
		var toString = O.Get("toString");
		if (IsCallable(toString) === true) {
			var str = toString.Call(O, []);
			if (Type(str) !== "Object") return str;
		}
		throw VMTypeError();
	}
}

function default_DefineOwnProperty(P, Desc, Throw) {
	var O = this;
	var current = O.GetOwnProperty(P);
	var extensible = O.Extensible;
	if (current === undefined && extensible === false) {
		if (Throw === true) throw VMTypeError();
		else return false;
	}
	if (current === undefined && extensible === true) {
		if (IsGenericDescriptor(Desc) === true || IsDataDescriptor(Desc) === true) {
			intrinsic_createData(O, P, Desc);
		}
		else {
			assert(IsAccessorDescriptor(Desc));
			intrinsic_createAccessor(O, P, Desc);
		}
		return true;
	}
	if (isEveryFieldOcurrsAndSameAs(Desc, PropertyDescriptor({}))) return true;
	if (isEveryFieldOcurrsAndSameAs(Desc, current)) return true;
	if (current.Configurable === false) {
		if (Desc.Configurable === true) {
			if (Throw === true) throw VMTypeError();
			else return false;
		}
		if (Desc.Enumerable !== absent && current.Enumerable !== Desc.Enumerable) {
			if (Throw === true) throw VMTypeError();
			else return false;
		}
	}
	if (IsGenericDescriptor(Desc) === true) {
	}
	else if (IsDataDescriptor(current) !== IsDataDescriptor(Desc)) {
		if (current.Configurable === false) {
			if (Throw === true) throw VMTypeError();
			else return false;
		}
		if (IsDataDescriptor(current) === true) {
			intrinsic_createAccessor(O, P, PropertyDescriptor({
				Configurable : current.Configurable,
				Enumerable : current.Enumerable,
			}));
		}
		else {
			intrinsic_createData(O, P, PropertyDescriptor({
				Configurable : current.Configurable,
				Enumerable : current.Enumerable,
			}));
		}
	}
	else if (IsDataDescriptor(current) === true && IsDataDescriptor(Desc) === true) {
		if (current.Configurable === false) {
			if (current.Writable === false && Desc.Writable === true) {
				if (Throw === true) throw VMTypeError();
				else return false;
			}
			if (current.Writable === false) {
				if (Desc.Value !== absent && SameValue(Desc.Value, current.Value) === false) {
					if (Throw === true) throw VMTypeError();
					else return false;
				}
			}
		}
		else {
			assert(current.Configurable === true);
		}
	}
	else {
		assert(IsAccessorDescriptor(current) === true && IsAccessorDescriptor(Desc) === true);
		if (current.Configurable === false) {
			if (Desc.Set !== absent && SameValue(Desc.Set, current.Set) === false) {
				if (Throw === true) throw VMTypeError();
				else return false;
			}
			if (Desc.Get !== absent && SameValue(Desc.Get, current.Get) === false) {
				if (Throw === true) throw VMTypeError();
				else return false;
			}
		}
	}
	intrinsic_set(O, P, Desc);
	return true;
}

function isEveryFieldOcurrsAndSameAs(Desc, x) {
	if (Desc.Value !== absent) {
		if (x.Value === absent) return false;
		if (!SameValue(Desc.Value, x.Value)) return false;
	}
	if (Desc.Writable !== absent) {
		if (x.Writable === absent) return false;
		if (!SameValue(Desc.Writable, x.Writable)) return false;
	}
	if (Desc.Get !== absent) {
		if (x.Get === absent) return false;
		if (!SameValue(Desc.Get, x.Get)) return false;
	}
	if (Desc.Set !== absent) {
		if (x.Set === absent) return false;
		if (!SameValue(Desc.Set, x.Set)) return false;
	}
	if (Desc.Configurable !== absent) {
		if (x.Configurable === absent) return false;
		if (!SameValue(Desc.Configurable, x.Configurable)) return false;
	}
	if (Desc.Enumerable !== absent) {
		if (x.Enumerable === absent) return false;
		if (!SameValue(Desc.Enumerable, x.Enumerable)) return false;
	}
	return true;
}

function default_enumerator(ownOnly, enumerableOnly) {
	return intrinsic_enumerator(this, ownOnly, enumerableOnly);
}

function VMObject() {
	return {
		$properties : Object.create(null),
	};
}

function intrinsic_get(O, P) {
	return O.$properties[P];
}

function intrinsic_set(O, P, Desc) {
	var x = O.$properties[P];
	if (Desc.Value !== absent) {
		x.Value = Desc.Value;
	}
	if (Desc.Writable !== absent) {
		x.Writable = Desc.Writable;
	}
	if (Desc.Get !== absent) {
		x.Get = Desc.Get;
	}
	if (Desc.Set !== absent) {
		x.Set = Desc.Set;
	}
	if (Desc.Configurable !== absent) {
		x.Configurable = Desc.Configurable;
	}
	if (Desc.Enumerable !== absent) {
		x.Enumerable = Desc.Enumerable;
	}
}

function intrinsic_remove(O, P) {
	delete O.$properties[P];
}

function intrinsic_createData(O, P, Desc) {
	var x = {
		Value : undefined,
		Writable : false,
		Get : absent,
		Set : absent,
		Enumerable : false,
		Configurable : false,
	};
	if (Desc.Value !== absent) {
		x.Value = Desc.Value;
	}
	if (Desc.Writable !== absent) {
		x.Writable = Desc.Writable;
	}
	if (Desc.Configurable !== absent) {
		x.Configurable = Desc.Configurable;
	}
	if (Desc.Enumerable !== absent) {
		x.Enumerable = Desc.Enumerable;
	}
	O.$properties[P] = x;
}

function intrinsic_createAccessor(O, P, Desc) {
	var x = {
		Value : absent,
		Writable : absent,
		Get : undefined,
		Set : undefined,
		Enumerable : false,
		Configurable : false,
	};
	if (Desc.Get !== absent) {
		x.Get = Desc.Get;
	}
	if (Desc.Set !== absent) {
		x.Set = Desc.Set;
	}
	if (Desc.Configurable !== absent) {
		x.Configurable = Desc.Configurable;
	}
	if (Desc.Enumerable !== absent) {
		x.Enumerable = Desc.Enumerable;
	}
	O.$properties[P] = x;
}

function intrinsic_enumerator(O, ownOnly, enumerableOnly) {
	var names = Object.keys(O.$properties);
	if (ownOnly !== true) {
		var all = Object.create(null);
		var proto = O;
		while (proto !== null) {
			for ( var P in proto.$properties) {
				var desc = proto.$properties[P];
				if ((enumerableOnly == false) || desc.Enumerable === true) {
					all[P] = P;
				}
			}
			proto = proto.Prototype;
		}
		var names = Object.keys(all);
	}
	var i = 0;
	var next = function() {
		while (true) {
			var P = names[i++];
			if (P === undefined) return undefined;
			var desc = O.$properties[P];
			if (desc === undefined) {
				if (ownOnly === true) {
					continue;
				}
				var proto = O.Prototype;
				while (proto !== null) {
					var desc = proto.$properties[P];
					if (desc !== undefined) {
						break;
					}
					proto = proto.Prototype;
				}
				if (desc === undefined) {
					continue;
				}
			}
			if ((enumerableOnly == false) || desc.Enumerable === true) return P;
		}
	}
	return next;
}

function setAllTheInternalMethods(O) {
	O.GetOwnProperty = default_GetOwnProperty;
	O.GetProperty = default_GetProperty;
	O.Get = default_Get;
	O.CanPut = default_CanPut;
	O.Put = default_Put;
	O.HasProperty = default_HasProperty;
	O.Delete = default_Delete;
	O.DefaultValue = default_DefaultValue;
	O.DefineOwnProperty = default_DefineOwnProperty;
	O.enumerator = default_enumerator;
}

function ToPrimitive(input, hint) {
	if (Type(input) === "Object") return input.DefaultValue(hint);
	return input;
}

function ToBoolean(input) {
	switch (Type(input)) {
	case "Undefined":
	case "Null":
		return false;
	case "Boolean":
		return input;
	case "Number":
		if (input === 0 || isNaN(input)) return false;
		return true;
	case "String":
		if (input === "") return false;
		return true;
	case "Object":
		return true;
	}
}

function ToNumber(input) {
	switch (Type(input)) {
	case "Undefined":
		return NaN;
	case "Null":
		return 0;
	case "Boolean":
		if (input === true) return 1;
		return 0;
	case "Number":
		return input;
	case "String":
		return Number(input);
	case "Object":
		var primValue = input.DefaultValue("Number");
		return ToNumber(primValue);
	}
}

function ToInteger(input) {
	var number = ToNumber(input);
	if (isNaN(number)) return 0;
	if (number === 0) return number;
	if (number < 0) return -floor(-number);
	return floor(number);
}

function ToInt32(input) {
	var number = ToNumber(input);
	return (number >> 0);
}

function ToUint32(input) {
	var number = ToNumber(input);
	return (number >>> 0);
}

function ToUint16(input) {
	var number = ToNumber(input);
	return ((number >>> 0) & 0xffff);
}

function ToString(input) {
	switch (Type(input)) {
	case "Undefined":
		return "undefined";
	case "Null":
		return "null";
	case "Boolean":
		if (input === true) return "true";
		return "false";
	case "Number":
		return String(input);
	case "String":
		return input;
	case "Object":
		var primValue = input.DefaultValue("String");
		return ToString(primValue);
	}
}

function ToObject(input) {
	switch (Type(input)) {
	case "Undefined":
	case "Null":
		throw VMTypeError();
	case "Boolean":
		return Boolean_Construct([ input ]);
	case "Number":
		return Number_Construct([ input ]);
	case "String":
		return String_Construct([ input ]);
	case "Object":
		return input;
	}
	assert(false);
}

function CheckObjectCoercible(input) {
	switch (Type(input)) {
	case "Undefined":
	case "Null":
		throw VMTypeError();
	}
}

function IsCallable(input) {
	if (Type(input) === "Object") {
		if (input.Call !== undefined) return true;
	}
	return false;
}

function SameValue(x, y) {
	if (Type(x) !== Type(y)) return false;
	switch (Type(x)) {
	case "Undefined":
	case "Null":
		return true;
	case "Boolean":
	case "String":
	case "Object":
		return (x === y);
	case "Number":
		if (x === y) {
			if (x === 0 && 1 / (x * y) === -Infinity) return false;
			return true;
		}
		else {
			if (isNaN(x) && isNaN(y)) return true;
			return false;
		}
	}
	debugger;
}
