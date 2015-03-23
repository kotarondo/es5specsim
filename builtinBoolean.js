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

// ECMAScript 5.1: 15.6 Boolean Objects

function Boolean_Call(thisValue, argumentsList) {
	var value = argumentsList[0];
	return ToBoolean(value);
}

function Boolean_Construct(argumentsList) {
	var value = Boolean_Call(null, argumentsList);
	var obj = VMObject();
	setAllTheInternalMethods(obj);
	obj.Prototype = builtin_Boolean_prototype;
	obj.Class = "Boolean";
	obj.Extensible = true;
	obj.PrimitiveValue = value;
	return obj;
}

function Boolean_prototype_toString(thisValue, argumentsList) {
	var B = thisValue;
	if (Type(B) === "Boolean") {
		var b = B;
	}
	else if (Type(B) === "Object" && B.Class === "Boolean") {
		var b = B.PrimitiveValue;
	}
	else throw VMTypeError();
	if (b === true) return "true";
	else return "false";
}

function Boolean_prototype_valueOf(thisValue, argumentsList) {
	var B = thisValue;
	if (Type(B) === "Boolean") {
		var b = B;
	}
	else if (Type(B) === "Object" && B.Class === "Boolean") {
		var b = B.PrimitiveValue;
	}
	else throw VMTypeError();
	return b;
}
