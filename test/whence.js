'use strict';

require('mocha');
const assert = require('assert').strict;
const whence = require('..');

describe('whence', () => {
  it.skip('should throw an error when expression is unsafe', () => {
    assert.throws(() => whence('delete this.constructor'), /unexpected identifier/i);
    assert.throws(() => whence('const foo = "bar"'), /unexpected identifier/i);
    assert.throws(() => whence('let foo = "bar"'), /unexpected identifier/i);
    assert.throws(() => whence('var foo = "bar"'), /unexpected identifier/i);
  });

  it('should compare numbers', () => {
    assert(whence('9 === 9'));
    assert(!(whence('9 === 8')));
    assert(whence('9 > 8'));
    assert(!(whence('9 < 8')));
    assert(!(whence('9 <= 8')));
    assert(whence('-.1 >= -.2'));
    assert(whence('-0.1 >= -0.2'));
    assert(whence('-1 >= -2'));
    assert(whence('+1 <= +2'));
    assert(whence('9 >= 8'));
    assert(whence('9.1 >= 9.01'));
    assert(whence('-1 === -1'));
  });

  it('should compare booleans', () => {
    assert((whence('false === false')));
    assert((whence('true === true')));

    assert((!(whence('true === false'))));
    assert((!(whence('true===false'))));

    assert((!(whence('false || false'))));
    assert((!(whence('false||false'))));

    assert((whence('true || false')));
    assert((whence('true||false')));

    assert((whence('true || true')));
    assert((whence('true||true')));

    assert((!(whence('false && false'))));
    assert((!(whence('false&&false'))));

    assert((!(whence('true && false'))));
    assert((!(whence('true&&false'))));

    assert((whence('true && true')));
    assert((whence('true&&true')));
  });

  it('should compare strings', () => {
    assert((whence('"foo" === "foo"')));
    assert((whence('"bar" === "bar"')));

    assert((!(whence('"bar" === "foo"'))));
    assert((!(whence('"bar"==="foo"'))));

    assert((whence('"foo" || "foo"')));
    assert((whence('"foo"||"foo"')));

    assert((whence('"bar" || "foo"')));
    assert((whence('"bar"||"foo"')));

    assert((whence('"bar" || "bar"')));
    assert((whence('"bar"||"bar"')));

    assert((whence('"foo" && "foo"')));
    assert((whence('"foo"&&"foo"')));

    assert((whence('"bar" && "foo"')));
    assert((whence('"bar"&&"foo"')));

    assert((whence('"bar" && "bar"')));
    assert((whence('"bar"&&"bar"')));
  });

  it('should support null and undefined', () => {
    assert.equal(whence('void (0)'), undefined);
    assert.equal(whence('void (42)'), undefined);
    assert.equal(whence('void 42'), undefined);
    assert.equal(whence('void 0'), undefined);
    assert.equal(whence('undefined'), undefined);
    assert.equal(whence('null'), null);
    assert.equal(whence('"null"'), 'null');
  });

  it('should compare null and undefined', () => {
    assert((whence('undefined === void (0)')));
    assert((whence('undefined === void (42)')));
    assert((whence('undefined === void 42')));
    assert((whence('undefined === void 0')));
    assert((whence('undefined === undefined')));
    assert((whence('null === null')));
    assert((!(whence('undefined === null'))));
  });

  it('should support unary operators', () => {
    assert.equal(whence('-9'), -9);
    assert.equal(whence('+9'), 9);
  });

  it('should use unary operators on nested properties', () => {
    const context = {
      a: { b: { c: '10' } }
    };
    assert.equal(whence('-a.b.c', context), -10);
  });

  it('should return the type of value', () => {
    assert.equal(whence('typeof 1'), 'number');
    assert.equal(whence('typeof "1"'), 'string');
    assert.equal(whence('typeof null'), 'object');
    assert.equal(whence('typeof "null"'), 'string');
    assert.equal(whence('typeof true'), 'boolean');
    assert.equal(whence('typeof false'), 'boolean');
  });

  it('should do comparisons with typeof', () => {
    assert((whence('typeof 1 === "number"')));
    assert((whence('typeof "foo" === "string"')));
    assert((!(whence('typeof "foo" !== "string"'))));
    assert((!(whence('typeof "bar" === "number"'))));
    assert((whence('typeof "baz" !== "number"')));
    assert((whence('typeof "foo" === typeof "baz"')));
    assert((whence('typeof 9 === typeof 10')));
    assert((!(whence('typeof 9 === typeof "bar"'))));
    assert((!(whence('typeof 9 === typeof "baz"'))));
    assert((whence('typeof "num" !== typeof -9')));
    assert((whence('typeof "foo" == typeof "baz"')));
    assert((whence('typeof 9 == typeof 10')));
    assert((!(whence('typeof 9 == typeof "bar"'))));
  });

  it('should compare values with unary operators', () => {
    assert((!(whence('typeof -9 === typeof "baz"'))));
    assert((!(whence('typeof +9 !== typeof -9'))));
    assert((whence('+9 !== -9')));
    assert((whence('+9 === +9')));
    assert((whence('-9 === -9')));
    assert((!(whence('+9 !== +9'))));
    assert((!(whence('-9 !== -9'))));
  });

  it('should support multiple comparisons with &&', () => {
    assert((whence('1 !== 2 && 5 === 5')));
    assert((whence('(1 !== 2) && (5 === 5)')));
    assert((whence('(1 !== 2) && (5 === 5) && ("foo" !== "bar")')));
  });

  it('should support multiple comparisons with ||', () => {
    assert((whence('1 !== 2 || 5 === 5')));
    assert((whence('(1 !== 2) || (5 === 5)')));
    assert((whence('(1 !== 2) || (5 === 5) || ("foo" !== "bar")')));
  });

  it('should support multiple comparisons with || and &&', () => {
    assert((whence('(1 !== 2 || 5 === 5) && "foo" !== true')));
    assert((whence('(1 === 2 || 5 === 5) && "foo" !== true')));
    assert((!(whence('(1 !== 2) && (0 && 5)'))));
    assert((whence('(1 !== 2) && (0 || 5)')));
    assert((whence('(1 !== 2) || (5 === 5) && ("foo" !== "bar")')));
    assert((whence('(1 !== 2) || ((5 === 5) && ("foo" !== "bar"))')));
    assert((whence('((1 !== 2) || ((5 === 5) && ("foo" !== "bar")))')));
  });

  it('should support negated conditions', () => {
    assert(!(whence('!value', { value: 'abc' })));
    assert((whence('!!value', { value: 'abc' })));
    assert((whence('value === "abc"', { value: 'abc' })));
    assert(!(whence('!!value === false', { value: 'abc' })));
    assert(!(whence('!value === true', { value: 'abc' })));
    assert((whence('!!value === true', { value: 'abc' })));
    assert((whence('!value === false', { value: 'abc' })));
    assert(!(whence('(value === false)', { value: 'abc' })));
    assert((whence('!(value === false)', { value: 'abc' })));
    assert(!(whence('!!(value === false)', { value: 'abc' })));
  });

  it('should support context functions', () => {
    const context = {
      a: 1,
      b: 1,
      c: 'foo',
      isEqual(a, b) {
        return a === b;
      },
      allEqual(...args) {
        return args.every(e => e === args[0]);
      }
    };

    assert(!(whence('allEqual("foo", "foo", "bar")', context)));
    assert((whence('allEqual("foo", "foo", "foo")', context)));
    assert((whence('isEqual("foo", "foo")', context)));
    assert((whence('isEqual(a, b)', context)));
    assert(!(whence('isEqual(b, c)', context)));
    assert(!(whence('allEqual(a, b, c)', context)));
    assert(!(whence('allEqual(a, b, b, a, b, a, c)', context)));
    assert((whence('allEqual(isEqual(a, b), isEqual(b, b))', context)));
    assert(!(whence('allEqual(isEqual(a, b), isEqual(b, c))', context)));
  });

  it('should support helper functions', () => {
    const helpers = {
      isEqual(a, b) {
        return a === b;
      },
      allEqual(...args) {
        return args.every(e => e === args[0]);
      }
    };

    const context = {
      a: 1,
      b: 1,
      c: 'foo'
    };

    assert(!(whence('allEqual("foo", "foo", "bar")', context, { helpers })));
    assert((whence('allEqual("foo", "foo", "foo")', context, { helpers })));
    assert((whence('isEqual("foo", "foo")', context, { helpers })));
    assert((whence('isEqual(a, b)', context, { helpers })));
    assert(!(whence('isEqual(b, c)', context, { helpers })));
    assert(!(whence('allEqual(a, b, c)', context, { helpers })));
    assert(!(whence('allEqual(a, b, b, a, b, a, c)', context, { helpers })));
    assert((whence('allEqual(isEqual(a, b), isEqual(b, b))', context, { helpers })));
    assert(!(whence('allEqual(isEqual(a, b), isEqual(b, c))', context, { helpers })));
  });

  it('should override helper functions with context functions', () => {
    const helpers = {
      print(word) {
        return word.toLowerCase();
      }
    };

    const context = {
      print(word) {
        return word.toUpperCase() + word.toUpperCase();
      }
    };

    assert(whence('print("bar") === "BARBAR"', context, { helpers }));
    assert(whence('print("foo") !== "foo"', context, { helpers }));
    assert(!whence('print("bar") === "FOOFOO"', context, { helpers }));
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
      x: { y: { z: 42 } }
    };

    assert((whence('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))', context)));
    assert((whence('((typeof foo === "string") && (typeof bar !== "string"))', context)));
    assert((whence('((baz === "qux") && (a <= b) || (c >= d) || (e > f))', context)));
    assert((whence('((baz === "qux") && ((a != "b") && (c != "d")) || (e != f))', context)));
    assert((whence('typeof +d.e.f === typeof x.y.z', context)));
    assert((whence('typeof +d.e.f === typeof 10', context)));
  });
});
