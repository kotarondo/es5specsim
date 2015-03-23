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

// ECMAScript 5.1: 11 Expressions

function ThisExpression() {
	return function() {
		return ThisBinding;
	}
}

function IdentifierReference(identifier, strict) {
	return function() {
		var env = LexicalEnvironment;
		return GetIdentifierReference(env, identifier, strict);
	}
}

function Literal(value) {
	return function() {
		return value;
	}
}

function RegExpLiteral(regexp) {
	return function() {
		return RegExp_Construct([ regexp ]);
	}
}

function ArrayInitialiser(elements) {
	return function() {
		var array = Array_Construct([]);
		for (var i = 0; i < elements.length; i++) {
			var e = elements[i];
			if (e !== empty) {
				var initResult = e();
				var initValue = GetValue(initResult);
				array.DefineOwnProperty(ToString(i), PropertyDescriptor({
					Value : initValue,
					Writable : true,
					Enumerable : true,
					Configurable : true
				}), false);
			}
		}
		if (e === empty) {
			array.Put("length", i - 1, false);
		}
		return array;
	}
}

function ObjectInitialiser(elements) {
	return function() {
		var obj = Object_Construct([]);
		for (var i = 0; i < elements.length; i++) {
			elements[i](obj);
		}
		return obj;
	}
}

function PropertyAssignment(name, expression) {
	return function(obj) {
		var exprValue = expression();
		var propValue = GetValue(exprValue);
		var desc = PropertyDescriptor({
			Value : propValue,
			Writable : true,
			Enumerable : true,
			Configurable : true
		});
		obj.DefineOwnProperty(name, desc, false);
	}
}

function PropertyAssignmentGet(name, body) {
	return function(obj) {
		var env = LexicalEnvironment;
		var closure = FunctionObject([], body, env, body.strict);
		var desc = PropertyDescriptor({
			Get : closure,
			Enumerable : true,
			Configurable : true
		});
		obj.DefineOwnProperty(name, desc, false);
	}
}

function PropertyAssignmentSet(name, parameter, body) {
	return function(obj) {
		var env = LexicalEnvironment;
		var closure = FunctionObject([ parameter ], body, env, body.strict);
		var desc = PropertyDescriptor({
			Set : closure,
			Enumerable : true,
			Configurable : true
		});
		obj.DefineOwnProperty(name, desc, false);
	}
}

function PropertyAccessor(base, name, strict) {
	return function() {
		var baseReference = base();
		var baseValue = GetValue(baseReference);
		var propertyNameReference = name();
		var propertyNameValue = GetValue(propertyNameReference);
		CheckObjectCoercible(baseValue);
		var propertyNameString = ToString(propertyNameValue);
		return ReferenceValue(baseValue, propertyNameString, strict);
	}
}

function NewOperator(expression, args) {
	return function() {
		var ref = expression();
		var constructor = GetValue(ref);
		var argList = evaluateArguments(args);
		if (Type(constructor) !== "Object") throw VMTypeError();
		if (constructor.Construct === undefined) throw VMTypeError();
		return constructor.Construct(argList);
	}
}

function FunctionCall(expression, args, strict) {
	return function() {
		var ref = expression();
		var func = GetValue(ref);
		var argList = evaluateArguments(args);
		if (Type(func) !== "Object") throw VMTypeError();
		if (!IsCallable(func)) throw VMTypeError();
		if (Type(ref) === "Reference") {
			if (IsPropertyReference(ref)) {
				var thisValue = GetBase(ref);
			}
			else {
				var thisValue = GetBase(ref).ImplicitThisValue();
				if (func === theEvalFunction && GetReferencedName(ref) === "eval") return Global_eval(thisValue, argList, true, strict);
			}
		}
		return func.Call(thisValue, argList);
	}
}

function evaluateArguments(args) {
	var argList = [];
	for (var i = 0; i < args.length; i++) {
		var ref = args[i]();
		var arg = GetValue(ref);
		argList.push(arg);
	}
	return argList;
}

function PostfixIncrementOperator(expression) {
	return function() {
		var lhs = expression();
		var oldValue = ToNumber(GetValue(lhs));
		var newValue = oldValue + 1;
		PutValue(lhs, newValue);
		return oldValue;
	}
}

function PostfixDecrementOperator(expression) {
	return function() {
		var lhs = expression();
		var oldValue = ToNumber(GetValue(lhs));
		var newValue = oldValue - 1;
		PutValue(lhs, newValue);
		return oldValue;
	}
}

function deleteOperator(expression) {
	return function() {
		var ref = expression();
		if (Type(ref) != "Reference") return true;
		if (IsUnresolvableReference(ref)) return true;
		if (IsPropertyReference(ref)) return ToObject(GetBase(ref)).Delete(GetReferencedName(ref), IsStrictReference(ref));
		else {
			var bindings = GetBase(ref);
			return bindings.DeleteBinding(GetReferencedName(ref));
		}
	}
}

function voidOperator(expression) {
	return function() {
		var expr = expression();
		GetValue(expr);
		return undefined;
	}
}

function typeofOperator(expression) {
	return function() {
		var val = expression();
		if (Type(val) === "Reference") {
			if (IsUnresolvableReference(val)) return "undefined";
			val = GetValue(val);
		}
		switch (Type(val)) {
		case "Undefined":
			return "undefined";
		case "Null":
			return "object";
		case "Boolean":
			return "boolean";
		case "Number":
			return "number";
		case "String":
			return "string";
		case "Object":
			if (IsCallable(val)) return "function";
			return "object";
		}
	}
}

function PrefixIncrementOperator(expression) {
	return function() {
		var expr = expression();
		var oldValue = ToNumber(GetValue(expr));
		var newValue = oldValue + 1;
		PutValue(expr, newValue);
		return newValue;
	}
}

function PrefixDecrementOperator(expression) {
	return function() {
		var expr = expression();
		var oldValue = ToNumber(GetValue(expr));
		var newValue = oldValue - 1;
		PutValue(expr, newValue);
		return newValue;
	}
}

function PlusOperator(expression) {
	return function() {
		var expr = expression();
		return ToNumber(GetValue(expr));
	}
}

function MinusOperator(expression) {
	return function() {
		var expr = expression();
		var oldValue = ToNumber(GetValue(expr));
		return -oldValue;
	}
}

function BitwiseNOTOperator(expression) {
	return function() {
		var expr = expression();
		var oldValue = ToInt32(GetValue(expr));
		return ~oldValue;
	}
}

function LogicalNOTOperator(expression) {
	return function() {
		var expr = expression();
		var oldValue = ToBoolean(GetValue(expr));
		if (oldValue === true) return false;
		return true;
	}
}

function MultiplicativeOperator(operator, leftExpression, rightExpression) {
	return function() {
		var left = leftExpression();
		var leftValue = GetValue(left);
		var right = rightExpression();
		var rightValue = GetValue(right);
		var leftNum = ToNumber(leftValue);
		var rightNum = ToNumber(rightValue);
		switch (operator) {
		case '*':
			return leftNum * rightNum;
		case '/':
			return leftNum / rightNum;
		case '%':
			return leftNum % rightNum;
		}
	}
}

function AdditionOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		var lprim = ToPrimitive(lval);
		var rprim = ToPrimitive(rval);
		if (Type(lprim) === "String" || Type(rprim) === "String") return ToString(lprim) + ToString(rprim);
		else return ToNumber(lprim) + ToNumber(rprim);
	}
}

function SubtractionOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		var lnum = ToNumber(lval);
		var rnum = ToNumber(rval);
		return lnum - rnum;
	}
}

function LeftShiftOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		var lnum = ToInt32(lval);
		var rnum = ToUint32(rval);
		var shiftCount = rnum & 0x1F;
		return lnum << shiftCount;
	}
}

function SignedRightShiftOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		var lnum = ToInt32(lval);
		var rnum = ToUint32(rval);
		var shiftCount = rnum & 0x1F;
		return lnum >> shiftCount;
	}
}

function UnsignedRightShiftOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		var lnum = ToUint32(lval);
		var rnum = ToUint32(rval);
		var shiftCount = rnum & 0x1F;
		return lnum >>> shiftCount;
	}
}

function LessThanOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		var r = abstractRelationalComparison(lval, rval);
		if (r === undefined) return false;
		return r;
	}
}

function GreaterThanOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		var r = abstractRelationalComparison(rval, lval, false);
		if (r === undefined) return false;
		return r;
	}
}

function LessThanOrEqualOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		var r = abstractRelationalComparison(rval, lval, false);
		if (r === true || r === undefined) return false;
		return true;
	}
}

function GreaterThanOrEqualOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		var r = abstractRelationalComparison(lval, rval);
		if (r === true || r === undefined) return false;
		return true;
	}
}

function abstractRelationalComparison(x, y, LeftFirst) {
	if (LeftFirst !== false) {
		var px = ToPrimitive(x, "Number");
		var py = ToPrimitive(y, "Number");
	}
	else {
		var py = ToPrimitive(y, "Number");
		var px = ToPrimitive(x, "Number");
	}
	if (!(Type(px) === "String" && Type(py) === "String")) {
		var nx = ToNumber(px);
		var ny = ToNumber(py);
		if (isNaN(nx)) return undefined;
		if (isNaN(ny)) return undefined;
		return (nx < ny);
	}
	else return (px < py);
}

function instanceofOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		if (Type(rval) !== "Object") throw VMTypeError();
		if (rval.HasInstance === undefined) throw VMTypeError();
		return rval.HasInstance(lval);
	}
}

function inOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		if (Type(rval) !== "Object") throw VMTypeError();
		return rval.HasProperty(ToString(lval));
	}
}

function EqualsOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		return abstractEqualityComparison(lval, rval);
	}
}

function DoesNotEqualOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		var r = abstractEqualityComparison(lval, rval);
		if (r === true) return false;
		return true;
	}
}

function abstractEqualityComparison(x, y) {
	if (Type(x) === Type(y)) return (x === y);
	if (x === null && y === undefined) return true;
	if (x === undefined && y === null) return true;
	if (Type(x) === "Number" && Type(y) === "String") return abstractEqualityComparison(x, ToNumber(y));
	if (Type(x) === "String" && Type(y) === "Number") return abstractEqualityComparison(ToNumber(x), y);
	if (Type(x) === "Boolean") return abstractEqualityComparison(ToNumber(x), y);
	if (Type(y) === "Boolean") return abstractEqualityComparison(x, ToNumber(y));
	if ((Type(x) === "String" || Type(x) === "Number") && Type(y) === "Object") return abstractEqualityComparison(x, ToPrimitive(y));
	if (Type(x) === "Object" && (Type(y) === "String" || Type(y) === "Number")) return abstractEqualityComparison(ToPrimitive(x), y);
	return false;
}

function StrictEqualsOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		return (lval === rval);
	}
}

function StrictDoesNotEqualOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		if (lval === rval) return false;
		return true;
	}
}

function BinaryBitwiseOperator(operator, leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		var lnum = ToInt32(lval);
		var rnum = ToInt32(rval);
		switch (operator) {
		case '&':
			return lnum & rnum;
		case '^':
			return lnum ^ rnum;
		case '|':
			return lnum | rnum;
		}
	}
}

function LogicalAndOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		if (ToBoolean(lval) === false) return lval;
		var rref = rightExpression();
		return GetValue(rref);
	}
}

function LogicalOrOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		if (ToBoolean(lval) === true) return lval;
		var rref = rightExpression();
		return GetValue(rref);
	}
}

function ConditionalOperator(condition, firstExpression, secondExpression) {
	return function() {
		var lref = condition();
		if (ToBoolean(GetValue(lref)) === true) {
			var trueRef = firstExpression();
			return GetValue(trueRef);
		}
		else {
			var falseRef = secondExpression();
			return GetValue(falseRef);
		}
	}
}

function SimpleAssignment(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var rref = rightExpression();
		var rval = GetValue(rref);
		PutValue(lref, rval);
		return rval;
	}
}

function CompoundAssignment(operator, leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		var lval = GetValue(lref);
		var rref = rightExpression();
		var rval = GetValue(rref);
		switch (operator) {
		case '*=':
			var r = ToNumber(lval) * ToNumber(rval);
			break;
		case '/=':
			var r = ToNumber(lval) / ToNumber(rval);
			break;
		case '%=':
			var r = ToNumber(lval) % ToNumber(rval);
			break;
		case '+=':
			var lprim = ToPrimitive(lval);
			var rprim = ToPrimitive(rval);
			if (Type(lprim) === "String" || Type(rprim) === "String") {
				var r = ToString(lprim) + ToString(rprim);
			}
			else {
				var r = ToNumber(lprim) + ToNumber(rprim);
			}
			break;
		case '-=':
			var r = ToNumber(lval) - ToNumber(rval);
			break;
		case '<<=':
			var r = ToInt32(lval) << (ToUint32(rval) & 0x1F);
			break;
		case '>>=':
			var r = ToInt32(lval) >> (ToUint32(rval) & 0x1F);
			break;
		case '>>>=':
			var r = ToUint32(lval) >>> (ToUint32(rval) & 0x1F);
			break;
		case '&=':
			var r = ToInt32(lval) & ToInt32(rval);
			break;
		case '|=':
			var r = ToInt32(lval) | ToInt32(rval);
			break;
		case '^=':
			var r = ToInt32(lval) ^ ToInt32(rval);
			break;
		}
		PutValue(lref, r);
		return r;
	}
}

function CommaOperator(leftExpression, rightExpression) {
	return function() {
		var lref = leftExpression();
		GetValue(lref);
		var rref = rightExpression();
		return GetValue(rref);
	}
}
