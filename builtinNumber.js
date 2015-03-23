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

// ECMAScript 5.1: 15.7 Number Objects

function Number_Call(thisValue, argumentsList) {
	var value = argumentsList[0];
	if (argumentsList.length == 0) return 0;
	return ToNumber(value);
}

function Number_Construct(argumentsList) {
	var value = Number_Call(null, argumentsList);
	var obj = VMObject();
	setAllTheInternalMethods(obj);
	obj.Prototype = builtin_Number_prototype;
	obj.Class = "Number";
	obj.Extensible = true;
	obj.PrimitiveValue = value;
	return obj;
}

function Number_prototype_toString(thisValue, argumentsList) {
	var radix = argumentsList[0];
	var thisNumber = Number_prototype_valueOf(thisValue);
	if (radix === undefined) {
		radix = 10;
	}
	var r = ToInteger(radix);
	if (r === 10) return ToString(thisNumber);
	if (!((2 <= r) && (r <= 36))) throw VMRangeError();
	return thisNumber.toString(r);
}

function Number_prototype_toLocaleString(thisValue, argumentsList) {
	return Number_prototype_toString(thisValue, argumentsList);
}

function Number_prototype_valueOf(thisValue, argumentsList) {
	if (Type(thisValue) === "Number") return thisValue;
	if (Type(thisValue) === "Object" && thisValue.Class === "Number") return thisValue.PrimitiveValue;
	throw VMTypeError();
}

function Number_prototype_toFixed(thisValue, argumentsList) {
	var fractionDigits = argumentsList[0];
	var f = ToInteger(fractionDigits);
	if ((f < 0) || (f > 20)) throw VMRangeError();
	var x = Number_prototype_valueOf(thisValue);
	if (isNaN(x)) return "NaN";
	var s = "";
	if (x < 0) {
		var s = "-";
		var x = -x;
	}
	if (x >= 1e21) {
		var m = ToString(x);
	}
	else {
		var m = x.toFixed(f);
	}
	return s + m;
}

function Number_prototype_toExponential(thisValue, argumentsList) {
	var fractionDigits = argumentsList[0];
	var x = Number_prototype_valueOf(thisValue);
	var f = ToInteger(fractionDigits);
	if (isNaN(x)) return "NaN";
	var s = "";
	if (x < 0) {
		var s = "-";
		var x = -x;
	}
	if (x === Infinity) return s + "Infinity";
	if (fractionDigits !== undefined && ((f < 0) || (f > 20))) throw VMRangeError();
	var m = x.toExponential(f);
	return s + m;
}

function Number_prototype_toPrecision(thisValue, argumentsList) {
	var precision = argumentsList[0];
	var x = Number_prototype_valueOf(thisValue);
	if (precision === undefined) return ToString(x);
	var p = ToInteger(precision);
	if (isNaN(x)) return "NaN";
	var s = "";
	if (x < 0) {
		var s = "-";
		var x = -x;
	}
	if (x === Infinity) return s + "Infinity";
	if ((p < 1) || (p > 21)) throw VMRangeError();
	var m = x.toPrecision(p);
	return s + m;
}
