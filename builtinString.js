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

// ECMAScript 5.1: 15.5 String Objects

function String_Call(thisValue, argumentsList) {
	var value = argumentsList[0];
	if (argumentsList.length == 0) return "";
	return ToString(value);
}

function String_Construct(argumentsList) {
	var value = String_Call(null, argumentsList);
	var obj = VMObject();
	setAllTheInternalMethods(obj);
	obj.Prototype = builtin_String_prototype;
	obj.Class = "String";
	obj.Extensible = true;
	obj.PrimitiveValue = value;
	obj.GetOwnProperty = StringObject_GetOwnProperty;
	obj.enumerator = StringObject_enumerator;
	defineFinal(obj, "length", value.length);
	return obj;
}

function String_fromCharCode(thisValue, argumentsList) {
	var buffer = [];
	for (var i = 0; i < argumentsList.length; i++) {
		buffer.push(fromCharCode(ToUint16(argumentsList[i])));
	}
	var S = join(buffer);
	return S;
}

function String_prototype_toString(thisValue, argumentsList) {
	return String_prototype_valueOf(thisValue);
}

function String_prototype_valueOf(thisValue, argumentsList) {
	if (Type(thisValue) === "String") return thisValue;
	if (Type(thisValue) === "Object" && thisValue.Class === "String") return thisValue.PrimitiveValue;
	throw VMTypeError();
}

function String_prototype_charAt(thisValue, argumentsList) {
	var pos = argumentsList[0];
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	var position = ToInteger(pos);
	var size = S.length;
	if ((position < 0) || (position >= size)) return "";
	return S[position];
}

function String_prototype_charCodeAt(thisValue, argumentsList) {
	var pos = argumentsList[0];
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	var position = ToInteger(pos);
	var size = S.length;
	if ((position < 0) || (position >= size)) return NaN;
	return toCharCode(S[position]);
}

function String_prototype_concat(thisValue, argumentsList) {
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	var args = argumentsList;
	var R = S;
	for (var i = 0; i < args.length; i++) {
		var next = args[i];
		var R = R + ToString(next);
	}
	return R;
}

function String_prototype_indexOf(thisValue, argumentsList) {
	var searchString = argumentsList[0];
	var position = argumentsList[1];
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	var searchStr = ToString(searchString);
	var pos = ToInteger(position);
	var len = S.length;
	var start = min(max(pos, 0), len);
	var searchLen = searchStr.length;
	for (var k = start; k + searchLen <= len; k++) {
		if (searchStr === S.substring(k, k + searchLen)) return k;
	}
	return -1;
	return S.indexOf(searchStr, start);
}

function String_prototype_lastIndexOf(thisValue, argumentsList) {
	var searchString = argumentsList[0];
	var position = argumentsList[1];
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	var searchStr = ToString(searchString);
	var numPos = ToNumber(position);
	if (isNaN(numPos)) {
		var pos = +Infinity;
	}
	else {
		var pos = ToInteger(numPos);
	}
	var len = S.length;
	var start = min(max(pos, 0), len);
	var searchLen = searchStr.length;
	for (var k = start; k >= 0; k--) {
		if ((k + searchLen <= len) && searchStr === S.substring(k, k + searchLen)) return k;
	}
	return -1;
}

function String_prototype_localeCompare(thisValue, argumentsList) {
	var that = argumentsList[0];
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	var That = ToString(that);
	return S.localeCompare(That);
}

function String_prototype_match(thisValue, argumentsList) {
	var regexp = argumentsList[0];
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	if (Type(regexp) === "Object" && regexp.Class === "RegExp") {
		var rx = regexp;
	}
	else {
		var rx = RegExp_Construct([ regexp ]);
	}
	var global = rx.Get("global");
	if (global !== true) return RegExp_prototype_exec(rx, [ S ]);
	else {
		rx.Put("lastIndex", 0);
		var A = Array_Construct([]);
		var previousLastIndex = 0;
		var n = 0;
		var lastMatch = true;
		while (lastMatch === true) {
			var result = RegExp_prototype_exec(rx, [ S ]);
			if (result === null) {
				lastMatch = false;
			}
			else {
				var thisIndex = rx.Get("lastIndex");
				if (thisIndex === previousLastIndex) {
					rx.Put("lastIndex", thisIndex + 1);
					previousLastIndex = thisIndex + 1;
				}
				else {
					previousLastIndex = thisIndex;
				}
				var matchStr = result.Get("0");
				A.DefineOwnProperty(ToString(n), PropertyDescriptor({
					Value : matchStr,
					Writable : true,
					Enumerable : true,
					configurable : true
				}), false);
				n++;
			}
		}
	}
	if (n === 0) return null;
	return A;
}

function String_prototype_replace(thisValue, argumentsList) {
	var searchValue = argumentsList[0];
	var replaceValue = argumentsList[1];
	CheckObjectCoercible(thisValue);
	var string = ToString(thisValue);
	if (Type(searchValue) === "Object" && searchValue.Class === "RegExp") {
		var result = "";
		var endIndex = 0;
		var global = searchValue.Get("global");
		if (global === true) {
			searchValue.Put("lastIndex", 0);
			var previousLastIndex = 0;
		}
		while (true) {
			var matched = RegExp_prototype_exec(searchValue, [ string ]);
			if (matched === null) {
				break;
			}
			if (global === true) {
				var thisIndex = searchValue.Get("lastIndex");
				if (thisIndex === previousLastIndex) {
					searchValue.Put("lastIndex", thisIndex + 1);
					previousLastIndex = thisIndex + 1;
				}
				else {
					previousLastIndex = thisIndex;
				}
			}
			var indx = matched.Get("index");
			var len = matched.Get("length");
			var args = [];
			for (var i = 0; i < len; i++) {
				args[i] = matched.Get(ToString(i));
			}
			var newstring = convertingReplaceValue(indx, args);
			result = result + string.substring(endIndex, indx) + newstring;
			endIndex = indx + args[0].length;
			if (global !== true) {
				break;
			}
		}
		return result + string.substring(endIndex);
	}
	else {
		var searchString = ToString(searchValue);
		var indx = String_prototype_indexOf(string, [ searchString ]);
		if (indx < 0) return string;
		var newstring = convertingReplaceValue(indx, [ searchString ]);
		var endIndex = indx + searchString.length;
		return string.substring(0, indx) + newstring + string.substring(endIndex);
	}

	function convertingReplaceValue(indx, args) {
		var m = args.length - 1;
		if (Type(replaceValue) === "Object" && replaceValue.Class === "Function") {
			var newstring = replaceValue.Call(undefined, args.concat(indx, string));
		}
		else {
			var newstring = ToString(replaceValue);
			var buffer = [];
			for (var i = 0; i < newstring.length; i++) {
				var c = newstring[i];
				if (c === '$') {
					var a = newstring[i + 1];
					if (a === '$') {
						buffer.push('$');
						i++;
					}
					else if (a === '&') {
						buffer.push(args[0]);
						i++;
					}
					else if (a === "`") {
						buffer.push(string.substring(0, indx));
						i++;
					}
					else if (a === "'") {
						buffer.push(string.substring(indx + args[0].length));
						i++;
					}
					else {
						var x = mvDigitChar(a);
						var y = mvDigitChar(newstring[i + 2]);
						if (x === 0 && y === 0) {
							buffer.push('$');
						}
						else if ((0 <= x) && (x <= 9) && (0 <= y) && (y <= 9)) {
							var nn = x * 10 + y;
							if (nn <= m) {
								var c = args[nn];
								if (c !== undefined) {
									buffer.push(c);
									i += 2;
								}
							}
							else // implementation defined behavior
							if ((0 < x) && (x <= m)) {
								var c = args[x];
								if (c !== undefined) {
									buffer.push(c);
								}
								i++;
							}
							else {
								i += 2;
							}
						}
						else if ((1 <= x) && (x <= 9)) {
							if (x <= m) {
								var c = args[x];
								if (c !== undefined) {
									buffer.push(c);
								}
								i++;
							}
							else {
								i++;
							}
						}
						else {
							buffer.push('$');
						}
					}
				}
				else {
					buffer.push(c);
				}
			}
			var newstring = join(buffer);
		}
		return newstring;
	}
}

function String_prototype_search(thisValue, argumentsList) {
	var regexp = argumentsList[0];
	CheckObjectCoercible(thisValue);
	var string = ToString(thisValue);
	if (Type(regexp) === "Object" && regexp.Class === "RegExp") {
		var rx = regexp;
	}
	else {
		var rx = RegExp_Construct([ regexp ]);
	}
	var result = -1;
	for (var i = 0; i <= string.length; i++) {
		var r = rx.Match(string, i);
		if (r !== failure) {
			var result = i;
			break;
		}
	}
	return result;
}

function String_prototype_slice(thisValue, argumentsList) {
	var start = argumentsList[0];
	var end = argumentsList[1];
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	var len = S.length;
	var intStart = ToInteger(start);
	if (end === undefined) {
		var intEnd = len;
	}
	else {
		var intEnd = ToInteger(end);
	}
	if (intStart < 0) {
		var from = max(len + intStart, 0);
	}
	else {
		var from = min(intStart, len);
	}
	if (intEnd < 0) {
		var to = max(len + intEnd, 0);
	}
	else {
		var to = min(intEnd, len);
	}
	var span = max(to - from, 0);
	return S.substring(from, from + span);
}

function String_prototype_split(thisValue, argumentsList) {
	var separator = argumentsList[0];
	var limit = argumentsList[1];
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	var A = Array_Construct([]);
	var lengthA = 0;
	if (limit === undefined) {
		var lim = 0xffffffff;
	}
	else {
		var lim = ToUint32(limit);
	}
	var s = S.length;
	var p = 0;
	if (Type(separator) === "Object" && separator.Class === "RegExp") {
		var R = separator;
	}
	else {
		var R = ToString(separator);
	}
	if (lim === 0) return A;
	if (separator === undefined) {
		A.DefineOwnProperty("0", PropertyDescriptor({
			Value : S,
			Writable : true,
			Enumerable : true,
			Configurable : true
		}), false);
		return A;
	}
	if (s === 0) {
		var z = SplitMatch(S, 0, R);
		if (z !== failure) return A;
		A.DefineOwnProperty("0", PropertyDescriptor({
			Value : S,
			Writable : true,
			Enumerable : true,
			Configurable : true
		}), false);
		return A;
	}
	var q = p;
	while (q !== s) {
		var z = SplitMatch(S, q, R);
		if (z === failure) {
			var q = q + 1;
		}
		else {
			var e = z.endIndex;
			var cap = z.captures;
			if (e === p) {
				var q = q + 1;
			}
			else {
				var T = S.substring(p, q);
				A.DefineOwnProperty(ToString(lengthA), PropertyDescriptor({
					Value : T,
					Writable : true,
					Enumerable : true,
					Configurable : true
				}), false);
				lengthA++;
				if (lengthA == lim) return A;
				var p = e;
				var i = 0;
				while (i !== cap.length) {
					var i = i + 1;
					A.DefineOwnProperty(ToString(lengthA), PropertyDescriptor({
						Value : cap[i],
						Writable : true,
						Enumerable : true,
						Configurable : true
					}), false);
					lengthA++;
					if (lengthA === lim) return A;
				}
				var q = p;
			}
		}
	}
	var T = S.substring(p, s);
	A.DefineOwnProperty(ToString(lengthA), PropertyDescriptor({
		Value : T,
		Writable : true,
		Enumerable : true,
		Configurable : true
	}), false);
	return A;

	function SplitMatch(S, q, R) {
		if (Type(R) === "Object" && R.Class === "RegExp") return R.Match(S, q);
		assert(Type(R) === "String");
		var r = R.length;
		var s = S.length;
		if (q + r > s) return failure;
		if (S.substring(q, q + r) !== R) return failure;
		var cap = [];
		return State(q + r, cap);
	}
}

function String_prototype_substring(thisValue, argumentsList) {
	var start = argumentsList[0];
	var end = argumentsList[1];
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	var len = S.length;
	var intStart = ToInteger(start);
	if (end === undefined) {
		var intEnd = len;
	}
	else {
		var intEnd = ToInteger(end);
	}
	var finalStart = min(max(intStart, 0), len);
	var finalEnd = min(max(intEnd, 0), len);
	var from = min(finalStart, finalEnd);
	var to = max(finalStart, finalEnd);
	return S.substring(from, to);
}

function String_prototype_toLowerCase(thisValue, argumentsList) {
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	return S.toLowerCase();
}

function String_prototype_toLocaleLowerCase(thisValue, argumentsList) {
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	return S.toLocaleLowerCase();
}

function String_prototype_toUpperCase(thisValue, argumentsList) {
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	return S.toUpperCase();
}

function String_prototype_toLocaleUpperCase(thisValue, argumentsList) {
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	return S.toLocaleUpperCase();
}

function String_prototype_trim(thisValue, argumentsList) {
	CheckObjectCoercible(thisValue);
	var S = ToString(thisValue);
	var from = 0;
	while (from !== S.length && (isWhiteSpace(S[from]) || isLineTerminator(S[from]))) {
		from++;
	}
	var to = S.length;
	while (to !== from && (isWhiteSpace(S[to - 1]) || isLineTerminator(S[to - 1]))) {
		to--;
	}
	return S.substring(from, to);
}

function String_prototype_substr(thisValue, argumentsList) {
	var start = argumentsList[0];
	var length = argumentsList[1];
	// specification Bug 350
	CheckObjectCoercible(thisValue);
	// end of bug fix
	var Result1 = ToString(thisValue);
	var Result2 = ToInteger(start);
	if (length === undefined) {
		var Result3 = Infinity;
	}
	else {
		var Result3 = ToInteger(length);
	}
	var Result4 = Result1.length;
	if (Result2 >= 0) {
		var Result5 = Result2;
	}
	else {
		var Result5 = max(Result4 + Result2, 0);
	}
	var Result6 = min(max(Result3, 0), Result4 - Result5);
	if (Result6 <= 0) return "";
	return Result1.substring(Result5, Result5 + Result6);
}

function StringObject_GetOwnProperty(P) {
	var S = this;
	var desc = default_GetOwnProperty.call(S, P);
	if (desc !== undefined) return desc;
	if (ToString(abs(ToInteger(P))) !== P) return undefined;
	var str = S.PrimitiveValue;
	var index = ToInteger(P);
	var len = str.length;
	if (len <= index) return undefined;
	var resultStr = str[index];
	return PropertyDescriptor({
		Value : resultStr,
		Enumerable : true,
		Writable : false,
		Configurable : false
	});
}

function StringObject_enumerator(ownOnly, enumerableOnly) {
	var S = this;
	var next = intrinsic_enumerator(S, ownOnly, enumerableOnly);
	var str = S.PrimitiveValue;
	var i = 0;
	var len = str.length;
	return function() {
		if (i < len) return ToString(i++);
		while (true) {
			var P = next();
			if (P === undefined) return undefined;
			var index = ToInteger(P);
			if ((0 <= index) && (index < len)) {
				if (ToString(index) === P) {
					continue;
				}
			}
			return P;
		}
	}
}
