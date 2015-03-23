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

var STRICT_CONFORMANCE = false;

function assert(condition) {
	if (!condition) {
		debugger;
	}
}

function isInternalError(x) {
	switch (typeof x) {
	case "undefined":
	case "boolean":
	case "number":
	case "string":
		return false;
	}
	if (x === null) return false;
	if (x.Class !== undefined) return false;
	return true;
}

function join(a) {
	return a.join('');
}

function arraycopy(a) {
	var b = [];
	for (var i = 0; i < a.length; i++) {
		b[i] = a[i];
	}
	return b;
}

function isIncluded(m, a) {
	return (a.indexOf(m) >= 0);
}

function floor(x) {
	return Math.floor(x);
}

function modulo(x, y) {
	return x - y * floor(x / y);
}

function abs(x) {
	return Math.abs(x);
}

function min(x, y) {
	return Math.min(x, y);
}

function max(x, y) {
	return Math.max(x, y);
}

var empty = {
	empty : true
};

var absent = {
	absent : true
};

var failure = {
	failure : true
};

function fromCharCode(x) {
	return String.fromCharCode(x);
}

function toCharCode(c) {
	return c.charCodeAt(0);
}

function mvDigitChar(c) {
	if (c === undefined) return NaN;
	var x = c.charCodeAt(0);
	if ((0x30 <= x) && (x <= 0x39)) return x - 0x30;
	if ((0x41 <= x) && (x <= 0x5a)) return x - (0x41 - 10);
	if ((0x61 <= x) && (x <= 0x7a)) return x - (0x61 - 10);
	return NaN;
}

function toDigitChar(x) {
	if ((0 <= x) && (x <= 9)) return fromCharCode(x + 0x30);
	if ((10 <= x) && (x <= 35)) return fromCharCode(x + (0x61 - 10)); // 'a' - 'z'
	debugger;
}

function toUpperDigitChar(x) {
	if ((0 <= x) && (x <= 9)) return fromCharCode(x + 0x30);
	if ((10 <= x) && (x <= 35)) return fromCharCode(x + (0x41 - 10)); // 'A' - 'Z'
	debugger;
}

function isDigitChar(c) {
	return (mvDigitChar(c) >= 0);
}

function isDecimalDigitChar(c) {
	return (mvDigitChar(c) <= 9);
}

function isOctalDigitChar(c) {
	return (mvDigitChar(c) <= 7);
}

function isHexDigitChar(c) {
	return (mvDigitChar(c) <= 15);
}

function fixedWidth(x, n) {
	var buffer = [];
	while (n-- > 0) {
		buffer[n] = toDigitChar(x % 10);
		x = floor(x / 10);
	}
	return join(buffer);
}
