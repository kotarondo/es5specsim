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

var theParser = Parser();

function Parser() {
	return {
		readProgram : readProgram,
		readFunctionParameters : readFunctionParameters,
		readFunctionCode : readFunctionCode
	};

	var current;
	var token;
	var value;
	var isNumericLiteral;
	var isStringLiteral;
	var isIdentifierName;
	var isEscaped;
	var isLineSeparatedAhead;
	var isLineSeparatedBehind;
	var tokenPos;
	var tokenEndPos;
	var currentPos;
	/*
	 *     token    current
	 * <--> isLineSeparatedAhead
	 *     ^ tokenPos
	 *          ^ tokenEndPos
	 *          <--> isLineSeparatedBehind
	 *              ^ currentPos
	 */

	var source;
	var strict;
	var codeCtx;
	var lastLeftHandSide;
	var lastReference;
	var lastIdentifierReference;
	var lastIdentifier;

	function setup(text, strictMode) {
		source = text;
		strict = strictMode;
		codeCtx = undefined;
		lastLeftHandSide = undefined;
		lastReference = undefined;
		lastIdentifierReference = undefined;
		lastIdentifier = undefined;
		setPosition(0);
		skipSpaces();
		proceedToken();
	}

	function readProgram(programText, strictMode) {
		setup(programText, strictMode);
		codeCtx = {};
		codeCtx.isFunction = false;
		var sourceElements = readSourceElements();
		var program = Program(sourceElements, codeCtx.functions, codeCtx.variables, strict);
		if (token !== undefined) throw VMSyntaxError();
		return program;
	}

	function readFunctionParameters(parameterText) {
		setup(parameterText, false);
		var parameters = [];
		if (token !== undefined) {
			while (true) {
				parameters.push(expectingIdentifier());
				if (token === undefined) {
					break;
				}
				expectingToken(',');
			}
		}
		return parameters;
	}

	function readFunctionCode(programText, parameters) {
		setup(programText, false);
		var body = readFunctionBody();
		if (body.strict) {
			disallowDuplicated(parameters);
			parameters.forEach(disallowEvalOrArguments);
		}
		return body;
	}

	function readFunctionBody() {
		var outerStrict = strict;
		var outerCtx = codeCtx;
		codeCtx = {};
		codeCtx.isFunction = true;
		var sourceElements = readSourceElements();
		var body = FunctionBody(sourceElements, codeCtx.functions, codeCtx.variables, strict);
		strict = outerStrict;
		codeCtx = outerCtx;
		return body;
	}

	function readSourceElements() {
		codeCtx.functions = [];
		codeCtx.variables = [];
		codeCtx.labelStack = [];
		codeCtx.iterableLabelStack = [];
		codeCtx.iterables = 0;
		codeCtx.switches = 0;
		var pos = tokenPos;
		while (isStringLiteral) {
			if (!(isLineSeparatedBehind || current === ';' || current === '}')) {
				break;
			}
			if (value === "use strict") {
				var text = source.substring(tokenPos, tokenEndPos);
				if (text === '"use strict"' || text === "'use strict'") {
					strict = true;
				}
			}
			readStatement();
		}
		if (pos !== tokenPos) {
			setPosition(pos);
			proceedToken();
		}
		var statements = [];
		while (token !== undefined && token !== '}') {
			if (token === "function") {
				codeCtx.functions.push(readFunctionDeclaration());
			}
			else {
				statements.push(readStatement());
			}
		}
		return SourceElements(statements);
	}

	function readFunctionDeclaration() {
		proceedToken();
		var name = expectingIdentifier();
		expectingToken('(');
		var parameters = [];
		if (!testToken(')')) {
			while (true) {
				parameters.push(expectingIdentifier());
				if (testToken(')')) {
					break;
				}
				expectingToken(',');
			}
		}
		expectingToken('{');
		var body = readFunctionBody();
		expectingToken('}');
		if (body.strict) {
			disallowEvalOrArguments(name);
			disallowDuplicated(parameters);
			parameters.forEach(disallowEvalOrArguments);
		}
		var func = FunctionDeclaration(name, parameters, body);
		return func;
	}

	function readStatement(labelset) {
		switch (token) {
		case '{': // '}'
			return readBlockStatement();
		case ';':
			proceedToken();
			return EmptyStatement();
		case "var":
			return readVariableStatement();
		case "if":
			return readIfStatement();
		case "do":
			codeCtx.iterables++;
			var statement = readDoWhileStatement(labelset);
			codeCtx.iterables--;
			return statement;
		case "while":
			codeCtx.iterables++;
			var statement = readWhileStatement(labelset);
			codeCtx.iterables--;
			return statement;
		case "for":
			codeCtx.iterables++;
			var statement = readForStatement(labelset);
			codeCtx.iterables--;
			return statement;
		case "continue":
			return readContinueStatement();
		case "break":
			return readBreakStatement();
		case "return":
			return readReturnStatement();
		case "with":
			return readWithStatement();
		case "switch":
			codeCtx.switches++;
			var statement = readSwitchStatement(labelset);
			codeCtx.switches--;
			return statement;
		case "throw":
			return readThrowStatement();
		case "try":
			return readTryStatement();
		case "debugger":
			return readDebuggerStatement();
		case "function":
			return readFunctionStatement();
		default:
			if (isIdentifierName && current === ':') return readLabelledStatement();
			else return readExpressionStatement();
		}
	}

	function readLabelledStatement() {
		var labelset = [];
		codeCtx.labelStack.push(labelset);
		while (isIdentifierName && current === ':') {
			var identifier = expectingIdentifier();
			if (findLabel(codeCtx.labelStack, identifier) !== undefined) throw VMSyntaxError();
			expectingToken(':');
			labelset.push(identifier);
		}
		switch (token) {
		case "do":
		case "while":
		case "for":
			var iterable = true;
		}
		if (iterable) {
			codeCtx.iterableLabelStack.push(labelset);
		}
		var statement = readStatement(labelset);
		codeCtx.labelStack.pop();
		if (iterable) {
			codeCtx.iterableLabelStack.pop();
		}
		var i = labelset.length;
		while (i-- !== 0) {
			statement = LabelledStatement(labelset[i], statement);
		}
		return statement;
	}

	function readExpressionStatement() {
		var expression = readExpression();
		expectingAutoSemicolon();
		return ExpressionStatement(expression);
	}

	function readBlockStatement() {
		expectingToken('{');
		var statements = [];
		while (true) {
			if (testToken('}')) {
				break;
			}
			statements.push(readStatement());
		}
		return BlockStatement(StatementList(statements));
	}

	function readVariableStatement() {
		proceedToken();
		var variableDeclarationList = readVariableDeclarationList();
		expectingAutoSemicolon();
		return VariableStatement(variableDeclarationList);
	}

	function readVariableDeclarationList(isNoIn) {
		var variableDeclarationList = [];
		while (true) {
			var variableDeclaration = readVariableDeclaration(isNoIn);
			variableDeclarationList.push(variableDeclaration);
			if (!testToken(',')) {
				break;
			}
		}
		return variableDeclarationList;
	}

	function readVariableDeclaration(isNoIn) {
		var identifier = expectingIdentifier();
		if (strict) {
			disallowEvalOrArguments(identifier);
		}
		if (testToken('=')) {
			var initialiser = readAssignmentExpression(isNoIn);
		}
		if (isIncluded(identifier, codeCtx.variables) === false) {
			codeCtx.variables.push(identifier);
		}
		return VariableDeclaration(identifier, initialiser, strict);
	}

	function readIfStatement() {
		proceedToken();
		expectingToken('(');
		var expression = readExpression();
		expectingToken(')');
		var statement = readStatement();
		if (testToken("else")) {
			var elseStatement = readStatement();
		}
		return IfStatement(expression, statement, elseStatement);
	}

	function readDoWhileStatement(labelset) {
		proceedToken();
		var statement = readStatement();
		expectingToken("while");
		expectingToken('(');
		var expression = readExpression();
		expectingToken(')');
		expectingAutoSemicolon();
		return DoWhileStatement(statement, expression, labelset);
	}

	function readWhileStatement(labelset) {
		proceedToken();
		expectingToken('(');
		var expression = readExpression();
		expectingToken(')');
		var statement = readStatement();
		return WhileStatement(expression, statement, labelset);
	}

	function readForStatement(labelset) {
		proceedToken();
		expectingToken('(');
		if (testToken("var")) {
			var variableDeclarationList = readVariableDeclarationList(true); // NoIn
			if (testToken("in")) {
				if (variableDeclarationList.length !== 1) throw VMSyntaxError();
				var expression = readExpression();
				expectingToken(')');
				var statement = readStatement();
				return ForVarInStatement(variableDeclarationList[0], expression, statement, labelset, strict);
			}
			expectingToken(';');
			if (!testToken(';')) {
				var testExpression = readExpression();
				expectingToken(';');
			}
			if (!testToken(')')) {
				var postExpression = readExpression();
				expectingToken(')');
			}
			var statement = readStatement();
			return ForVarStatement(variableDeclarationList, testExpression, postExpression, statement, labelset);
		}
		if (!testToken(';')) {
			var expressionNoIn = readExpression(true); // NoIn
			if (testToken("in")) {
				if (expressionNoIn !== lastLeftHandSide) throw VMSyntaxError();
				if (expressionNoIn !== lastReference) throw VMReferenceError();
				var expression = readExpression();
				expectingToken(')');
				var statement = readStatement();
				return ForInStatement(expressionNoIn, expression, statement, labelset);
			}
			expectingToken(';');
		}
		if (!testToken(';')) {
			var testExpression = readExpression();
			expectingToken(';');
		}
		if (!testToken(')')) {
			var postExpression = readExpression();
			expectingToken(')');
		}
		var statement = readStatement();
		return ForStatement(expressionNoIn, testExpression, postExpression, statement, labelset);
	}

	function readContinueStatement() {
		proceedToken();
		if (isIdentifierName && !isLineSeparatedAhead) {
			var identifier = expectingIdentifier();
			var labelset = findLabel(codeCtx.iterableLabelStack, identifier);
			if (labelset === undefined) throw VMSyntaxError();
		}
		else if (codeCtx.iterables === 0) throw VMSyntaxError();
		expectingAutoSemicolon();
		return ContinueStatement(identifier);
	}

	function readBreakStatement() {
		proceedToken();
		if (isIdentifierName && !isLineSeparatedAhead) {
			var identifier = expectingIdentifier();
			var labelset = findLabel(codeCtx.labelStack, identifier);
			if (labelset === undefined) throw VMSyntaxError();
		}
		else if (codeCtx.iterables === 0 && codeCtx.switches === 0) throw VMSyntaxError();
		expectingAutoSemicolon();
		return BreakStatement(identifier);
	}

	function readReturnStatement() {
		proceedToken();
		if (codeCtx.isFunction === false) throw VMSyntaxError();
		if (!(isLineSeparatedAhead || token === ';' || token === '}')) {
			var expression = readExpression();
		}
		expectingAutoSemicolon();
		return ReturnStatement(expression);
	}

	function readWithStatement() {
		proceedToken();
		if (strict) throw VMSyntaxError();
		expectingToken('(');
		var expression = readExpression();
		expectingToken(')');
		var statement = readStatement();
		return WithStatement(expression, statement);
	}

	function readSwitchStatement(labelset) {
		proceedToken();
		expectingToken('(');
		var expression = readExpression();
		expectingToken(')');
		var firstClauses = [];
		var secondClauses = [];
		expectingToken('{');
		while (!testToken('}')) {
			if (testToken("default")) {
				if (defaultClause !== undefined) throw VMSyntaxError();
				expectingToken(':');
				var statements = [];
				while (token !== '}' && token !== "case" && token !== "default") {
					statements.push(readStatement());
				}
				var defaultClause = StatementList(statements);
				continue;
			}
			expectingToken("case");
			var caseExpression = readExpression();
			expectingToken(':');
			var statements = [];
			while (token !== '}' && token !== "case" && token !== "default") {
				statements.push(readStatement());
			}
			var clause = CaseClause(caseExpression, StatementList(statements));
			if (defaultClause === undefined) {
				firstClauses.push(clause);
			}
			else {
				secondClauses.push(clause);
			}
		}
		return SwitchStatement(expression, CaseBlock(firstClauses, defaultClause, secondClauses), labelset);
	}

	function readThrowStatement() {
		proceedToken();
		if (isLineSeparatedAhead) throw VMSyntaxError();
		var expression = readExpression();
		expectingAutoSemicolon();
		return ThrowStatement(expression);
	}

	function readTryStatement() {
		proceedToken();
		var block = readBlockStatement();
		if (testToken("catch")) {
			expectingToken('(');
			var identifier = expectingIdentifier();
			if (strict) {
				disallowEvalOrArguments(identifier);
			}
			expectingToken(')');
			var catchBlock = CatchBlock(identifier, readBlockStatement());
			if (testToken("finally")) {
				var finallyBlock = readBlockStatement();
			}
		}
		else {
			expectingToken("finally");
			var finallyBlock = readBlockStatement();
		}
		return TryStatement(block, catchBlock, finallyBlock);
	}

	function readDebuggerStatement() {
		proceedToken();
		expectingAutoSemicolon();
		return DebuggerStatement();
	}

	function readFunctionStatement() {
		if (strict || STRICT_CONFORMANCE) throw VMSyntaxError();
		codeCtx.functions.push(readFunctionDeclaration());
		return EmptyStatement();
	}

	function findLabel(labelStack, identifier) {
		var i = labelStack.length;
		while (i-- !== 0) {
			var labelset = labelStack[i];
			if (isIncluded(identifier, labelset)) return labelset;
		}
		return undefined;
	}

	function readExpression(isNoIn) {
		var expression = readAssignmentExpression(isNoIn);
		while (testToken(',')) {
			var rightExpression = readAssignmentExpression(isNoIn);
			expression = CommaOperator(expression, rightExpression);
		}
		return expression;
	}

	function readAssignmentExpression(isNoIn) {
		var expression = readConditionalExpression(isNoIn);
		var operator = token;
		switch (operator) {
		case '=':
		case '*=':
		case '/=':
		case '%=':
		case '+=':
		case '-=':
		case '<<=':
		case '>>=':
		case '>>>=':
		case '&=':
		case '|=':
		case '^=':
			proceedToken();
			if (expression !== lastLeftHandSide) throw VMSyntaxError();
			if (expression !== lastReference) throw VMReferenceError();
			if (strict && expression === lastIdentifierReference) {
				disallowEvalOrArguments(lastIdentifier);
			}
			var rightExpression = readAssignmentExpression(isNoIn);
			if (operator === '=') return SimpleAssignment(expression, rightExpression);
			else return CompoundAssignment(operator, expression, rightExpression);
		}
		return expression;
	}

	function readConditionalExpression(isNoIn) {
		var expression = readBinaryExpression('', isNoIn);
		if (testToken('?')) {
			var firstExpression = readAssignmentExpression();
			expectingToken(':');
			var secondExpression = readAssignmentExpression(isNoIn);
			return ConditionalOperator(expression, firstExpression, secondExpression);
		}
		return expression;
	}

	function readBinaryExpression(leadingOperator, isNoIn) {
		var expression = readUnaryExpression();
		while (true) {
			var operator = token;
			if (isNoIn && operator === "in") {
				break;
			}
			if (getOperatorPriority(leadingOperator) <= getOperatorPriority(operator)) {
				break;
			}
			proceedToken();
			var rightExpression = readBinaryExpression(operator, isNoIn);
			switch (operator) {
			case '*':
			case '/':
			case '%':
				expression = MultiplicativeOperator(operator, expression, rightExpression);
				break;
			case '+':
				expression = AdditionOperator(expression, rightExpression);
				break;
			case '-':
				expression = SubtractionOperator(expression, rightExpression);
				break;
			case '<<':
				expression = LeftShiftOperator(expression, rightExpression);
				break;
			case '>>':
				expression = SignedRightShiftOperator(expression, rightExpression);
				break;
			case '>>>':
				expression = UnsignedRightShiftOperator(expression, rightExpression);
				break;
			case '<':
				expression = LessThanOperator(expression, rightExpression);
				break;
			case '>':
				expression = GreaterThanOperator(expression, rightExpression);
				break;
			case '<=':
				expression = LessThanOrEqualOperator(expression, rightExpression);
				break;
			case '>=':
				expression = GreaterThanOrEqualOperator(expression, rightExpression);
				break;
			case "instanceof":
				expression = instanceofOperator(expression, rightExpression);
				break;
			case "in":
				expression = inOperator(expression, rightExpression);
				break;
			case '==':
				expression = EqualsOperator(expression, rightExpression);
				break;
			case '!=':
				expression = DoesNotEqualOperator(expression, rightExpression);
				break;
			case '===':
				expression = StrictEqualsOperator(expression, rightExpression);
				break;
			case '!==':
				expression = StrictDoesNotEqualOperator(expression, rightExpression);
				break;
			case '&':
			case '^':
			case '|':
				expression = BinaryBitwiseOperator(operator, expression, rightExpression);
				break;
			case '&&':
				expression = LogicalAndOperator(expression, rightExpression);
				break;
			case '||':
				expression = LogicalOrOperator(expression, rightExpression);
				break;
			}
		}
		return expression;
	}

	function getOperatorPriority(operator) {
		switch (operator) {
		case '*':
		case '/':
		case '%':
			return 1;
		case '+':
		case '-':
			return 2;
		case '<<':
		case '>>':
		case '>>>':
			return 3;
		case '<':
		case '>':
		case '<=':
		case '>=':
		case "instanceof":
		case "in":
			return 4;
		case '==':
		case '!=':
		case '===':
		case '!==':
			return 5;
		case '&':
			return 6;
		case '^':
			return 7;
		case '|':
			return 8;
		case '&&':
			return 9;
		case '||':
			return 10;
		}
		return 99;
	}

	function readUnaryExpression() {
		var operator = token;
		switch (operator) {
		case "delete":
			proceedToken();
			var expression = readUnaryExpression();
			if (strict && expression === lastIdentifierReference) throw VMSyntaxError();
			return deleteOperator(expression);
		case "void":
			proceedToken();
			var expression = readUnaryExpression();
			return voidOperator(expression);
		case "typeof":
			proceedToken();
			var expression = readUnaryExpression();
			return typeofOperator(expression);
		case '++':
			proceedToken();
			var expression = readUnaryExpression();
			if (strict && expression === lastIdentifierReference) {
				disallowEvalOrArguments(lastIdentifier);
			}
			if (expression !== lastReference) throw VMReferenceError();
			return PrefixIncrementOperator(expression);
		case '--':
			proceedToken();
			var expression = readUnaryExpression();
			if (strict && expression === lastIdentifierReference) {
				disallowEvalOrArguments(lastIdentifier);
			}
			if (expression !== lastReference) throw VMReferenceError();
			return PrefixDecrementOperator(expression);
		case '+':
			proceedToken();
			var expression = readUnaryExpression();
			return PlusOperator(expression);
		case '-':
			proceedToken();
			var expression = readUnaryExpression();
			return MinusOperator(expression);
		case '~':
			proceedToken();
			var expression = readUnaryExpression();
			return BitwiseNOTOperator(expression);
		case '!':
			proceedToken();
			var expression = readUnaryExpression();
			return LogicalNOTOperator(expression);
		}
		var expression = readLeftHandSideExpression();
		if (isLineSeparatedAhead) return expression;
		var operator = token;
		switch (operator) {
		case '++':
			if (strict && expression === lastIdentifierReference) {
				disallowEvalOrArguments(lastIdentifier);
			}
			if (expression !== lastReference) throw VMReferenceError();
			proceedToken();
			return PostfixIncrementOperator(expression);
		case '--':
			if (strict && expression === lastIdentifierReference) {
				disallowEvalOrArguments(lastIdentifier);
			}
			if (expression !== lastReference) throw VMReferenceError();
			proceedToken();
			return PostfixDecrementOperator(expression);
		}
		return expression;
	}

	function readLeftHandSideExpression() {
		var newOperators = 0;
		while (testToken("new")) {
			newOperators++;
		}
		if (token === "function") {
			var expression = readFunctionExpression();
		}
		else {
			var expression = readPrimaryExpression();
		}
		while (true) {
			switch (token) {
			case '[':
				proceedToken();
				var indexExpression = readExpression();
				expectingToken(']');
				expression = PropertyAccessor(expression, indexExpression, strict);
				lastReference = expression;
				continue;
			case '.':
				proceedToken();
				var name = expectingIdentifierName();
				expression = PropertyAccessor(expression, Literal(name), strict);
				lastReference = expression;
				continue;
			case '(':
				var args = readArguments();
				if (newOperators !== 0) {
					newOperators--;
					expression = NewOperator(expression, args);
				}
				else {
					expression = FunctionCall(expression, args, strict);
				}
				continue;
			}
			break;
		}
		while (newOperators-- !== 0) {
			expression = NewOperator(expression, []);
		}
		lastLeftHandSide = expression;
		return expression;
	}

	function readArguments() {
		var args = [];
		proceedToken();
		if (!testToken(')')) {
			while (true) {
				args.push(readAssignmentExpression());
				if (testToken(')')) {
					break;
				}
				expectingToken(',');
			}
		}
		return args;
	}

	function readFunctionExpression() {
		proceedToken();
		if (!testToken('(')) {
			var name = expectingIdentifier();
			expectingToken('(');
		}
		var parameters = [];
		if (!testToken(')')) {
			while (true) {
				parameters.push(expectingIdentifier());
				if (testToken(')')) {
					break;
				}
				expectingToken(',');
			}
		}
		expectingToken('{');
		var body = readFunctionBody();
		expectingToken('}');
		if (body.strict) {
			disallowEvalOrArguments(name);
			disallowDuplicated(parameters);
			parameters.forEach(disallowEvalOrArguments);
		}
		return FunctionExpression(name, parameters, body);
	}

	function readPrimaryExpression() {
		if (isNumericLiteral || isStringLiteral) {
			var expression = Literal(value);
			proceedToken();
			return expression;
		}
		if (isIdentifierName && !isReservedWord(token)) {
			var identifier = proceedToken();
			var expression = IdentifierReference(identifier, strict);
			lastIdentifierReference = expression;
			lastIdentifier = identifier;
			lastReference = expression;
			return expression;
		}
		if (token === '/' || token === '/=') {
			setPosition(tokenPos);
			value = readRegExpLiteral();
			skipSpaces();
			proceedToken();
			var expression = RegExpLiteral(value);
			if (expression === undefined) throw VMSyntaxError();
			return expression;
		}
		switch (proceedToken()) {
		case "this":
			return ThisExpression();
		case "null":
			return Literal(null);
		case "false":
			return Literal(false);
		case "true":
			return Literal(true);
		case '[':
			var elements = [];
			while (true) {
				while (testToken(',')) {
					elements.push(empty);
				}
				if (testToken(']')) {
					elements.push(empty);
					break;
				}
				elements.push(readAssignmentExpression());
				if (testToken(']')) {
					break;
				}
				expectingToken(',');
			}
			return ArrayInitialiser(elements);
		case '{':
			var elements = [];
			var defined = {};
			while (true) {
				if (testToken('}')) {
					break;
				}
				elements.push(readPropertyAssignment(defined));
				if (testToken('}')) {
					break;
				}
				expectingToken(',');
			}
			return ObjectInitialiser(elements);
		case '(':
			var expression = readExpression();
			expectingToken(')');
			return expression;
		}
		throw VMSyntaxError();
	}

	function readPropertyAssignment(defined) {
		var name = expectingPropertyName();
		if (token === ':') {
			var type = 1;
			proceedToken();
			var expression = readAssignmentExpression();
			var a = PropertyAssignment(name, expression);
		}
		else if (name === "get") {
			var type = 2;
			name = expectingPropertyName();
			expectingToken('(');
			expectingToken(')');
			expectingToken('{');
			var body = readFunctionBody();
			expectingToken('}');
			var a = PropertyAssignmentGet(name, body);
		}
		else if (name === "set") {
			var type = 4;
			name = expectingPropertyName();
			expectingToken('(');
			var identifier = expectingIdentifier();
			expectingToken(')');
			expectingToken('{');
			var body = readFunctionBody();
			expectingToken('}');
			if (body.strict) {
				disallowEvalOrArguments(identifier);
			}
			var a = PropertyAssignmentSet(name, identifier, body);
		}
		else {
			expectingToken(':');
		}
		var previous = defined[name];
		if (previous !== undefined) {
			if ((strict && (previous & 1) !== 0 && (type & 1) !== 0) //
					|| ((previous & 1) !== 0 && (type & 6) !== 0) //
					|| ((previous & 6) !== 0 && (type & 1) !== 0) //
					|| ((previous & 6) !== 0 && (type & 6) !== 0 && (previous & type) !== 0)) throw VMSyntaxError();
			defined[name] = (previous | type);
		}
		else {
			defined[name] = type;
		}
		return a;
	}

	function disallowDuplicated(parameters) {
		for (var i = 0; i < parameters.length; i++) {
			for (var j = 0; j < i; j++) {
				if (parameters[i] === parameters[j]) throw VMSyntaxError();
			}
		}
	}

	function disallowEvalOrArguments(identifier) {
		if (identifier === "eval" || identifier === "arguments") throw VMSyntaxError();
	}

	function testToken(t) {
		if (token === t) {
			proceedToken();
			return true;
		}
		return false;
	}

	function expectingToken(t) {
		if (token === t) {
			proceedToken();
			return;
		}
		throw VMSyntaxError();
	}

	function expectingAutoSemicolon() {
		if (token === ';') {
			proceedToken();
			return;
		}
		if (isLineSeparatedAhead || token === '}') return;
		throw VMSyntaxError();
	}

	function expectingIdentifier() {
		if (isIdentifierName && !isReservedWord(token)) return proceedToken();
		throw VMSyntaxError();
	}

	function expectingIdentifierName() {
		if (isIdentifierName) return proceedToken();
		throw VMSyntaxError();
	}

	function expectingPropertyName() {
		if (isIdentifierName) return proceedToken();
		if (isStringLiteral) {
			var name = value;
			proceedToken();
			return name;
		}
		if (isNumericLiteral) {
			var name = ToString(value);
			proceedToken();
			return name;
		}
		throw VMSyntaxError();
	}

	function isReservedWord(v) {
		switch (v) {
		case "null":
		case "true":
		case "false":
		case "break":
		case "case":
		case "catch":
		case "continue":
		case "debugger":
		case "default":
		case "delete":
		case "do":
		case "else":
		case "finally":
		case "for":
		case "function":
		case "if":
		case "in":
		case "instanceof":
		case "new":
		case "return":
		case "switch":
		case "this":
		case "throw":
		case "try":
		case "typeof":
		case "var":
		case "void":
		case "while":
		case "with":
		case "class":
		case "const":
		case "enum":
		case "export":
		case "extends":
		case "import":
		case "super":
			return true;
		}
		if (strict) {
			switch (v) {
			case "implements":
			case "interface":
			case "let":
			case "package":
			case "private":
			case "protected":
			case "public":
			case "static":
			case "yield":
				return true;
			}
		}
		return false;
	}

	function proceedToken() {
		var t = token;
		isLineSeparatedAhead = isLineSeparatedBehind;
		tokenPos = currentPos;
		token = readToken();
		tokenEndPos = currentPos;
		skipSpaces();
		return t;
	}

	function skipSpaces() {
		isLineSeparatedBehind = false;
		while (true) {
			if (isWhiteSpace(current)) {
				proceed();
				continue;
			}
			if (current === undefined) {
				isLineSeparatedBehind = true;
				break;
			}
			if (isLineTerminator(current)) {
				proceed();
				isLineSeparatedBehind = true;
				continue;
			}
			if (current === '/') {
				var pos = currentPos;
				proceed();
				if (current === '/') {
					while (true) {
						var c = proceed();
						if (c === undefined || isLineTerminator(c)) {
							isLineSeparatedBehind = true;
							break;
						}
					}
					continue;
				}
				if (current === '*') {
					proceed();
					while (true) {
						if (current === undefined) throw VMSyntaxError();
						var c = proceed();
						if (isLineTerminator(c)) {
							isLineSeparatedBehind = true;
						}
						if (c === '*' && current === '/') {
							proceed();
							break;
						}
					}
					continue;
				}
				setPosition(pos);
			}
			break;
		}
	}

	function readToken() {
		isNumericLiteral = false;
		isStringLiteral = false;
		isIdentifierName = false;
		isEscaped = false;
		if (current === undefined) return undefined;
		var c = proceed();
		switch (c) {
		case '{':
		case '}':
		case '(':
		case ')':
		case '[':
		case ']':
		case ';':
		case ',':
		case '~':
		case '?':
		case ':':
			break;
		case '.':
			if (isDecimalDigitChar(current)) {
				isNumericLiteral = true;
				setPosition(tokenPos);
				value = readNumericLiteral();
				if (current === '\\' || isIdentifierStart(current)) throw VMSyntaxError();
				return '';
			}
			break;
		case '<':
			current === '<' && proceed();
			current === '=' && proceed();
			break;
		case '>':
			current === '>' && proceed();
			current === '>' && proceed();
			current === '=' && proceed();
			break;
		case '=':
		case '!':
			current === '=' && proceed();
			current === '=' && proceed();
			break;
		case '+':
		case '-':
		case '&':
		case '|':
			if (current === c) {
				proceed();
				break;
			}
			current === '=' && proceed();
			break;
		case '*':
		case '%':
		case '^':
		case '/':
			current === '=' && proceed();
			break;
		case '0':
		case '1':
		case '2':
		case '3':
		case '4':
		case '5':
		case '6':
		case '7':
		case '8':
		case '9':
			isNumericLiteral = true;
			setPosition(tokenPos);
			value = readNumericLiteral();
			if (current === '\\' || isIdentifierStart(current)) throw VMSyntaxError();
			return '';
		case '"':
		case "'":
			isStringLiteral = true;
			var t = c;
			while (true) {
				if (current === undefined || isLineTerminator(current)) throw VMSyntaxError();
				var c = proceed();
				if (c === t) {
					value = source.substring(tokenPos + 1, currentPos - 1);
					break;
				}
				if (c === '\\') {
					isEscaped = true;
					setPosition(tokenPos);
					value = readEscapedStringLiteral();
					break;
				}
			}
			return '';
		default:
			isIdentifierName = true;
			if (c === '\\') {
				isEscaped = true;
				setPosition(tokenPos);
				return readEscapedIdentifierName();
			}
			if (!isIdentifierStart(c)) throw VMSyntaxError();
			while (true) {
				if (current === '\\') {
					isEscaped = true;
					setPosition(tokenPos);
					return readEscapedIdentifierName();
				}
				if (!isIdentifierPart(current)) {
					break;
				}
				proceed();
			}
			break;
		}
		return source.substring(tokenPos, currentPos);
	}

	function readNumericLiteral() {
		var startPos = currentPos;
		if (current === '0') {
			proceed();
			if (current === 'X' || current === 'x') {
				proceed();
				if (!isHexDigitChar(current)) throw VMSyntaxError();
				while (isHexDigitChar(current)) {
					proceed();
				}
				return Number(source.substring(startPos, currentPos));
			}
			if (isOctalDigitChar(current)) {
				if (strict || STRICT_CONFORMANCE) throw VMSyntaxError();
				var x = mvDigitChar(proceed());
				while (isOctalDigitChar(current)) {
					x = (x << 3) + mvDigitChar(proceed());
				}
				return x;
			}
			if (current === '8' || current === '9') throw VMSyntaxError();
		}
		while (isDecimalDigitChar(current)) {
			proceed();
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
		return Number(source.substring(startPos, currentPos));
	}

	function readRegExpLiteral() {
		var pos = currentPos;
		proceed();
		while (true) {
			if (current === undefined || isLineTerminator(current)) throw VMSyntaxError();
			var c = proceed();
			if (c === '/') {
				break;
			}
			if (c === '\\') {
				if (current === undefined || isLineTerminator(current)) throw VMSyntaxError();
				proceed();
			}
			if (c === '[') {
				while (true) {
					if (current === undefined || isLineTerminator(current)) throw VMSyntaxError();
					var c = proceed();
					if (c === ']') {
						break;
					}
					if (c === '\\') {
						proceed();
					}
				}
			}
		}
		var pattern = source.substring(pos + 1, currentPos - 1);
		var pos = currentPos;
		while (true) {
			c = readIdentifierPart();
			if (c === undefined) {
				break;
			}
		}
		var flags = source.substring(pos, currentPos);
		return RegExp_Construct([ pattern, flags ]);
	}

	function readEscapedStringLiteral() {
		var buffer = [];
		var t = proceed();
		while (true) {
			if (current === undefined || isLineTerminator(current)) throw VMSyntaxError();
			var c = proceed();
			if (c === t) {
				break;
			}
			if (c === '\\') {
				if (current === undefined || isLineTerminator(current)) {
					var c = proceed();
					if (c === '\r' && current === '\n') {
						proceed();
					}
					continue;
				}
				var c = proceed();
				switch (c) {
				case 'b':
					c = '\b';
					break;
				case 'f':
					c = '\f';
					break;
				case 'n':
					c = '\n';
					break;
				case 'r':
					c = '\r';
					break;
				case 't':
					c = '\t';
					break;
				case 'v':
					c = '\v';
					break;
				case 'x':
					var x = 0;
					for (var i = 0; i < 2; i++) {
						if (!isHexDigitChar(current)) throw VMSyntaxError();
						x = (x << 4) + mvDigitChar(proceed());
					}
					c = fromCharCode(x);
					break;
				case 'u':
					var x = 0;
					for (var i = 0; i < 4; i++) {
						if (!isHexDigitChar(current)) throw VMSyntaxError();
						x = (x << 4) + mvDigitChar(proceed());
					}
					c = fromCharCode(x);
					break;
				case '0':
				case '1':
				case '2':
				case '3':
					if (strict || STRICT_CONFORMANCE) {
						if (c === '0' && isDecimalDigitChar(current) !== true) {
							c = '\0';
							break;
						}
						throw VMSyntaxError();
					}
					var x = mvDigitChar(c);
					if (current === '8' || current === '9') throw VMSyntaxError();
					if (isOctalDigitChar(current)) {
						x = (x << 4) + mvDigitChar(proceed());
						if (current === '8' || current === '9') throw VMSyntaxError();
						if (isOctalDigitChar(current)) {
							x = (x << 4) + mvDigitChar(proceed());
						}
					}
					c = fromCharCode(x);
					break;
				case '4':
				case '5':
				case '6':
				case '7':
					if (strict || STRICT_CONFORMANCE) throw VMSyntaxError();
					var x = mvDigitChar(c);
					if (current === '8' || current === '9') throw VMSyntaxError();
					if (isOctalDigitChar(current)) {
						x = (x << 4) + mvDigitChar(proceed());
					}
					c = fromCharCode(x);
					break;
				case '8':
				case '9':
					throw VMSyntaxError();
				}
			}
			buffer.push(c);
		}
		return join(buffer);
	}

	function readEscapedIdentifierName() {
		var buffer = [];
		var c = readIdentifierPart();
		if (!isIdentifierStart(c)) throw VMSyntaxError();
		buffer.push(c);
		while (true) {
			c = readIdentifierPart();
			if (c === undefined) {
				break;
			}
			buffer.push(c);
		}
		return join(buffer);
	}

	function readIdentifierPart() {
		if (current === '\\') {
			proceed();
			if (current !== 'u') throw VMSyntaxError();
			proceed();
			var x = 0;
			for (var i = 0; i < 4; i++) {
				if (!isHexDigitChar(current)) throw VMSyntaxError();
				x = (x << 4) + mvDigitChar(proceed());
			}
			var c = fromCharCode(x);
			if (!isIdentifierPart(c)) throw VMSyntaxError();
			return c;
		}
		if (!isIdentifierPart(current)) return undefined;
		return proceed();
	}

	function proceed() {
		var c = current;
		if (c !== undefined) {
			current = source[++currentPos];
		}
		return c;
	}

	function setPosition(pos) {
		currentPos = pos;
		current = source[currentPos];
	}
}
