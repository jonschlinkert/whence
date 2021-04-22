'use strict';

require('mocha');
const assert = require('assert').strict;
const { evaluate } = require('../tmp/index');

describe('evaluate', () => {
  it('should compare numbers', () => {
    assert(evaluate('9 === 9'));
    assert(!evaluate('9 === 8'));
    assert(evaluate('9 > 8'));
    assert(!evaluate('9 < 8'));
    assert(!evaluate('9 <= 8'));
    assert(evaluate('-.1 >= -.2'));
    assert(evaluate('-0.1 >= -0.2'));
    assert(evaluate('-1 >= -2'));
    assert(evaluate('+1 <= +2'));
    assert(evaluate('9 >= 8'));
    assert(evaluate('9.1 >= 9.01'));
    assert(evaluate('-1 === -1'));
  });

  it('should compare booleans', () => {
    assert(evaluate('false === false'));
    assert(evaluate('true === true'));

    assert(!evaluate('true === false'));
    assert(!evaluate('true===false'));

    assert(!evaluate('false || false'));
    assert(!evaluate('false||false'));

    assert(evaluate('true || false'));
    assert(evaluate('true||false'));

    assert(evaluate('true || true'));
    assert(evaluate('true||true'));

    assert(!evaluate('false && false'));
    assert(!evaluate('false&&false'));

    assert(!evaluate('true && false'));
    assert(!evaluate('true&&false'));

    assert(evaluate('true && true'));
    assert(evaluate('true&&true'));
  });

  it('should compare strings', () => {
    assert(evaluate('"foo" === "foo"'));
    assert(evaluate('"bar" === "bar"'));

    assert(!evaluate('"bar" === "foo"'));
    assert(!evaluate('"bar"==="foo"'));

    assert(evaluate('"foo" || "foo"'));
    assert(evaluate('"foo"||"foo"'));

    assert(evaluate('"bar" || "foo"'));
    assert(evaluate('"bar"||"foo"'));

    assert(evaluate('"bar" || "bar"'));
    assert(evaluate('"bar"||"bar"'));

    assert(evaluate('"foo" && "foo"'));
    assert(evaluate('"foo"&&"foo"'));

    assert(evaluate('"bar" && "foo"'));
    assert(evaluate('"bar"&&"foo"'));

    assert(evaluate('"bar" && "bar"'));
    assert(evaluate('"bar"&&"bar"'));
  });

  it('should support null and undefined', () => {
    assert.equal(evaluate('void (0)'), undefined);
    assert.equal(evaluate('void (42)'), undefined);
    assert.equal(evaluate('void 42'), undefined);
    assert.equal(evaluate('void 0'), undefined);
    assert.equal(evaluate('undefined'), undefined);
    assert.equal(evaluate('null'), null);
    assert.equal(evaluate('"null"'), 'null');
  });

  it('should compare null and undefined', () => {
    assert(evaluate('undefined === void (0)'));
    assert(evaluate('undefined === void (42)'));
    assert(evaluate('undefined === void 42'));
    assert(evaluate('undefined === void 0'));
    assert(evaluate('undefined === undefined'));
    assert(evaluate('null === null'));
    assert(!evaluate('undefined === null'));
  });

  it('should support unary operators', () => {
    assert.equal(evaluate('-9'), -9);
    assert.equal(evaluate('+9'), 9);
  });

  it('should use unary operators on nested properties', () => {
    const context = {
      a: { b: { c: '10' } }
    };
    assert.equal(evaluate('-a.b.c', context), -10);
  });

  it('should return the type of value', () => {
    assert.equal(evaluate('typeof 1'), 'number');
    assert.equal(evaluate('typeof "1"'), 'string');
    assert.equal(evaluate('typeof null'), 'object');
    assert.equal(evaluate('typeof "null"'), 'string');
    assert.equal(evaluate('typeof true'), 'boolean');
    assert.equal(evaluate('typeof false'), 'boolean');
  });

  it('should do comparisons with typeof', () => {
    assert(evaluate('typeof 1 === "number"'));
    assert(evaluate('typeof "foo" === "string"'));
    assert(!evaluate('typeof "foo" !== "string"'));
    assert(!evaluate('typeof "bar" === "number"'));
    assert(evaluate('typeof "baz" !== "number"'));
    assert(evaluate('typeof "foo" === typeof "baz"'));
    assert(evaluate('typeof 9 === typeof 10'));
    assert(!evaluate('typeof 9 === typeof "bar"'));
    assert(!evaluate('typeof 9 === typeof "baz"'));
    assert(evaluate('typeof "num" !== typeof -9'));
    assert(evaluate('typeof "foo" == typeof "baz"'));
    assert(evaluate('typeof 9 == typeof 10'));
    assert(!evaluate('typeof 9 == typeof "bar"'));
  });

  it('should compare values with unary operators', () => {
    assert(!evaluate('typeof -9 === typeof "baz"'));
    assert(!evaluate('typeof +9 !== typeof -9'));
    assert(evaluate('+9 !== -9'));
    assert(evaluate('+9 === +9'));
    assert(evaluate('-9 === -9'));
    assert(!evaluate('+9 !== +9'));
    assert(!evaluate('-9 !== -9'));
  });

  it('should support multiple comparisons with &&', () => {
    assert(evaluate('1 !== 2 && 5 === 5'));
    assert(evaluate('(1 !== 2) && (5 === 5)'));
    assert(evaluate('(1 !== 2) && (5 === 5) && ("foo" !== "bar")'));
  });

  it('should support multiple comparisons with ||', () => {
    assert(evaluate('1 !== 2 || 5 === 5'));
    assert(evaluate('(1 !== 2) || (5 === 5)'));
    assert(evaluate('(1 !== 2) || (5 === 5) || ("foo" !== "bar")'));
  });

  it('should support multiple comparisons with || and &&', () => {
    assert(evaluate('(1 !== 2 || 5 === 5) && "foo" !== true'));
    assert(evaluate('(1 === 2 || 5 === 5) && "foo" !== true'));
    assert(!evaluate('(1 !== 2) && (0 && 5)'));
    assert(evaluate('(1 !== 2) && (0 || 5)'));
    assert(evaluate('(1 !== 2) || (5 === 5) && ("foo" !== "bar")'));
    assert(evaluate('(1 !== 2) || ((5 === 5) && ("foo" !== "bar"))'));
    assert(evaluate('((1 !== 2) || ((5 === 5) && ("foo" !== "bar")))'));
  });

  it('should support negated conditions', () => {
    assert(!evaluate('!value', { value: 'abc' }));
    assert(evaluate('!!value', { value: 'abc' }));
    assert(evaluate('value === "abc"', { value: 'abc' }));
    assert(!evaluate('!!value === false', { value: 'abc' }));
    assert(!evaluate('!value === true', { value: 'abc' }));
    assert(evaluate('!!value === true', { value: 'abc' }));
    assert(evaluate('!value === false', { value: 'abc' }));
    assert(!evaluate('(value === false)', { value: 'abc' }));
    assert(evaluate('!(value === false)', { value: 'abc' }));
    assert(!evaluate('!!(value === false)', { value: 'abc' }));
  });

  it('should support functions', () => {
    const context = {
      a: 1,
      b: 1,
      c: 'foo',
      isEqual(a, b) {
        return a === b;
      },
      allEqual(...args) {
        // console.log(args.join(', '));
        return args.every(e => e === args[0]);
      }
    };

    assert(!evaluate('allEqual("foo", "foo", "bar")', context));
    assert(evaluate('allEqual("foo", "foo", "foo")', context));
    assert(evaluate('isEqual("foo", "foo")', context));
    assert(evaluate('isEqual(a, b)', context));
    assert(!evaluate('isEqual(b, c)', context));
    assert(!evaluate('allEqual(a, b, c)', context));
    assert(!evaluate('allEqual(a, b, b, a, b, a, c)', context));
    assert(evaluate('allEqual(isEqual(a, b), isEqual(b, b))', context));
    assert(!evaluate('allEqual(isEqual(a, b), isEqual(b, c))', context));
  });

  it('should support multiple comparisons a context', () => {
    const context = {
      a: 1,
      b: 1,
      c: 'foo',
      foo: 'This is foo!',
      bar: 8,
      baz: 'qux',
      bool: true,
      num: '-9',
      d: { e: { f: '21' } },
      x: { y: { z: 42 } },
      focused: { editable: true },
      string: false
    };

    assert(evaluate('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))', context));
    assert(evaluate('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))', context));
    assert(evaluate('((typeof foo === "string") && (typeof bar !== "string"))', context));
    assert(evaluate('((baz === "qux") && (a <= b) || (c >= d) || (e > f))', context));
    assert(evaluate('((baz === "qux") && ((a != "b") && (c != "d")) || (e != f))', context));
    assert(evaluate('typeof +d.e.f === typeof x.y.z', context));
    assert(evaluate('typeof +d.e.f === typeof 10', context));
    assert.equal(evaluate('string || focused.editable', context), true);
    assert.equal(evaluate('string && focused.editable', context), false);
    assert.equal(evaluate('!!(string && focused.editable)', context), false);
  });
});
