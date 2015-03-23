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

// ECMAScript 5.1: 12 Statements

function BlockStatement(statementList) {
	return function() {
		if (statementList === undefined) return CompletionValue("normal", empty, empty);
		return statementList();
	}
}

function StatementList(statements) {
	if (statements.length === 0) return undefined;
	if (statements.length === 1) return function() {
		try {
			var s = statements[0]();
		}
		catch (V) {
			if (isInternalError(V)) throw V;
			return CompletionValue("throw", V, empty);
		}
		return s;
	}

	return function() {
		try {
			var sl = statements[0]();
		}
		catch (V) {
			if (isInternalError(V)) throw V;
			return CompletionValue("throw", V, empty);
		}

		for (var i = 1; i < statements.length; i++) {
			if (sl.type !== "normal") return sl;
			try {
				var s = statements[i]();
			}
			catch (V) {
				if (isInternalError(V)) throw V;
				return CompletionValue("throw", V, empty);
			}
			if (s.value === empty) {
				var V = sl.value;
			}
			else {
				var V = s.value;
			}
			sl = CompletionValue(s.type, V, s.target);
		}
		return sl;
	}
}

function VariableStatement(variableDeclarationList) {
	return function() {
		for (var i = 0; i !== variableDeclarationList.length; i++) {
			variableDeclarationList[i]();
		}
		return CompletionValue("normal", empty, empty);
	}
}

function VariableDeclaration(identifier, initialiser, strict) {
	return function() {
		if (initialiser !== undefined) {
			var env = LexicalEnvironment;
			var lhs = GetIdentifierReference(env, identifier, strict);
			var rhs = initialiser();
			var value = GetValue(rhs);
			PutValue(lhs, value);
		}
		return identifier;
	}
}

function EmptyStatement() {
	return function() {
		return CompletionValue("normal", empty, empty);
	}
}

function ExpressionStatement(expression) {
	return function() {
		var exprRef = expression();
		return CompletionValue("normal", GetValue(exprRef), empty);
	}
}

function IfStatement(expression, firstStatement, secondStatement) {
	return function() {
		var exprRef = expression();
		if (ToBoolean(GetValue(exprRef)) === true) return firstStatement();
		else {
			if (secondStatement === undefined) return CompletionValue("normal", empty, empty);
			return secondStatement();
		}
	}
}

function DoWhileStatement(statement, expression, labelset) {
	return function() {
		var V = empty;
		while (true) {
			var stmt = statement();
			if (stmt.value !== empty) {
				V = stmt.value;
			}
			if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
				if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true) return CompletionValue("normal", V, empty);
				if (stmt.type !== "normal") return stmt;
			}
			var exprRef = expression();
			if (ToBoolean(GetValue(exprRef)) === false) {
				break;
			}
		}
		return CompletionValue("normal", V, empty);
	}
}

function WhileStatement(expression, statement, labelset) {
	return function() {
		var V = empty;
		while (true) {
			var exprRef = expression();
			if (ToBoolean(GetValue(exprRef)) === false) {
				break;
			}
			var stmt = statement();
			if (stmt.value !== empty) {
				V = stmt.value;
			}
			if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
				if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true) return CompletionValue("normal", V, empty);
				if (stmt.type !== "normal") return stmt;
			}
		}
		return CompletionValue("normal", V, empty);
	}
}

function ForStatement(expressionNoIn, firstExpression, secondExpression, statement, labelset) {
	return function() {
		if (expressionNoIn !== undefined) {
			var exprRef = expressionNoIn();
			GetValue(exprRef);
		}
		var V = empty;
		while (true) {
			if (firstExpression !== undefined) {
				var testExprRef = firstExpression();
				if (ToBoolean(GetValue(testExprRef)) === false) return CompletionValue("normal", V, empty);
			}
			var stmt = statement();
			if (stmt.value !== empty) {
				V = stmt.value;
			}
			if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true) return CompletionValue("normal", V, empty);
			if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
				if (stmt.type !== "normal") return stmt;
			}
			if (secondExpression !== undefined) {
				var incExprRef = secondExpression();
				GetValue(incExprRef);
			}
		}
	}
}

function ForVarStatement(variableDeclarationList, firstExpression, secondExpression, statement, labelset) {
	return function() {
		for (var i = 0; i < variableDeclarationList.length; i++) {
			variableDeclarationList[i]();
		}
		var V = empty;
		while (true) {
			if (firstExpression !== undefined) {
				var testExprRef = firstExpression();
				if (ToBoolean(GetValue(testExprRef)) === false) return CompletionValue("normal", V, empty);
			}
			var stmt = statement();
			if (stmt.value !== empty) {
				V = stmt.value;
			}
			if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true) return CompletionValue("normal", V, empty);
			if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
				if (stmt.type !== "normal") return stmt;
			}
			if (secondExpression !== undefined) {
				var incExprRef = secondExpression();
				GetValue(incExprRef);
			}
		}
	}
}

function ForInStatement(leftHandSideExpression, expression, statement, labelset) {
	return function() {
		var exprRef = expression();
		var experValue = GetValue(exprRef);
		if (experValue === null || experValue === undefined) return CompletionValue("normal", empty, empty);
		var obj = ToObject(experValue);
		var V = empty;
		var next = obj.enumerator(false, true);
		while (true) {
			var P = next();
			if (P === undefined) return CompletionValue("normal", V, empty);
			var lhsRef = leftHandSideExpression();
			PutValue(lhsRef, P);
			var stmt = statement();
			if (stmt.value !== empty) {
				V = stmt.value;
			}
			if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true) return CompletionValue("normal", V, empty);
			if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
				if (stmt.type !== "normal") return stmt;
			}
		}
	}
}

function ForVarInStatement(variableDeclarationNoIn, expression, statement, labelset, strict) {
	return function() {
		var varName = variableDeclarationNoIn();
		var exprRef = expression();
		var experValue = GetValue(exprRef);
		if (experValue === null || experValue === undefined) return CompletionValue("normal", empty, empty);
		var obj = ToObject(experValue);
		var V = empty;
		var next = obj.enumerator(false, true);
		while (true) {
			var P = next();
			if (P === undefined) return CompletionValue("normal", V, empty);
			var env = LexicalEnvironment;
			var varRef = GetIdentifierReference(env, varName, strict);
			PutValue(varRef, P);
			var stmt = statement();
			if (stmt.value !== empty) {
				V = stmt.value;
			}
			if (stmt.type === "break" && isInLabelSet(stmt.target, labelset) === true) return CompletionValue("normal", V, empty);
			if (stmt.type !== "continue" || isInLabelSet(stmt.target, labelset) === false) {
				if (stmt.type !== "normal") return stmt;
			}
		}
	}
}

function ContinueStatement(identifier) {
	return function() {
		if (identifier === undefined) return CompletionValue("continue", empty, empty);
		else return CompletionValue("continue", empty, identifier);
	}
}

function BreakStatement(identifier) {
	return function() {
		if (identifier === undefined) return CompletionValue("break", empty, empty);
		else return CompletionValue("break", empty, identifier);
	}
}

function ReturnStatement(expression) {
	return function() {
		if (expression === undefined) return CompletionValue("return", undefined, empty);
		var exprRef = expression();
		return CompletionValue("return", GetValue(exprRef), empty);
	}
}

function WithStatement(expression, statement) {
	return function() {
		var val = expression();
		var obj = ToObject(GetValue(val));
		var oldEnv = LexicalEnvironment;
		var newEnv = NewObjectEnvironment(obj, oldEnv);
		newEnv.environmentRecord.provideThis = true;
		LexicalEnvironment = newEnv;
		try {
			var C = statement();
		}
		catch (V) {
			if (isInternalError(V)) throw V;
			C = CompletionValue("throw", V, empty);
		}
		LexicalEnvironment = oldEnv;
		return C;
	}
}

function SwitchStatement(expression, caseBlock, labelset) {
	return function() {
		var exprRef = expression();
		var R = caseBlock(GetValue(exprRef));
		if (R.type === "break" && isInLabelSet(R.target, labelset) === true) return CompletionValue("normal", R.value, empty);
		return R;
	}
}

function CaseBlock(A, defaultClause, B) {
	if (defaultClause === undefined) return function(input) {
		var V = empty;
		var searching = true;
		for (var i = 0; searching && (i < A.length); i++) {
			var C = A[i];
			var clauseSelector = C();
			if (input === clauseSelector) {
				searching = false;
				if (C.statementList !== undefined) {
					var R = C.statementList();
					if (R.type !== "normal") return R;
					V = R.value;
				}
			}
		}
		for (; i < A.length; i++) {
			var C = A[i];
			if (C.statementList !== undefined) {
				var R = C.statementList();
				if (R.value !== empty) {
					V = R.value;
				}
				if (R.type !== "normal") return CompletionValue(R.type, V, R.target);
			}
		}
		return CompletionValue("normal", V, empty);
	}

	return function(input) {
		var V = empty;
		var found = false;
		for (var i = 0; i < A.length; i++) {
			var C = A[i];
			if (found === false) {
				var clauseSelector = C();
				if (input === clauseSelector) {
					found = true;
				}
			}
			if (found === true) {
				if (C.statementList !== undefined) {
					var R = C.statementList();
					if (R.value !== empty) {
						V = R.value;
					}
					if (R.type !== "normal") return CompletionValue(R.type, V, R.target);
				}
			}
		}
		var foundInB = false;
		if (found === false) {
			for (var j = 0; foundInB === false && (j < B.length); j++) {
				var C = B[j];
				var clauseSelector = C();
				if (input === clauseSelector) {
					foundInB = true;
					if (C.statementList !== undefined) {
						var R = C.statementList();
						if (R.value !== empty) {
							V = R.value;
						}
						if (R.type !== "normal") return CompletionValue(R.type, V, R.target);
					}
				}
			}
		}
		if (foundInB === false && defaultClause !== undefined) {
			var R = defaultClause();
			if (R.value !== empty) {
				V = R.value;
			}
			if (R.type !== "normal") return CompletionValue(R.type, V, R.target);
		}
		// specification Bug 345
		if (foundInB === false) {
			j = 0;
		}
		// end of bug fix
		for (; j < B.length; j++) {
			var C = B[j];
			if (C.statementList !== undefined) {
				var R = C.statementList();
				if (R.value !== empty) {
					V = R.value;
				}
				if (R.type !== "normal") return CompletionValue(R.type, V, R.target);
			}
		}
		return CompletionValue("normal", V, empty);
	}
}

function CaseClause(expression, statementList) {
	var evaluate = function() {
		var exprRef = expression();
		return GetValue(exprRef);
	}
	evaluate.statementList = statementList;
	return evaluate;
}

function isInLabelSet(target, labelset) {
	if (target === empty) return true;
	if (labelset === undefined) return false;
	if (isIncluded(target, labelset)) return true;
	return false;
}

function LabelledStatement(identifier, statement) {
	return function() {
		var stmt = statement();
		if (stmt.type === "break" && stmt.target === identifier) return CompletionValue("normal", stmt.value, empty);
		return stmt;
	}
}

function ThrowStatement(expression) {
	return function() {
		var exprRef = expression();
		return CompletionValue("throw", GetValue(exprRef), empty);
	}
}

function TryStatement(block, catchBlock, finallyBlock) {
	if (finallyBlock === undefined) return function() {
		var B = block();
		if (B.type !== "throw") return B;
		return catchBlock(B.value);
	}

	if (catchBlock === undefined) return function() {
		var B = block();
		var F = finallyBlock();
		if (F.type === "normal") return B;
		return F;
	}

	return function() {
		var B = block();
		if (B.type === "throw") {
			var C = catchBlock(B.value);
		}
		else {
			var C = B;
		}
		var F = finallyBlock();
		if (F.type === "normal") return C;
		return F;
	}
}

function CatchBlock(identifier, block) {
	return function(C) {
		var oldEnv = LexicalEnvironment;
		var catchEnv = NewDeclarativeEnvironment(oldEnv);
		var envRec = catchEnv.environmentRecord;
		envRec.CreateMutableBinding(identifier);
		envRec.SetMutableBinding(identifier, C, false);
		LexicalEnvironment = catchEnv;
		var B = block();
		LexicalEnvironment = oldEnv;
		return B;
	}
}

function DebuggerStatement() {
	return function() {
		return CompletionValue("normal", empty, empty);
	}
}
