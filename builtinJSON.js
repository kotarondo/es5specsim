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

// ECMAScript 5.1: 15.12 The JSON Object

function JSON_parse(thisValue, argumentsList) {
	var text = argumentsList[0];
	var reviver = argumentsList[1];
	var JText = ToString(text);
	var unfiltered = theJSONParser.readJSONText(JText);
	if (IsCallable(reviver) === true) {
		var root = Object_Construct([]);
		root.DefineOwnProperty("", PropertyDescriptor({
			Value : unfiltered,
			Writable : true,
			Enumerable : true,
			Configurable : true
		}), false);
		return Walk(root, "");
	}
	else return unfiltered;

	function Walk(holder, name) {
		var val = holder.Get(name);
		if (Type(val) === "Object") {
			if (val.Class === "Array") {
				var I = 0;
				var len = val.Get("length");
				while (I < len) {
					var newElement = Walk(val, ToString(I));
					if (newElement === undefined) {
						val.Delete(ToString(I), false);
					}
					else {
						val.DefineOwnProperty(ToString(I), PropertyDescriptor({
							Value : newElement,
							Writable : true,
							Enumerable : true,
							Configurable : true
						}), false);
					}
					I++;
				}
			}
			else {
				var keys = [];
				var next = value.enumerator(true, true);
				var P;
				while ((P = next()) !== undefined) {
					keys.push(P);
				}
				for (var i = 0; i < keys.length; i++) {
					var P = keys[i];
					var newElement = Walk(val, P);
					if (newElement === undefined) {
						val.Delete(P, false);
					}
					else {
						val.DefineOwnProperty(P, PropertyDescriptor({
							Value : newElement,
							Writable : true,
							Enumerable : true,
							Configurable : true
						}), false);
					}
				}
			}
		}
		return reviver.Call(holder, [ name, val ]);
	}
}

var theJSONParser = JSONParser();

function JSONParser() {
	return {
		readJSONText : readJSONText,
	};

	var source;
	var current;
	var currentPos;

	function readJSONText(text) {
		source = text;
		currentPos = 0;
		current = source[0];
		skipJSONWhiteSpaces();
		var value = readJSONValue();
		skipJSONWhiteSpaces();
		if (current !== undefined) throw VMSyntaxError();
		return value;
	}

	function readJSONValue() {
		if (current === 'n') return readJSONNullLiteral();
		else if (current === 't' || current === 'f') return readJSONBooleanLiteral();
		else if (current === '{') return readJSONObject();
		else if (current === '[') return readJSONArray();
		else if (current === '"') return readJSONString();
		return readJSONNumber();
	}

	function readJSONObject() {
		var obj = Object_Construct([]);
		expecting('{');
		skipJSONWhiteSpaces();
		if (current == '}') {
			proceed();
			return obj;
		}
		while (true) {
			skipJSONWhiteSpaces();
			var key = readJSONString();
			skipJSONWhiteSpaces();
			expecting(':');
			skipJSONWhiteSpaces();
			var value = readJSONValue();
			var desc = PropertyDescriptor({
				Value : value,
				Writable : true,
				Enumerable : true,
				Configurable : true
			});
			obj.DefineOwnProperty(key, desc, false);
			skipJSONWhiteSpaces();
			if (current == '}') {
				proceed();
				return obj;
			}
			expecting(',');
		}
	}

	function readJSONArray() {
		var obj = Array_Construct([]);
		expecting('[');
		skipJSONWhiteSpaces();
		if (current == ']') {
			proceed();
			return obj;
		}
		var index = 0;
		while (true) {
			skipJSONWhiteSpaces();
			var value = readJSONValue();
			var desc = PropertyDescriptor({
				Value : value,
				Writable : true,
				Enumerable : true,
				Configurable : true
			});
			obj.DefineOwnProperty(ToString(index), desc, false);
			index++;
			skipJSONWhiteSpaces();
			if (current == ']') {
				proceed();
				return obj;
			}
			expecting(',');
		}
	}

	function readJSONString() {
		expecting('"');
		var buffer = [];
		while (true) {
			if (current == undefined) throw VMSyntaxError();
			else if (current == '"') {
				proceed();
				return join(buffer);
			}
			else if (current == '\\') {
				var c = readJSONEscapeSequence();
				buffer.push(c);
			}
			else if (toCharCode(current) <= 0x001F) throw VMSyntaxError();
			else {
				buffer.push(current);
				proceed();
			}
		}
	}

	function readJSONEscapeSequence() {
		expecting('\\');
		var c = proceed();
		switch (c) {
		case '"':
		case '/':
		case '\\':
			return c;
		case 'b':
			return '\u0008';
		case 'f':
			return '\u000C';
		case 'n':
			return '\u000A';
		case 'r':
			return '\u000D';
		case 't':
			return '\u0009';
		case 'u':
			var x = 0;
			for (var i = 0; i < 4; i++) {
				if (!isHexDigitChar(current)) throw VMSyntaxError();
				x = (x << 4) + mvDigitChar(current);
				proceed();
			}
			return fromCharCode(x);
		}
		throw VMSyntaxError();
	}

	function readJSONNumber() {
		var startPos = currentPos;
		if (current === '-') {
			proceed();
		}
		if (current === '0') {
			proceed();
			if (isDecimalDigitChar(current)) throw VMSyntaxError();
		}
		else {
			if (!isDecimalDigitChar(current)) throw VMSyntaxError();
			while (isDecimalDigitChar(current)) {
				proceed();
			}
		}
		if (current === '.') {
			proceed();
			while (isDecimalDigitChar(current)) {
				proceed();
			}
		}
		if (current === 'E' || current === 'e') {
			proceed();
			if (current === '+' || current === '-') {
				proceed();
			}
			if (!isDecimalDigitChar(current)) throw VMSyntaxError();
			while (isDecimalDigitChar(current)) {
				proceed();
			}
		}
		if (startPos === currentPos) throw VMSyntaxError();
		return ToNumber(source.substring(startPos, currentPos));
	}

	function readJSONNullLiteral() {
		if (source.substring(currentPos, currentPos + 4) === "null") {
			proceed(4);
			return null;
		}
		throw VMSyntaxError();
	}

	function readJSONBooleanLiteral() {
		if (source.substring(currentPos, currentPos + 4) === "true") {
			proceed(4);
			return true;
		}
		if (source.substring(currentPos, currentPos + 5) === "false") {
			proceed(5);
			return false;
		}
		throw VMSyntaxError();
	}

	function skipJSONWhiteSpaces() {
		while (true) {
			switch (current) {
			case '\u0009': // <TAB>
			case '\u000D': // <CR>
			case '\u000A': // <LF>
			case '\u0020': // <SP>
				proceed();
				break;
			default:
				return;
			}
		}
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
			current = source[++currentPos];
		}
		return c;
	}
}

function JSON_stringify(thisValue, argumentsList) {
	var value = argumentsList[0];
	var replacer = argumentsList[1];
	var space = argumentsList[2];
	var stack = [];
	var indent = "";
	var PropertyList = undefined;
	var ReplacerFunction = undefined;
	if (Type(replacer) === "Object") {
		if (IsCallable(replacer) === true) {
			var ReplacerFunction = replacer;
		}
		else if (replacer.Class === "Array") {
			var PropertyList = [];
			var length = replacer.Get("length");
			for (var i = 0; i < length; i++) {
				if (replacer.HasOwnProperty(ToString(i)) === false) {
					continue;
				}
				var v = replacer.Get(ToString(i));
				var item = undefined;
				if (Type(v) === "String") {
					var item = v;
				}
				else if (Type(v) === "Number") {
					var item = ToString(v);
				}
				else if (Type(v) === "Object") {
					if (v.Class === "String" || v.Class === "Number") {
						var item = ToString(v);
					}
				}
				if (item !== undefined && isIncluded(item, PropertyList) === false) {
					PropertyList.push(item);
				}
			}
		}
	}
	if (Type(space) === "Object") {
		if (space.Class === "Number") {
			var space = ToNumber(space);
		}
		else if (space.Class === "String") {
			var space = ToString(space);
		}
	}
	if (Type(space) === "Number") {
		var space = min(10, ToInteger(space));
		var gap = "";
		for (var i = 0; i < space; i++) {
			gap = gap + " ";
		}
	}
	else if (Type(space) === "String") {
		if (space.length <= 10) {
			var gap = space

		}
		else {
			var gap = space.substring(0, 10);
		}
	}
	else {
		var gap = "";
	}
	var wrapper = Object_Construct([]);
	wrapper.DefineOwnProperty("", PropertyDescriptor({
		Value : value,
		Writable : true,
		Enumerable : true,
		Configurable : true
	}), false);
	return Str("", wrapper);

	function Str(key, holder) {
		var value = holder.Get(key);
		if (Type(value) === "Object") {
			var toJSON = value.Get("toJSON");
			if (IsCallable(toJSON) === true) {
				var value = toJSON.Call(value, [ key ]);
			}
		}
		if (ReplacerFunction !== undefined) {
			var value = ReplacerFunction.Call(holder, [ key, value ]);
		}
		if (Type(value) === "Object") {
			if (value.Class === "Number") {
				var value = ToNumber(value);
			}
			else if (value.Class === "String") {
				var value = ToString(value);
			}
			else if (value.Class === "Boolean") {
				var value = value.PrimitiveValue;
			}
		}
		if (value === null) return "null";
		if (value === true) return "true";
		if (value === false) return "false";
		if (Type(value) === "String") return Quote(value);
		if (Type(value) === "Number") {
			if (isFinite(value)) return ToString(value);
			else return "null";
		}
		if (Type(value) === "Object" && IsCallable(value) === false) {
			if (value.Class === "Array") return JA(value);
			else return JO(value);
		}
		return undefined;
	}

	function Quote(value) {
		var product = [];
		product.push('"');
		for (var i = 0; i < value.length; i++) {
			var C = value[i];
			if (C === '"') {
				product.push('\\"');
			}
			else if (C === '\\') {
				product.push('\\\\');
			}
			else if (C === '\b') {
				product.push('\\b');
			}
			else if (C === '\f') {
				product.push('\\f');
			}
			else if (C === '\n') {
				product.push('\\n');
			}
			else if (C === '\r') {
				product.push('\\r');
			}
			else if (C === '\t') {
				product.push('\\t');
			}
			else if (toCharCode(C) < 0x20) {
				var x = toCharCode(C);
				var hex = toDigitChar(x >> 12) + toDigitChar(15 & (x >> 8)) + toDigitChar(15 & (x >> 4)) + toDigitChar(15 & x);
				product.push('\\u' + hex);
			}
			else {
				product.push(C);
			}
		}
		product.push('"');
		return join(product);
	}

	function JO(value) {
		if (isIncluded(value, stack)) throw VMTypeError();
		stack.push(value);
		var stepback = indent;
		indent = indent + gap;
		if (PropertyList !== undefined) {
			var K = PropertyList;
		}
		else {
			var K = [];
			var next = value.enumerator(true, true);
			var P;
			while ((P = next()) !== undefined) {
				K.push(P);
			}
		}
		var partial = [];
		for (var i = 0; i < K.length; i++) {
			var P = K[i];
			var strP = Str(P, value);
			if (strP !== undefined) {
				var member = Quote(P);
				var member = member + ':';
				if (gap !== "") {
					var member = member + ' ';
				}
				var member = member + strP;
			}
			partial.push(member);
		}
		if (partial === empty) {
			var final = "{}";
		}
		else if (gap === "") {
			var properties = partial.join(',');
			var final = "{" + properties + "}";
		}
		else {
			var separator = ',' + '\n' + indent;
			var properties = partial.join(separator);
			var final = "{" + '\n' + indent + properties + '\n' + stepback + "}";
		}
		stack.pop();
		indent = stepback;
		return final;
	}

	function JA(value) {
		if (isIncluded(value, stack)) throw VMTypeError();
		stack.push(value);
		var stepback = indent;
		indent = indent + gap;
		var partial = [];
		var len = value.Get("length");
		var index = 0;
		while (index < len) {
			var strP = Str(ToString(index), value);
			if (strP === undefined) {
				partial.push("null");
			}
			else {
				partial.push(strP);
			}
			index++;
		}
		if (partial === empty) {
			var final = "[]";
		}
		else if (gap === "") {
			var properties = partial.join(',');
			var final = "[" + properties + "]";
		}
		else {
			var separator = ',' + '\n' + indent;
			var properties = partial.join(separator);
			var final = "[" + '\n' + indent + properties + '\n' + stepback + "]";
		}
		stack.pop();
		indent = stepback;
		return final;
	}

}
