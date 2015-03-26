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

// ECMAScript 5.1: 15.10 RegExp Objects

function RegExp_Call(thisValue, argumentsList) {
	var pattern = argumentsList[0];
	var flags = argumentsList[1];
	var R = pattern;
	if (Type(R) === "Object" && R.Class === "RegExp" && flags === undefined) return R;
	return RegExp_Construct([ pattern, flags ]);
}

function RegExp_Construct(argumentsList) {
	var pattern = argumentsList[0];
	var flags = argumentsList[1];
	var R = pattern;
	if (Type(R) === "Object" && R.Class === "RegExp" && flags === undefined) {
		var P = R.pattern;
		var F = R.flags;
	}
	else if (Type(R) === "Object" && R.Class === "RegExp" && flags !== undefined) throw VMTypeError();
	else {
		if (pattern === undefined) {
			var P = "";
		}
		else {
			var P = ToString(pattern);
		}
		if (flags === undefined) {
			var F = "";
		}
		else {
			var F = ToString(flags);
		}
	}
	var Match = theRegExpFactory.compile(P, F);
	var NCapturingParens = theRegExpFactory.getNCapturingParens();
	var S = theRegExpFactory.escapePattern(P);
	var obj = VMObject();
	setAllTheInternalMethods(obj);
	obj.Prototype = builtin_RegExp_prototype;
	obj.Class = "RegExp";
	obj.Extensible = true;
	obj.pattern = P;
	obj.flags = F;
	obj.Match = Match;
	obj.NCapturingParens = NCapturingParens;
	defineFinal(obj, "source", S);
	defineFinal(obj, "global", isIncluded('g', F));
	defineFinal(obj, "ignoreCase", isIncluded('i', F));
	defineFinal(obj, "multiline", isIncluded('m', F));
	defineWritable(obj, "lastIndex", 0);
	return obj;
}

function RegExp_prototype_exec(thisValue, argumentsList) {
	var string = argumentsList[0];
	var R = thisValue;
	if (Type(R) !== "Object" || R.Class !== "RegExp") throw VMTypeError();
	var S = ToString(string);
	var length = S.length;
	var lastIndex = R.Get("lastIndex");
	var i = ToInteger(lastIndex);
	var global = R.Get("global");
	if (global === false) {
		var i = 0;
	}
	var matchSucceeded = false;
	while (matchSucceeded === false) {
		if ((i < 0) || (i > length)) {
			R.Put("lastIndex", 0, true);
			return null;
		}
		var r = R.Match(S, i);
		if (r === failure) {
			var i = i + 1;
		}
		else {
			matchSucceeded = true;
		}
	}
	var e = r.endIndex;
	if (global === true) {
		R.Put("lastIndex", e, true);
	}
	var n = R.NCapturingParens;
	var A = Array_Construct([]);
	var matchIndex = i;
	A.DefineOwnProperty("index", PropertyDescriptor({
		Value : matchIndex,
		Writable : true,
		Enumerable : true,
		Configurable : true
	}), true);
	A.DefineOwnProperty("input", PropertyDescriptor({
		Value : S,
		Writable : true,
		Enumerable : true,
		Configurable : true
	}), true);
	A.DefineOwnProperty("length", PropertyDescriptor({
		Value : n + 1
	}), true);
	var matchedSubstr = S.substring(i, e);
	A.DefineOwnProperty("0", PropertyDescriptor({
		Value : matchedSubstr,
		Writable : true,
		Enumerable : true,
		Configurable : true
	}), true);
	for (var i = 1; i <= n; i++) {
		var captureI = r.captures[i];
		A.DefineOwnProperty(ToString(i), PropertyDescriptor({
			Value : captureI,
			Writable : true,
			Enumerable : true,
			Configurable : true
		}), true);
	}
	return A;
}

function RegExp_prototype_test(thisValue, argumentsList) {
	var match = RegExp_prototype_exec(thisValue, argumentsList);
	if (match !== null) return true;
	return false;
}

function RegExp_prototype_toString(thisValue, argumentsList) {
	var R = thisValue;
	if (Type(R) !== "Object" || R.Class !== "RegExp") throw VMTypeError();
	return "/" + R.Get("source") + "/" + (R.Get("global") ? "g" : "") + (R.Get("ignoreCase") ? "i" : "") + (R.Get("multiline") ? "m" : "");
}

function State(endIndex, captures) {
	return {
		endIndex : endIndex,
		captures : captures
	};
}

var theRegExpFactory = RegExpFactory();

function RegExpFactory() {
	return {
		compile : compile,
		escapePattern : escapePattern,
		getNCapturingParens : function() {
			return NCapturingParens;
		},
	};

	var source;
	var current;
	var lookahead;
	var lookahead2;
	var currentPos;

	var leftCapturingParentheses;
	var oneCharacterOfCharSet;

	var Input;
	var InputLength;
	var NCapturingParens;
	var IgnoreCase;
	var Multiline;

	function compile(P, F) {
		countNCapturingParens(P);
		setPattern(P);
		setFlags(F);
		leftCapturingParentheses = 0;
		var Match = evaluatePattern();
		if (current !== undefined) throw VMSyntaxError();
		assert(NCapturingParens === leftCapturingParentheses);
		return Match;
	}

	function evaluatePattern() {
		var savedNCapturingParens = NCapturingParens;
		var savedIgnoreCase = IgnoreCase;
		var savedMultiline = Multiline;
		var m = evaluateDisjunction();
		return function(str, index) {
			Input = str;
			InputLength = Input.length;
			NCapturingParens = savedNCapturingParens;
			IgnoreCase = savedIgnoreCase;
			Multiline = savedMultiline;
			var c = function(x) {
				return x;
			}
			var cap = [];
			var x = State(index, []);
			return m(x, c);
		}
	}

	function evaluateDisjunction() {
		var m1 = evaluateAlternative();
		if (current !== '|') return m1;
		proceed();
		var m2 = evaluateDisjunction();
		return function(x, c) {
			var r = m1(x, c);
			if (r !== failure) return r;
			return m2(x, c);
		}
	}

	function evaluateAlternative() {
		var m1 = function(x, c) {
			return c(x);
		};
		while (true) {
			var m2 = evaluateTerm();
			if (m2 === undefined) return m1;
			var m1 = concat(m1, m2);
		}
		function concat(m1, m2) {
			return function(x, c) {
				var d = function(y) {
					return m2(y, c);
				};
				return m1(x, d);
			}
		}
	}

	function evaluateTerm() {
		var parenIndex = leftCapturingParentheses;
		var t = evaluateAssertionTester();
		if (t !== undefined) return function(x, c) {
			var r = t(x);
			if (r === false) return failure;
			return c(x);
		};
		var m = evaluateAssertion();
		if (m !== undefined) return m;
		var m = evaluateAtom();
		if (m === undefined) return undefined;
		return evaluateQuantifierWithAtom(m, parenIndex);
	}

	function RepeatMatcher(m, min, max, greedy, x, c, parenIndex, parenCount) {
		if (max === 0) return c(x);
		var d = function(y) {
			if (min === 0 && y.endIndex === x.endIndex) return failure;
			if (min === 0) {
				var min2 = 0;
			}
			else {
				var min2 = min - 1;
			}
			if (max === Infinity) {
				var max2 = Infinity;
			}
			else {
				var max2 = max - 1;
			}
			return RepeatMatcher(m, min2, max2, greedy, y, c, parenIndex, parenCount);
		}
		var cap = arraycopy(x.captures);
		for (var k = parenIndex + 1; k <= parenIndex + parenCount; k++) {
			cap[k] = undefined;
		}
		var e = x.endIndex;
		var xr = State(e, cap);
		if (min !== 0) return m(xr, d);
		if (greedy === false) {
			var z = c(x);
			if (z !== failure) return z;
			return m(xr, d);
		}
		var z = m(xr, d);
		if (z !== failure) return z;
		return c(x);
	}

	function evaluateAssertionTester() {
		if (current === '^') {
			proceed();
			return function(x) {
				var e = x.endIndex;
				if (e === 0) return true;
				if (Multiline === false) return false;
				if (isLineTerminator(Input[e - 1])) return true;
				return false;
			};
		}
		if (current === '$') {
			proceed();
			return function(x) {
				var e = x.endIndex;
				if (e === InputLength) return true;
				if (Multiline === false) return false;
				if (isLineTerminator(Input[e])) return true;
				return false;
			};
		}
		if (current === '\\' && lookahead === 'b') {
			proceed(2);
			return function(x) {
				var e = x.endIndex;
				var a = IsWordChar(e - 1);
				var b = IsWordChar(e);
				if (a === true && b === false) return true;
				if (a === false && b === true) return true;
				return false;
			}
		}
		if (current === '\\' && lookahead === 'B') {
			proceed(2);
			return function(x) {
				var e = x.endIndex;
				var a = IsWordChar(e - 1);
				var b = IsWordChar(e);
				if (a === true && b === false) return false;
				if (a === false && b === true) return false;
				return true;
			}
		}
		return undefined;
	}

	function evaluateAssertion() {
		if (current === '(' && lookahead === '?' && lookahead2 === '=') {
			proceed(3);
			var m = evaluateDisjunction();
			expecting(')');
			return function(x, c) {
				var d = function(x) {
					return x;
				}
				var r = m(x, d);
				if (r === failure) return failure;
				var y = r;
				var cap = y.captures;
				var xe = x.endIndex;
				var z = State(xe, cap);
				return c(z);
			}
		}
		if (current === '(' && lookahead === '?' && lookahead2 === '!') {
			proceed(3);
			var m = evaluateDisjunction();
			expecting(')');
			return function(x, c) {
				var d = function(x) {
					return x;
				}
				var r = m(x, d);
				if (r !== failure) return failure;
				return c(x);
			}
		}
		return undefined;
	}

	function IsWordChar(e) {
		if (e === -1 || e === InputLength) return false;
		var c = Input[e];
		if (c === '_' || isDigitChar(c)) return true;
		return false;
	}

	function evaluateQuantifierWithAtom(m, parenIndex) {
		var parenCount = leftCapturingParentheses - parenIndex;
		var min, max, greedy;
		if (current === '*') {
			proceed();
			min = 0;
			max = Infinity;
		}
		else if (current === '+') {
			proceed();
			min = 1;
			max = Infinity;
		}
		else if (current === '?') {
			proceed();
			min = 0;
			max = 1;
		}
		else if (current === '{') {
			proceed();
			min = evaluateDecimalDigits();
			if (current === '}') {
				proceed();
				max = min;
			}
			else if (current === ',' && lookahead === '}') { // '{'
				proceed(2);
				max = Infinity;
			}
			else if (current === ',') {
				proceed();
				max = evaluateDecimalDigits();
				expecting('}'); // '{'
			}
			else throw VMSyntaxError();
		}
		else return m;
		var greedy = true;
		if (current === '?') {
			proceed();
			var greedy = false;
		}
		if (isFinite(max) && (max < min)) throw VMSyntaxError();
		return function(x, c) {
			return RepeatMatcher(m, min, max, greedy, x, c, parenIndex, parenCount);
		};
	}

	function evaluateDecimalDigits() {
		if (isDecimalDigitChar(current) === false) throw VMSyntaxError();
		var x = 0;
		while (isDecimalDigitChar(current)) {
			x = x * 10 + mvDigitChar(current);
			proceed();
		}
		return x;
	}

	function evaluateAtom() {
		if (current === undefined) return undefined;
		if (current === '.') {
			proceed();
			return CharacterSetMatcher(function(cc) {
				if (isLineTerminator(cc)) return false;
				return true;
			}, false);
		}
		if (current === '\\') {
			proceed();
			return evaluateAtomEscape();
		}
		if (current === '[') {
			proceed();
			return evaluateCharacterClassMatcher();
		}
		if (current === '(' && lookahead === '?' && lookahead2 === ':') {
			proceed(3);
			var m = evaluateDisjunction();
			expecting(')');
			return m;
		}
		if (current === '(') {
			proceed();
			var parenIndex = leftCapturingParentheses++;
			var m = evaluateDisjunction();
			expecting(')');
			return function(x, c) {
				var d = function(y) {
					var cap = arraycopy(y.captures);
					var xe = x.endIndex;
					var ye = y.endIndex;
					var s = Input.substring(xe, ye);
					cap[parenIndex + 1] = s;
					var z = State(ye, cap);
					return c(z);
				};
				return m(x, d);
			};
		}
		if (STRICT_CONFORMANCE) {
			if (current === ']') return undefined;
		}
		if (isIncluded(current, "^$\\.*+?()[{}|")) return undefined;
		var A = oneElementCharSet(proceed());
		return CharacterSetMatcher(A, false);
	}

	function oneElementCharSet(ch) {
		oneCharacterOfCharSet = ch;
		return function(cc) {
			if (Canonicalize(ch) === cc) return true;
			return false;
		};
	}

	function CharacterSetMatcher(A, invert) {
		return function(x, c) {
			var e = x.endIndex;
			if (e === InputLength) return failure;
			var ch = Input[e];
			var cc = Canonicalize(ch);
			if (invert === false) {
				if (A(cc) === false) return failure;
			}
			else if (A(cc) === true) return failure;
			var cap = x.captures;
			var y = State(e + 1, cap);
			return c(y);
		};
	}

	function Canonicalize(ch) {
		if (IgnoreCase === false) return ch;
		var u = ch.toUpperCase();
		if (u.length !== 1) return ch;
		var cu = u;
		if ((toCharCode(ch) >= 128) && (toCharCode(cu) < 128)) return ch;
		return cu;
	}

	function evaluateAtomEscape() {
		var E = evaluateDecimalEscape();
		if (E !== undefined) {
			if (Type(E) === "String") {
				var ch = E;
				var A = oneElementCharSet(ch);
				return CharacterSetMatcher(A, false);
			}
			var n = E;
			if (n > NCapturingParens) {
				if (STRICT_CONFORMANCE) throw VMSyntaxError();
				return function(x, c) {
					return failure;
				}
			}

			return function(x, c) {
				var cap = x.captures;
				var s = cap[n];
				if (s === undefined) return c(x);
				var e = x.endIndex;
				var len = s.length;
				var f = e + len;
				if (f > InputLength) return failure;
				for (var i = 0; i < len; i++) {
					if (Canonicalize(s[i]) !== Canonicalize(Input[e + i])) return failure;
				}
				var y = State(f, cap);
				return c(y);
			}
		}
		if (isIncluded(current, "dDsSwW")) {
			var A = evaluateCharacterClassEscape();
			return CharacterSetMatcher(A, false);
		}
		var ch = evaluateCharacterEscape();
		if (ch === undefined) return function(x, c) {
			return failure;
		};
		var A = oneElementCharSet(ch);
		return CharacterSetMatcher(A, false);
	}

	function evaluateCharacterEscape() {
		var c = proceed();
		switch (c) {
		case 't':
			return '\u0009';
		case 'n':
			return '\u000A';
		case 'v':
			return '\u000B';
		case 'f':
			return '\u000C';
		case 'r':
			return '\u000D';
		case 'c':
			if ((mvDigitChar(current) >= 10) === false) {
				if (STRICT_CONFORMANCE) throw VMSyntaxError();
				if (isIncluded(current, "/^$\\.*+?()[]{}|")) throw VMSyntaxError();
				return undefined;
			}
			var ch = proceed();
			var i = toCharCode(ch);
			var j = i % 32;
			return fromCharCode(j);
		case 'x':
			var x = 0;
			for (var i = 0; i < 2; i++) {
				if (!isHexDigitChar(current)) {
					if (STRICT_CONFORMANCE) throw VMSyntaxError();
					return undefined;
				}
				x = (x << 4) + mvDigitChar(current);
				proceed();
			}
			return fromCharCode(x);
		case 'u':
			var x = 0;
			for (var i = 0; i < 4; i++) {
				if (!isHexDigitChar(current)) {
					if (STRICT_CONFORMANCE) throw VMSyntaxError();
					return undefined;
				}
				x = (x << 4) + mvDigitChar(current);
				proceed();
			}
			return fromCharCode(x);
		case '\u200d': // <ZWJ>
		case '\u200c': // <ZWNJ>
			return c;
		}
		if (STRICT_CONFORMANCE) {
			if (isIdentifierPart(c)) throw VMSyntaxError();
		}
		return c;
	}

	function evaluateDecimalEscape() {
		if (isDecimalDigitChar(current) === false) return undefined;
		if (current === '0') {
			proceed();
			if (isDecimalDigitChar(current)) throw VMSyntaxError();
			return '\u0000';
		}
		var x = 0;
		while (isDecimalDigitChar(current)) {
			x = x * 10 + mvDigitChar(current);
			proceed();
		}
		return x;
	}

	function evaluateOctalEscape() {
		if (isDecimalDigitChar(current) === false) return undefined;
		if (current === '0') {
			proceed();
			if (isDecimalDigitChar(current)) throw VMSyntaxError();
			return '\u0000';
		}
		if (STRICT_CONFORMANCE) throw VMSyntaxError();
		var x = 0;
		while (isDecimalDigitChar(current)) {
			if (current === '8' || current === '9') throw VMSyntaxError();
			x = x * 8 + mvDigitChar(current);
			proceed();
		}
		return fromCharCode(x);
	}

	function evaluateCharacterClassEscape() {
		switch (proceed()) {
		case 'd':
			return function(cc) {
				if (isDecimalDigitChar(cc)) return true;
				return false;
			};
		case 'D':
			return function(cc) {
				if (isDecimalDigitChar(cc)) return false;
				return true;
			};
		case 's':
			return function(cc) {
				if (isWhiteSpace(cc) || isLineTerminator(cc)) return true;
				return false;
			};
		case 'S':
			return function(cc) {
				if (isWhiteSpace(cc) || isLineTerminator(cc)) return false;
				return true;
			};
		case 'w':
			return function(cc) {
				if (cc === '_' || isDigitChar(cc)) return true;
				return false;
			};
		case 'W':
			return function(cc) {
				if (cc === '_' || isDigitChar(cc)) return false;
				return true;
			};
		}
		assert(false);
	}

	function evaluateCharacterClassMatcher() {
		if (current === '^') {
			proceed();
			var A = evaluateClassRanges();
			return CharacterSetMatcher(A, true);
		}
		var A = evaluateClassRanges();
		return CharacterSetMatcher(A, false);
	}

	function evaluateClassRanges() {
		var charSets = [];
		while (current !== ']') {
			var A = evaluateClassAtom();
			var a = oneCharacterOfCharSet;
			if (current === '-') {
				proceed();
				if (current === ']') {
					charSets.push(A);
					charSets.push(oneElementCharSet('-'));
				}
				else {
					var B = evaluateClassAtom();
					var b = oneCharacterOfCharSet;
					if (a === undefined || b === undefined) {
						if (STRICT_CONFORMANCE) throw VMSyntaxError();
						charSets.push(A);
						charSets.push(oneElementCharSet('-'));
						charSets.push(B);
					}
					else {
						var i = toCharCode(a);
						var j = toCharCode(b);
						if (i > j) throw VMSyntaxError();
						var D = rangeCharSet(i, j);
						charSets.push(D);
					}
				}
			}
			else {
				charSets.push(A);
			}
		}
		proceed();
		return unionCharSet(charSets);
	}

	function rangeCharSet(i, j) {
		return function(cc) {
			if (IgnoreCase === false) {
				var k = toCharCode(cc);
				if ((i <= k) && (k <= j)) return true;
				return false;
			}
			else {
				for (var k = i; k <= j; k++) {
					var ch = fromCharCode(k);
					if (Canonicalize(ch) === cc) return true;
				}
				return false;
			}
		};
	}

	function unionCharSet(charSets) {
		return function(cc) {
			for (var i = 0; i < charSets.length; i++) {
				var A = charSets[i];
				if (A(cc) === true) return true;
			}
			return false;
		};
	}

	function evaluateClassAtom() {
		oneCharacterOfCharSet = undefined;
		if (current == '-') {
			proceed();
			return oneElementCharSet('-');
		}
		if (current == '\\') {
			proceed();
			var E = evaluateOctalEscape();
			if (E !== undefined) {
				var ch = E;
				return oneElementCharSet(ch);
			}
			if (current == 'b') {
				proceed();
				return oneElementCharSet('\u0008');
			}
			if (current == 'B') throw VMSyntaxError();
			if (isIncluded(current, "dDsSwW")) return evaluateCharacterClassEscape();
			var ch = evaluateCharacterEscape();
			if (ch === undefined) return function(cc) {
				return false;
			};
			var A = oneElementCharSet(ch);
			return A;
		}
		var ch = proceed();
		return oneElementCharSet(ch);
	}

	function countNCapturingParens(P) {
		setPattern(P);
		NCapturingParens = 0;
		var buffer = [];
		while (current !== undefined) {
			if (current === '(' && lookahead !== '?') {
				NCapturingParens++;
				proceed();
			}
			else if (current === '\\' && lookahead !== undefined) {
				proceed(2);
			}
			else if (current === '[') {
				proceed();
				while (current !== ']') {
					if (current === '\\' && lookahead !== undefined) {
						proceed(2);
					}
					else {
						proceed();
					}
				}
			}
			else {
				proceed();
			}
		}
	}

	function escapePattern(P) {
		setPattern(P);
		if (current === undefined) return "(?:)";
		var buffer = [];
		while (current !== undefined) {
			if (current === '/') {
				buffer.push('\\');
				buffer.push(current);
				proceed();
			}
			else if (current === '\\' && lookahead !== undefined) {
				buffer.push(current);
				buffer.push(lookahead);
				proceed(2);
			}
			else if (current === '[') {
				buffer.push(current);
				proceed();
				while (current !== ']') {
					if (current === '\\' && lookahead !== undefined) {
						buffer.push(current);
						buffer.push(lookahead);
						proceed(2);
					}
					else {
						buffer.push(proceed());
					}
				}
			}
			else {
				buffer.push(proceed());
			}
		}
		return join(buffer);
	}

	function expecting(c) {
		if (c !== current) throw VMSyntaxError();
		proceed();
	}

	function proceed(count) {
		var c = current;
		if (count === undefined) {
			count = 1;
		}
		for (var i = 0; i < count; i++) {
			if (current === undefined) throw VMSyntaxError();
			currentPos++;
			current = lookahead;
			lookahead = lookahead2;
			lookahead2 = source[currentPos + 2];
		}
		return c;
	}

	function setPattern(pattern) {
		source = pattern;
		currentPos = 0;
		current = source[0];
		lookahead = source[1];
		lookahead2 = source[2];
	}

	function setFlags(flags) {
		IgnoreCase = false;
		Multiline = false;
		var Global = false;
		for (var i = 0; i !== flags.length; i++) {
			var f = flags[i];
			if (f === 'g') {
				if (Global) throw VMSyntaxError();
				Global = true;
			}
			else if (f === 'i') {
				if (IgnoreCase) throw VMSyntaxError();
				IgnoreCase = true;
			}
			else if (f === 'm') {
				if (Multiline) throw VMSyntaxError();
				Multiline = true;
			}
			else throw VMSyntaxError();
		}
	}
}
