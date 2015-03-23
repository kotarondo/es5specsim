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

// ECMAScript 5.1: 15.8 The Math Object

function Math_abs(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.abs(x);
}

function Math_acos(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.acos(x);
}

function Math_asin(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.asin(x);
}

function Math_atan(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.atan(x);
}

function Math_atan2(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	var y = ToNumber(argumentsList[1]);
	return Math.atan2(x, y);
}

function Math_ceil(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.ceil(x);
}

function Math_cos(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.cos(x);
}

function Math_exp(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.exp(x);
}

function Math_floor(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.floor(x);
}

function Math_log(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.log(x);
}

function Math_max(thisValue, argumentsList) {
	var result = -Infinity;
	for (var i = 0; i < argumentsList.length; i++) {
		var value = ToNumber(argumentsList[i]);
		var result = Math.max(result, value);
	}
	return result;
}

function Math_min(thisValue, argumentsList) {
	var result = Infinity;
	for (var i = 0; i < argumentsList.length; i++) {
		var value = ToNumber(argumentsList[i]);
		var result = Math.min(result, value);
	}
	return result;
}

function Math_pow(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	var y = ToNumber(argumentsList[1]);
	return Math.pow(x, y);
}

function Math_random(thisValue, argumentsList) {
	return Math.random();
}

function Math_round(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.round(x);
}

function Math_sin(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.sin(x);
}

function Math_sqrt(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.sqrt(x);
}

function Math_tan(thisValue, argumentsList) {
	var x = ToNumber(argumentsList[0]);
	return Math.tan(x);
}
