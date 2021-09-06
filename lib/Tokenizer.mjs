'use strict';

const { defineProperty } = Reflect;

const chars = {
  '(': 'LeftParen',
  ')': 'RightParen',
  '[': 'LeftBracket',
  ']': 'RightBracket',
  '{': 'LeftBrace',
  '}': 'RightBrace',
  '<': 'LeftAngle',
  '>': 'RightAngle'
};

class Token {
  constructor(token) {
    this.type = token.type;
    this.value = token.value;
    defineProperty(this, 'loc', { value: token.loc, writable: true });
    defineProperty(this, 'match', { value: token.match });
  }
}

const arrayify = v => typeof v === 'string' ? [v] : (Array.isArray(v) ? v : []);

const assert = (truthy, error) => {
  if (!truthy) throw error();
};

class Tokenizer {
  static REGEX_BOM = /^\ufeff/;
  static REGEX_EQUALITY_OPERATOR = /^(?:={2,3}|!={1,2})/;
  static REGEX_LOGICAL_OPERATOR = /^(?:\?\?|&&|\|\|)/;
  static REGEX_LOGICAL_OPERATOR_WORD = /^\s*(?:and|or|is not|not|isnt|is)(?!\w)\s*/;
  static REGEX_RELATIONAL_OPERATOR = /^(?:>={0,2}|<={0,2})/;
  static REGEX_OPERATOR = /^(={2,3}|!={1,2}|>={0,2}|<={0,2}|\?\?|&&|\|\||(?:(?:and|or|is not|not|isnt|is)(?!\w)))/;
  static REGEX_IDENT = /^([a-zA-Z_][-a-zA-Z0-9_]*|\.(?=[a-zA-Z_]))+/;
  static REGEX_MATH_OPERATOR = /^[-+/*]+/;
  static REGEX_NOT = /^!+/;
  static REGEX_NUMBER_LITERAL = /^([0-9]+(?:\.[0-9]+)?)/;
  static REGEX_SPACE = /^\s+/;
  static REGEX_STRING_LITERAL = /^(['"`])((?:\\.|(?!\1)[\s\S])*?)(\1)/;

  constructor(source, options) {
    this.options = { ...options };
    this.operators = arrayify(this.options.booleanLogicalOperators);
    this.source = Buffer.from(source);
    this.remaining = String(source);
    this.consumed = '';
    this.tokens = [];
    this.queue = [];
    this.index = 0;
  }

  isAllowed(type) {
    return this.operators.length === 0 || this.operators.includes(type);
  }

  eos() {
    return this.remaining === '' && this.queue.length === 0;
  }

  enqueue(token) {
    if (token) this.queue.push(token);
    return token;
  }

  dequeue() {
    return this.queue.shift();
  }

  lookbehind(n = 1) {
    assert(Number.isInteger(n), () => new Error('Expected a positive integer'));
    return this.tokens[this.tokens.length - n];
  }

  lookahead(n = 1) {
    assert(Number.isInteger(n), () => new Error('Expected a positive integer'));
    let fetch = n - this.queue.length;
    while (fetch-- > 0 && this.enqueue(this.advance()));
    return this.queue[--n];
  }

  peek(key) {
    return this.lookahead(1);
  }

  consume(value = '') {
    const length = value.length;
    this.remaining = this.remaining.slice(length);
    this.consumed += value;
    return value;
  }

  scan(regex, type = 'Text') {
    const match = regex.exec(this.remaining);
    if (match) {
      return new Token({ type, value: match[0], match });
    }
  }

  capture(regex, type) {
    const token = this.scan(regex, type);
    if (token) {
      this.consume(token.match[0]);
      return token;
    }
  }

  captureBom() {
    if (this.index > 0 || this.BOM) return;
    const token = this.capture(Tokenizer.REGEX_BOM, 'BOM');

    if (token) {
      this.BOM = true;
      this.index = 0;
      token.value = '';
      return token;
    }
  }

  captureOperator() {
    return this.capture(Tokenizer.REGEX_OPERATOR, 'ComparisonOperator');
  }

  captureMathOperator() {
    return this.capture(Tokenizer.REGEX_MATH_OPERATOR, 'MathOperator');
  }

  captureSpace() {
    const token = this.capture(Tokenizer.REGEX_SPACE, 'Space');
    if (token) {
      token.value = token.value.replace(/\t/g, '  ');
      return token;
    }
  }

  captureIdent() {
    return this.capture(Tokenizer.REGEX_IDENT, 'Identifier');
  }

  captureLiteral() {
    return this.capture(Tokenizer.REGEX_STRING_LITERAL, 'StringLiteral');
  }

  captureNot() {
    return this.capture(Tokenizer.REGEX_NOT, 'Not');
  }

  captureNumericLiteral() {
    return this.capture(Tokenizer.REGEX_NUMBER_LITERAL, 'NumericLiteral');
  }

  captureText() {
    const value = this.consume(this.remaining[0]);
    if (value) {
      const type = chars[value] || 'Text';
      const token = new Token({ type, value, match: [value] });
      return token;
    }
  }

  captureEqualityOperator() {
    return this.capture(Tokenizer.REGEX_EQUALITY_OPERATOR, 'EqualityOperator')
  }

  captureLogicalOperator() {
    return this.capture(Tokenizer.REGEX_LOGICAL_OPERATOR, 'LogicalOperator')
  }

  captureLogicalOperatorWord() {
    const token = this.capture(Tokenizer.REGEX_LOGICAL_OPERATOR_WORD, 'LogicalOperatorWord')
    if (token) {
      token.value = token.value.trim()
    }
    return token;
  }

  captureRelationalOperator() {
    return this.capture(Tokenizer.REGEX_RELATIONAL_OPERATOR, 'RelationalOperator')
  }

  advance() {
    if (this.eos()) return;
    return this.captureBom()
      || this.captureLiteral()
      || this.captureNumericLiteral()
      // || this.captureOperator()
      || this.captureEqualityOperator()
      || this.captureLogicalOperator()
      || this.captureLogicalOperatorWord()
      || this.captureRelationalOperator()
      || this.captureMathOperator()
      || this.captureSpace()
      || this.captureIdent()
      || this.captureNot()
      || this.captureText()
      || this.fail();
  }

  accept(type) {
    const next = this.peek();

    if (next?.type === type) {
      return this.next();
    }
  }

  next() {
    return this.dequeue() || this.advance();
  }

  prev() {
    let prev = this.tokens[this.tokens.length - 1];
    if (prev?.type === 'Space') {
      prev = this.tokens[this.tokens.length - 2];
    }
    return prev;
  }

  push(token) {
    if (!token) return;
    if (token === true) return;
    this.tokens.push(token);
    this.token = token;
    return token;
  }

  tokenize() {
    while (!this.eos()) this.push(this.next());
    return this.tokens;
  }

  fail() {
    throw new SyntaxError(`Unrecognized character: ${this.remaining[0]}`);
  }

  static tokenize = (input, options) => {
    const lexer = new this(input, options);
    return lexer.tokenize();
  }
}

export { Tokenizer };
export default Tokenizer;

// Arithmetic operators
// '+'
// '-'
// '/'
// '*'
// '%'
// '**'

// Relational operators
// 'instanceof'
// '<'
// '>'
// '<='
// '>='

// Equality operators
// '!=='
// '==='
// '!='
// '=='

// Bitwise shift operators
// '<<'
// '>>'
// '>>>'

// Binary bitwise operators
// '&'
// '|'
// '^'

// Binary logical operators
// '&&' // Logical AND.
// '||' // Logical OR.
// '??' // Nullish Coalescing Operator.

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.nodes = [];
    this.index = -1;
  }

  eos() {
    return this.index >= this.tokens.length - 1;
  }

  peek() {
    return this.tokens[this.index + 1];
  }

  next() {
    return this.tokens[++this.index];
  }

  look(type, n = 1) {
    const token = this.tokens[this.index + n];
    return token?.type === type;
  }

  push(token) {
    if (token && token?.type) {
      this.nodes.push(token);
      this.prev = token;
      return token;
    }
  }

  operator() {

  }

  unary() {

  }

  parse() {
    const token = this.next();
    if (!token);

    switch (token.type) {
      case 'LogicalOperatorWord':
        console.log(token)
        break;

      default: {
        this.push(token);
        this.parse();
        break;
      }
    }
  }
}

const tokens = Tokenizer.tokenize('1 and not 0');
const parser = new Parser(tokens);

parser.parse();
console.log(parser.nodes);
