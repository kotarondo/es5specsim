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

// ECMAScript 5.1: 15.4 Array Objects

function Array_Call(thisValue, argumentsList) {
	return Array_Construct(argumentsList);
}

function Array_Construct(argumentsList) {
	var obj = VMObject();
	setAllTheInternalMethods(obj);
	obj.Prototype = builtin_Array_prototype;
	obj.Class = "Array";
	obj.Extensible = true;
	obj.DefineOwnProperty = ArrayObject_DefineOwnProperty;
	if (argumentsList.length !== 1) {
		defineWritable(obj, "length", argumentsList.length);
		for (var i = 0; i < argumentsList.length; i++) {
			defineFree(obj, ToString(i), argumentsList[i]);
		}
	}
	else {
		var len = argumentsList[0];
		if (Type(len) === "Number" && ToUint32(len) === len) {
			defineWritable(obj, "length", ToUint32(len));
		}
		if (Type(len) === "Number" && ToUint32(len) !== len) throw VMRangeError();
		if (Type(len) !== "Number") {
			defineWritable(obj, "length", 1);
			defineFree(obj, "0", len);
		}
	}
	return obj;
}

function Array_isArray(thisValue, argumentsList) {
	var arg = argumentsList[0];
	if (Type(arg) !== "Object") return false;
	if (arg.Class === "Array") return true;
	return false;
}

function Array_prototype_toString(thisValue, argumentsList) {
	var array = ToObject(thisValue);
	var func = array.Get("join");
	if (IsCallable(func) === false) return Object_prototype_toString(array, []);
	return func.Call(array, []);
}

function Array_prototype_toLocaleString(thisValue, argumentsList) {
	var array = ToObject(thisValue);
	var arrayLen = array.Get("length");
	var len = ToUint32(arrayLen);
	var separator = ',';
	if (len === 0) return "";
	var firstElement = array.Get("0");
	if (firstElement === undefined || firstElement === null) {
		var R = "";
	}
	else {
		var elementObj = ToObject(firstElement);
		var func = elementObj.Get("toLocaleString");
		if (IsCallable(func) === false) throw VMTypeError();
		// specification Bug 62
		//var R = func.Call(elementObj, []);
		var R = func.Call(firstElement, []);
		var R = ToString(R);
		// end of bug fix
	}
	var k = 1;
	while (k < len) {
		var S = R + separator;
		var nextElement = array.Get(ToString(k));
		if (nextElement === undefined || nextElement === null) {
			var R = "";
		}
		else {
			var elementObj = ToObject(nextElement);
			var func = elementObj.Get("toLocaleString");
			if (IsCallable(func) === false) throw VMTypeError();
			// specification Bug 62
			//var R = func.Call(elementObj, []);
			var R = func.Call(nextElement, []);
			var R = ToString(R);
			// end of bug fix
		}
		var R = S + R;
		k++;
	}
	return R;
}

function Array_prototype_concat(thisValue, argumentsList) {
	var O = ToObject(thisValue);
	var A = Array_Construct([]);
	var n = 0;
	var items = [ O ].concat(argumentsList);
	for (var i = 0; i < items.length; i++) {
		var E = items[i];
		if (E.Class === "Array") {
			var k = 0;
			var len = E.Get("length");
			while (k < len) {
				var P = ToString(k);
				var exists = E.HasProperty(P);
				if (exists === true) {
					var subElement = E.Get(P);
					A.DefineOwnProperty(ToString(n), PropertyDescriptor({
						Value : subElement,
						Writable : true,
						Enumerable : true,
						Configurable : true
					}), false);
				}
				n++;
				k++;
			}
		}
		else {
			A.DefineOwnProperty(ToString(n), PropertyDescriptor({
				Value : E,
				Writable : true,
				Enumerable : true,
				Configurable : true
			}), false);
			n++;
		}
	}
	// specification Bug 129
	A.Put("length", n, true);
	// end of bug fix
	return A;
}

function Array_prototype_join(thisValue, argumentsList) {
	var separator = argumentsList[0];
	var O = ToObject(thisValue);
	var lenVal = O.Get("length");
	var len = ToUint32(lenVal);
	if (separator === undefined) {
		var separator = ",";
	}
	var sep = ToString(separator);
	if (len === 0) return "";
	var element0 = O.Get("0");
	if (element0 === undefined || element0 === null) {
		var R = "";
	}
	else {
		var R = ToString(element0);
	}
	var k = 1;
	while (k < len) {
		var S = R + sep;
		var element = O.Get(ToString(k));
		if (element === undefined || element === null) {
			var next = "";
		}
		else {
			var next = ToString(element);
		}
		var R = S + next;
		k++;
	}
	return R;
}

function Array_prototype_pop(thisValue, argumentsList) {
	var O = ToObject(thisValue);
	var lenVal = O.Get("length");
	var len = ToUint32(lenVal);
	if (len === 0) {
		O.Put("length", 0, true);
		return undefined;
	}
	else {
		var indx = ToString(len - 1);
		var element = O.Get(indx)
		O.Delete(indx, true);
		// specification Bug 162
		// O.Put("length", indx, true);
		O.Put("length", len - 1, true);
		// end of bug fix
		return element;
	}
}

function Array_prototype_push(thisValue, argumentsList) {
	var O = ToObject(thisValue);
	var lenVal = O.Get("length");
	var n = ToUint32(lenVal);
	var items = argumentsList;
	for (var i = 0; i < items.length; i++) {
		var E = items[i];
		O.Put(ToString(n), E, true);
		n++;
	}
	O.Put("length", n, true);
	return n;
}

function Array_prototype_reverse(thisValue, argumentsList) {
	var O = ToObject(thisValue);
	var lenVal = O.Get("length");
	var len = ToUint32(lenVal);
	var middle = floor(len / 2);
	var lower = 0;
	while (lower !== middle) {
		var upper = len - lower - 1;
		var upperP = ToString(upper);
		var lowerP = ToString(lower);
		var lowerValue = O.Get(lowerP);
		var upperValue = O.Get(upperP);
		var lowerExists = O.HasProperty(lowerP);
		var upperExists = O.HasProperty(upperP);
		if (lowerExists === true && upperExists === true) {
			O.Put(lowerP, upperValue, true);
			O.Put(upperP, lowerValue, true);
		}
		else if (lowerExists === false && upperExists === true) {
			O.Put(lowerP, upperValue, true);
			O.Delete(upperP, true);
		}
		else if (lowerExists === true && upperExists === false) {
			O.Delete(lowerP, true);
			O.Put(upperP, lowerValue, true);
		}
		lower++;
	}
	return O;
}

function Array_prototype_shift(thisValue, argumentsList) {
	var O = ToObject(thisValue);
	var lenVal = O.Get("length");
	var len = ToUint32(lenVal);
	if (len === 0) {
		O.Put("length", 0, true);
		return undefined;
	}
	var first = O.Get("0");
	var k = 1;
	while (k < len) {
		var from = ToString(k);
		var to = ToString(k - 1);
		var fromPresent = O.HasProperty(from);
		if (fromPresent === true) {
			var fromVal = O.Get(from);
			O.Put(to, fromVal, true);
		}
		else {
			O.Delete(to, true);
		}
		k++;
	}
	O.Delete(ToString(len - 1), true);
	O.Put("length", (len - 1), true);
	return first;
}

function Array_prototype_slice(thisValue, argumentsList) {
	var start = argumentsList[0];
	var end = argumentsList[1];
	var O = ToObject(thisValue);
	var A = Array_Construct([]);
	var lenVal = O.Get("length");
	var len = ToUint32(lenVal);
	var relativeStart = ToInteger(start);
	if (relativeStart < 0) {
		var k = max((len + relativeStart), 0);
	}
	else {
		var k = min(relativeStart, len);
	}
	if (end === undefined) {
		var relativeEnd = len;
	}
	else {
		var relativeEnd = ToInteger(end);
	}
	if (relativeEnd < 0) {
		var final = max((len + relativeEnd), 0);
	}
	else {
		var final = min(relativeEnd, len);
	}
	var n = 0;
	while (k < final) {
		var Pk = ToString(k);
		var kPresent = O.HasProperty(Pk);
		if (kPresent === true) {
			var kValue = O.Get(Pk);
			A.DefineOwnProperty(ToString(n), PropertyDescriptor({
				Value : kValue,
				Writable : true,
				Enumerable : true,
				Configurable : true
			}), false);
		}
		k++;
		n++;
	}
	// specification Bug 417
	A.Put("length", n, true);
	// end of bug fix
	return A;
}

function Array_prototype_sort(thisValue, argumentsList) {
	var comparefn = argumentsList[0];
	var obj = ToObject(thisValue);
	var len = ToUint32(obj.Get("length"));
	var perm = [];
	for (var i = 0; i < len; i++) {
		perm[i] = i;
	}
	var perm = qsort(perm);
	var result = [];
	for (var i = 0; i < len; i++) {
		var P = ToString(perm[i]);
		if (obj.HasProperty(P) === false) {
			break;
		}
		result[i] = obj.Get(P);
	}
	for (var i = 0; i < len; i++) {
		var P = ToString(i);
		if (i < result.length) {
			obj.Put(P, result[i], true);
		}
		else {
			obj.Delete(P, true);
		}
	}
	return obj;

	function qsort(perm) {
		var l = perm.length;
		if (l <= 1) return perm;
		var lower = [];
		var same = [];
		var higher = [];
		var p = perm[l >>> 1];
		for (var i = 0; i < l; i++) {
			var q = perm[i];
			var c = (q === p) ? 0 : SortCompare(q, p);
			switch (c) {
			case -1:
				lower.push(q);
				break;
			case 0:
				same.push(q);
				break;
			case 1:
				higher.push(q);
				break;
			}
		}
		var lower = qsort(lower);
		var higher = qsort(higher);
		return lower.concat(same, higher);
	}

	function SortCompare(j, k) {
		var jString = ToString(j);
		var kString = ToString(k);
		var hasj = obj.HasProperty(jString);
		var hask = obj.HasProperty(kString);
		if (hasj === false && hask === false) return 0;
		if (hasj === false) return 1;
		if (hask === false) return -1;
		var x = obj.Get(jString);
		var y = obj.Get(kString);
		if (x === undefined && y === undefined) return 0;
		if (x === undefined) return 1;
		if (y === undefined) return -1;
		if (comparefn !== undefined) {
			if (IsCallable(comparefn) === false) throw VMTypeError();
			return comparefn.Call(undefined, [ x, y ]);
		}
		var xString = ToString(x);
		var yString = ToString(y);
		if (xString < yString) return -1;
		if (xString > yString) return 1;
		return 0;
	}
}

function Array_prototype_splice(thisValue, argumentsList) {
	var start = argumentsList[0];
	var deleteCount = argumentsList[1];
	var O = ToObject(thisValue);
	var A = Array_Construct([]);
	var lenVal = O.Get("length");
	var len = ToUint32(lenVal);
	var relativeStart = ToInteger(start);
	if (relativeStart < 0) {
		var actualStart = max((len + relativeStart), 0);
	}
	else {
		var actualStart = min(relativeStart, len);
	}
	var actualDeleteCount = min(max(ToInteger(deleteCount), 0), len - actualStart);
	var k = 0;
	while (k < actualDeleteCount) {
		var from = ToString(actualStart + k);
		var fromPresent = O.HasProperty(from);
		if (fromPresent === true) {
			var fromValue = O.Get(from);
			A.DefineOwnProperty(ToString(k), PropertyDescriptor({
				Value : fromValue,
				Writable : true,
				Enumerable : true,
				Configurable : true
			}), false);
		}
		k++;
	}
	// specification Bug 332
	A.Put("length", actualDeleteCount, true);
	// end of bug fix
	var itemCount = argumentsList.length - 2;
	if (itemCount < 0) {
		itemCount = 0;
	}
	if (itemCount < actualDeleteCount) {
		var k = actualStart;
		while (k < (len - actualDeleteCount)) {
			var from = ToString(k + actualDeleteCount);
			var to = ToString(k + itemCount);
			var fromPresent = O.HasProperty(from);
			if (fromPresent === true) {
				var fromValue = O.Get(from);
				O.Put(to, fromValue, true);
			}
			else {
				O.Delete(to, true);
			}
			k++;
		}
		var k = len;
		while (k > (len - actualDeleteCount + itemCount)) {
			O.Delete(ToString(k - 1), true);
			k--;
		}
	}
	else if (itemCount > actualDeleteCount) {
		var k = (len - actualDeleteCount);
		while (k > actualStart) {
			var from = ToString(k + actualDeleteCount - 1);
			var to = ToString(k + itemCount - 1);
			var fromPresent = O.HasProperty(from);
			if (fromPresent === true) {
				var fromValue = O.Get(from);
				O.Put(to, fromValue, true);
			}
			else {
				O.Delete(to, true);
			}
			k--;
		}
	}
	var k = actualStart;
	for (var i = 2; i < argumentsList.length; i++) {
		var E = argumentsList[i];
		O.Put(ToString(k), E, true);
		k++;
	}
	O.Put("length", (len - actualDeleteCount + itemCount), true);
	return A;
}

function Array_prototype_unshift(thisValue, argumentsList) {
	var O = ToObject(thisValue);
	var lenVal = O.Get("length");
	var len = ToUint32(lenVal);
	var argCount = argumentsList.length;
	var k = len;
	while (k > 0) {
		var from = ToString(k - 1);
		var to = ToString(k + argCount - 1);
		var fromPresent = O.HasProperty(from);
		if (fromPresent === true) {
			var fromValue = O.Get(from);
			O.Put(to, fromValue, true);
		}
		else {
			O.Delete(to, true);
		}
		k--;
	}
	var j = 0;
	var items = argumentsList;
	while (j !== items.length) {
		var E = items[j];
		O.Put(ToString(j), E, true);
		j++;
	}
	O.Put("length", len + argCount, true);
	return len + argCount;
}

function Array_prototype_indexOf(thisValue, argumentsList) {
	var searchElement = argumentsList[0];
	var fromIndex = argumentsList[1];
	var O = ToObject(thisValue);
	var lenValue = O.Get("length");
	var len = ToUint32(lenValue);
	if (len === 0) return -1;
	if (argumentsList.length >= 2) {
		var n = ToInteger(fromIndex);
	}
	else {
		var n = 0;
	}
	if (n >= len) return -1;
	if (n >= 0) {
		var k = n;
	}
	else {
		var k = len - abs(n);
		if (k < 0) {
			var k = 0;
		}
	}
	while (k < len) {
		var kPresent = O.HasProperty(ToString(k));
		if (kPresent === true) {
			var elementK = O.Get(ToString(k));
			var same = (searchElement === elementK);
			if (same === true) return k;
		}
		k++;
	}
	return -1;
}

function Array_prototype_lastIndexOf(thisValue, argumentsList) {
	var searchElement = argumentsList[0];
	var fromIndex = argumentsList[1];
	var O = ToObject(thisValue);
	var lenValue = O.Get("length");
	var len = ToUint32(lenValue);
	if (len === 0) return -1;
	if (argumentsList.length >= 2) {
		var n = ToInteger(fromIndex);
	}
	else {
		var n = len - 1;
	}
	if (n >= 0) {
		var k = min(n, len - 1);
	}
	else {
		var k = len - abs(n);
	}
	while (k >= 0) {
		var kPresent = O.HasProperty(ToString(k));
		if (kPresent === true) {
			var elementK = O.Get(ToString(k));
			var same = (searchElement === elementK);
			if (same === true) return k;
		}
		k--;
	}
	return -1;
}

function Array_prototype_every(thisValue, argumentsList) {
	var callbackfn = argumentsList[0];
	var thisArg = argumentsList[1];
	var O = ToObject(thisValue);
	var lenValue = O.Get("length");
	var len = ToUint32(lenValue);
	if (IsCallable(callbackfn) === false) throw VMTypeError();
	if (argumentsList.length >= 2) {
		var T = thisArg;
	}
	else {
		var T = undefined;
	}
	var k = 0;
	while (k < len) {
		var Pk = ToString(k);
		var kPresent = O.HasProperty(Pk);
		if (kPresent === true) {
			var kValue = O.Get(Pk);
			var testResult = callbackfn.Call(T, [ kValue, k, O ]);
			if (ToBoolean(testResult) === false) return false;
		}
		k++;
	}
	return true;
}

function Array_prototype_some(thisValue, argumentsList) {
	var callbackfn = argumentsList[0];
	var thisArg = argumentsList[1];
	var O = ToObject(thisValue);
	var lenValue = O.Get("length");
	var len = ToUint32(lenValue);
	if (IsCallable(callbackfn) === false) throw VMTypeError();
	if (argumentsList.length >= 2) {
		var T = thisArg;
	}
	else {
		var T = undefined;
	}
	var k = 0;
	while (k < len) {
		var Pk = ToString(k);
		var kPresent = O.HasProperty(Pk);
		if (kPresent === true) {
			var kValue = O.Get(Pk);
			var testResult = callbackfn.Call(T, [ kValue, k, O ]);
			if (ToBoolean(testResult) === true) return true;
		}
		k++;
	}
	return false;
}

function Array_prototype_forEach(thisValue, argumentsList) {
	var callbackfn = argumentsList[0];
	var thisArg = argumentsList[1];
	var O = ToObject(thisValue);
	var lenValue = O.Get("length");
	var len = ToUint32(lenValue);
	if (IsCallable(callbackfn) === false) throw VMTypeError();
	if (argumentsList.length >= 2) {
		var T = thisArg;
	}
	else {
		var T = undefined;
	}
	var k = 0;
	while (k < len) {
		var Pk = ToString(k);
		var kPresent = O.HasProperty(Pk);
		if (kPresent === true) {
			var kValue = O.Get(Pk);
			callbackfn.Call(T, [ kValue, k, O ]);
		}
		k++;
	}
	return undefined;
}

function Array_prototype_map(thisValue, argumentsList) {
	var callbackfn = argumentsList[0];
	var thisArg = argumentsList[1];
	var O = ToObject(thisValue);
	var lenValue = O.Get("length");
	var len = ToUint32(lenValue);
	if (IsCallable(callbackfn) === false) throw VMTypeError();
	if (argumentsList.length >= 2) {
		var T = thisArg;
	}
	else {
		var T = undefined;
	}
	var A = Array_Construct([ len ]);
	var k = 0;
	while (k < len) {
		var Pk = ToString(k);
		var kPresent = O.HasProperty(Pk);
		if (kPresent === true) {
			var kValue = O.Get(Pk);
			var mappedValue = callbackfn.Call(T, [ kValue, k, O ]);
			A.DefineOwnProperty(Pk, PropertyDescriptor({
				Value : mappedValue,
				Writable : true,
				Enumerable : true,
				Configurable : true
			}), false);
		}
		k++;
	}
	9.
	return A;
}

function Array_prototype_filter(thisValue, argumentsList) {
	var callbackfn = argumentsList[0];
	var thisArg = argumentsList[1];
	var O = ToObject(thisValue);
	var lenValue = O.Get("length");
	var len = ToUint32(lenValue);
	if (IsCallable(callbackfn) === false) throw VMTypeError();
	if (argumentsList.length >= 2) {
		var T = thisArg;
	}
	else {
		var T = undefined;
	}
	var A = Array_Construct([]);
	var k = 0;
	var to = 0;
	while (k < len) {
		var Pk = ToString(k);
		var kPresent = O.HasProperty(Pk);
		if (kPresent === true) {
			var kValue = O.Get(Pk);
			var selected = callbackfn.Call(T, [ kValue, k, O ]);
			if (ToBoolean(selected) === true) {
				A.DefineOwnProperty(ToString(to), PropertyDescriptor({
					Value : kValue,
					Writable : true,
					Enumerable : true,
					Configurable : true
				}), false);
				to++;
			}
		}
		k++;
	}
	return A;
}

function Array_prototype_reduce(thisValue, argumentsList) {
	var callbackfn = argumentsList[0];
	var initialValue = argumentsList[1];
	var O = ToObject(thisValue);
	var lenValue = O.Get("length");
	var len = ToUint32(lenValue);
	if (IsCallable(callbackfn) === false) throw VMTypeError();
	if (len === 0 && (argumentsList.length < 2)) throw VMTypeError();
	var k = 0;
	if (argumentsList.length >= 2) {
		var accumulator = initialValue;
	}
	else {
		var kPresent = false;
		while (kPresent === false && (k < len)) {
			var Pk = ToString(k);
			var kPresent = O.HasProperty(Pk);
			if (kPresent === true) {
				var accumulator = O.Get(Pk);
			}
			k++;
		}
		if (kPresent === false) throw VMTypeError();
	}
	while (k < len) {
		var Pk = ToString(k);
		var kPresent = O.HasProperty(Pk);
		if (kPresent === true) {
			var kValue = O.Get(Pk);
			var accumulator = callbackfn.Call(undefined, [ accumulator, kValue, k, O ]);
		}
		k++;
	}
	return accumulator;
}

function Array_prototype_reduceRight(thisValue, argumentsList) {
	var callbackfn = argumentsList[0];
	var initialValue = argumentsList[1];
	var O = ToObject(thisValue);
	var lenValue = O.Get("length");
	var len = ToUint32(lenValue);
	if (IsCallable(callbackfn) === false) throw VMTypeError();
	if (len === 0 && (argumentsList.length < 2)) throw VMTypeError();
	var k = len - 1;
	if (argumentsList.length >= 2) {
		var accumulator = initialValue;
	}
	else {
		var kPresent = false;
		while (kPresent === false && (k >= 0)) {
			var Pk = ToString(k);
			var kPresent = O.HasProperty(Pk);
			if (kPresent === true) {
				var accumulator = O.Get(Pk);
			}
			k--;
		}
		if (kPresent === false) throw VMTypeError();
	}
	while (k >= 0) {
		var Pk = ToString(k);
		var kPresent = O.HasProperty(Pk);
		if (kPresent === true) {
			var kValue = O.Get(Pk);
			var accumulator = callbackfn.Call(undefined, [ accumulator, kValue, k, O ]);
		}
		k--;
	}
	return accumulator;
}

function ArrayObject_DefineOwnProperty(P, Desc, Throw) {
	var A = this;
	var oldLenDesc = A.GetOwnProperty("length");
	var oldLen = oldLenDesc.Value;
	if (P === "length") {
		if (Desc.Value === absent) return default_DefineOwnProperty.call(A, "length", Desc, Throw);
		var newLenDesc = copyPropertyDescriptor(Desc);
		var newLen = ToUint32(Desc.Value);
		if (newLen !== ToNumber(Desc.Value)) throw VMRangeError();
		newLenDesc.Value = newLen;
		if (newLen >= oldLen) return default_DefineOwnProperty.call(A, "length", newLenDesc, Throw);
		if (oldLenDesc.Writable === false) {
			if (Throw === true) throw VMTypeError();
			else return false;
		}
		if (newLenDesc.Writable === absent || newLenDesc.Writable === true) {
			var newWritable = true;
		}
		else {
			var newWritable = false;
			newLenDesc.Writable = true;
		}
		var succeeded = default_DefineOwnProperty.call(A, "length", newLenDesc, Throw);
		if (succeeded === false) return false;
		while (newLen < oldLen) {
			oldLen = oldLen - 1;
			var deleteSucceeded = A.Delete(ToString(oldLen), false);
			if (deleteSucceeded === false) {
				newLenDesc.Value = oldLen + 1;
				if (newWritable === false) {
					newLenDesc.Writable = false;
				}
				default_DefineOwnProperty.call(A, "length", newLenDesc, false);
				if (Throw === true) throw VMTypeError();
				else return false;
			}
		}
		if (newWritable === false) {
			default_DefineOwnProperty.call(A, "length", PropertyDescriptor({
				Writable : false
			}), false);
		}
		return true;
	}
	var index = ToUint32(P);
	if (ToString(index) === P && index !== 0xffffffff) {
		if ((index >= oldLen) && oldLenDesc.Writable === false) {
			if (Throw === true) throw VMTypeError();
			else return false;
		}
		var succeeded = default_DefineOwnProperty.call(A, P, Desc, false);
		if (succeeded === false) {
			if (Throw === true) throw VMTypeError();
			else return false;
		}
		if (index >= oldLen) {
			oldLenDesc.Value = index + 1;
			default_DefineOwnProperty.call(A, "length", oldLenDesc, false);
		}
		return true;
	}
	return default_DefineOwnProperty.call(A, P, Desc, Throw);
}
