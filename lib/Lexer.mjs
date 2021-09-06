'use strict';

import Tokenizer from './Tokenizer.mjs';
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

class Lexer {
  static REGEX_BOM = /^\ufeff/;
  static REGEX_COMPARISON_OPERATOR = /^(={2,3}|!={1,2}|>={0,2}|<={0,2}|\?\?|&&|\|\||(?:(?:and not|and|or not|or|is not|not|isnt|is)(?!\w)))/;
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
    const token = this.capture(Lexer.REGEX_BOM, 'BOM');

    if (token) {
      this.BOM = true;
      this.index = 0;
      token.value = '';
      return token;
    }
  }

  captureComparisonOperator() {
    const token = this.capture(Lexer.REGEX_COMPARISON_OPERATOR, 'ComparisonOperator');
    if (token) {
      if (!this.isAllowed(token.value)) return token;

      const prev = this.prev();
      if (token.value === 'is' && !this.eos()) {
        token.output = '===';
      }

      if (token.value === 'and not' && !this.eos()) {
        token.output = this.eos() ? '&& not' : '&& !';
        this.accept('Space');
      }

      if (token.value === 'or not') {
        token.output = this.eos() ? '|| not' : '|| !';
        this.accept('Space');
      }

      if ((token.value === 'isnt' || token.value === 'is not') && !this.eos()) {
        token.output = '!==';

        if (prev?.type === 'ComparisonOperator' && !this.eos()) {
          const space = this.accept('Space');

          if (this.peek().type === 'Identifier') {
            token.output = '!';
            this.accept('Space');
          } else {
            token.output += space.value;
          }
        }
      }

      if (token.value === 'not' && !this.eos()) {
        this.accept('Space');
        token.output = '!';
      }

      if (token.value === 'and' && !this.eos()) token.output = '&&';
      if (token.value === 'or' && !this.eos()) token.output = '||';

      if (prev?.type === 'ComparisonOperator' && prev?.prev?.type !== 'Identifier' && !prev?.prev?.type.startsWith('Right')) {
        if (prev.output !== '!') {
          prev.output = prev.value;
          prev.type = 'Identifier';
        }
      }

      if (prev?.type !== 'Space') {
        Reflect.defineProperty(token, 'prev', { value: prev });
      }

      return token;
    }
  }

  captureMathOperator() {
    return this.capture(Lexer.REGEX_MATH_OPERATOR, 'MathOperator');
  }

  captureSpace() {
    const token = this.capture(Lexer.REGEX_SPACE, 'Space');
    if (token) {
      token.value = token.value.replace(/\t/g, '  ');
      return token;
    }
  }

  captureIdent() {
    const token = this.capture(Lexer.REGEX_IDENT, 'Identifier');
    if (token) {
      if (token.value === 'defined') {
        const prev = this.prev();
        if (prev?.type === 'ComparisonOperator') {
          const key = prev.output ? 'output' : 'value';
          prev[key] = (prev[key][0] === '!' ? '=' : '!') + prev[key].slice(1);
          token.value = 'undefined';
        }
      }
      return token;
    }
  }

  captureLiteral() {
    return this.capture(Lexer.REGEX_STRING_LITERAL, 'StringLiteral');
  }

  captureNot() {
    return this.capture(Lexer.REGEX_NOT, 'Not');
  }

  captureNumericLiteral() {
    return this.capture(Lexer.REGEX_NUMBER_LITERAL, 'NumericLiteral');
  }

  captureText() {
    const value = this.consume(this.remaining[0]);
    if (value) {
      const type = chars[value] || 'Text';
      const token = new Token({ type, value, match: [value] });
      return token;
    }
  }

  advance() {
    if (this.eos()) return;
    return this.captureBom()
      || this.captureLiteral()
      || this.captureNumericLiteral()
      || this.captureComparisonOperator()
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

  lex() {
    while (!this.eos()) this.push(this.next());
    return this.tokens;
  }

  tokenize() {
    return this.lex();
  }

  fail() {
    throw new SyntaxError(`Unrecognized character: ${this.remaining[0]}`);
  }

  static tokenize = (input, options) => {
    const lexer = new this(input, options);
    return lexer.tokenize();
  }

  static transform = (tokens, options) => {
    if (typeof tokens === 'string') tokens = this.tokenize(tokens, options);
    return tokens.map(t => t.output || t.value).join('');
  }
}

export { Lexer };
export default Lexer;
