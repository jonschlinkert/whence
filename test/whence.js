'use strict';

require('mocha');
const assert = require('assert').strict;
const whence = require('../tmp/index');

describe('whence', () => {
  it('should compare numbers', async () => {
    assert(await whence('9 === 9'));
    assert(!(await whence('9 === 8')));
    assert(await whence('9 > 8'));
    assert(!(await whence('9 < 8')));
    assert(!(await whence('9 <= 8')));
    assert(await whence('-.1 >= -.2'));
    assert(await whence('-0.1 >= -0.2'));
    assert(await whence('-1 >= -2'));
    assert(await whence('+1 <= +2'));
    assert(await whence('9 >= 8'));
    assert(await whence('9.1 >= 9.01'));
    assert(await whence('-1 === -1'));
  });

  it('should compare booleans', async () => {
    assert((await whence('false === false')));
    assert((await whence('true === true')));

    assert((!(await whence('true === false'))));
    assert((!(await whence('true===false'))));

    assert((!(await whence('false || false'))));
    assert((!(await whence('false||false'))));

    assert((await whence('true || false')));
    assert((await whence('true||false')));

    assert((await whence('true || true')));
    assert((await whence('true||true')));

    assert((!(await whence('false && false'))));
    assert((!(await whence('false&&false'))));

    assert((!(await whence('true && false'))));
    assert((!(await whence('true&&false'))));

    assert((await whence('true && true')));
    assert((await whence('true&&true')));
  });

  it('should compare strings', async () => {
    assert((await whence('"foo" === "foo"')));
    assert((await whence('"bar" === "bar"')));

    assert((!(await whence('"bar" === "foo"'))));
    assert((!(await whence('"bar"==="foo"'))));

    assert((await whence('"foo" || "foo"')));
    assert((await whence('"foo"||"foo"')));

    assert((await whence('"bar" || "foo"')));
    assert((await whence('"bar"||"foo"')));

    assert((await whence('"bar" || "bar"')));
    assert((await whence('"bar"||"bar"')));

    assert((await whence('"foo" && "foo"')));
    assert((await whence('"foo"&&"foo"')));

    assert((await whence('"bar" && "foo"')));
    assert((await whence('"bar"&&"foo"')));

    assert((await whence('"bar" && "bar"')));
    assert((await whence('"bar"&&"bar"')));
  });

  it('should support null and undefined', async () => {
    assert.equal(await whence('void (0)'), undefined);
    assert.equal(await whence('void (42)'), undefined);
    assert.equal(await whence('void 42'), undefined);
    assert.equal(await whence('void 0'), undefined);
    assert.equal(await whence('undefined'), undefined);
    assert.equal(await whence('null'), null);
    assert.equal(await whence('"null"'), 'null');
  });

  it('should compare null and undefined', async () => {
    assert((await whence('undefined === void (0)')));
    assert((await whence('undefined === void (42)')));
    assert((await whence('undefined === void 42')));
    assert((await whence('undefined === void 0')));
    assert((await whence('undefined === undefined')));
    assert((await whence('null === null')));
    assert((!(await whence('undefined === null'))));
  });

  it('should support unary operators', async () => {
    assert.equal(await whence('-9'), -9);
    assert.equal(await whence('+9'), 9);
  });

  it('should use unary operators on nested properties', async () => {
    const context = {
      a: { b: { c: '10' } }
    };
    assert.equal(await whence('-a.b.c', context), -10);
  });

  it('should return the type of value', async () => {
    assert.equal(await whence('typeof 1'), 'number');
    assert.equal(await whence('typeof "1"'), 'string');
    assert.equal(await whence('typeof null'), 'object');
    assert.equal(await whence('typeof "null"'), 'string');
    assert.equal(await whence('typeof true'), 'boolean');
    assert.equal(await whence('typeof false'), 'boolean');
  });

  it('should do comparisons with typeof', async () => {
    assert((await whence('typeof 1 === "number"')));
    assert((await whence('typeof "foo" === "string"')));
    assert((!(await whence('typeof "foo" !== "string"'))));
    assert((!(await whence('typeof "bar" === "number"'))));
    assert((await whence('typeof "baz" !== "number"')));
    assert((await whence('typeof "foo" === typeof "baz"')));
    assert((await whence('typeof 9 === typeof 10')));
    assert((!(await whence('typeof 9 === typeof "bar"'))));
    assert((!(await whence('typeof 9 === typeof "baz"'))));
    assert((await whence('typeof "num" !== typeof -9')));
    assert((await whence('typeof "foo" == typeof "baz"')));
    assert((await whence('typeof 9 == typeof 10')));
    assert((!(await whence('typeof 9 == typeof "bar"'))));
  });

  it('should compare values with unary operators', async () => {
    assert((!(await whence('typeof -9 === typeof "baz"'))));
    assert((!(await whence('typeof +9 !== typeof -9'))));
    assert((await whence('+9 !== -9')));
    assert((await whence('+9 === +9')));
    assert((await whence('-9 === -9')));
    assert((!(await whence('+9 !== +9'))));
    assert((!(await whence('-9 !== -9'))));
  });

  it('should support multiple comparisons with &&', async () => {
    assert((await whence('1 !== 2 && 5 === 5')));
    assert((await whence('(1 !== 2) && (5 === 5)')));
    assert((await whence('(1 !== 2) && (5 === 5) && ("foo" !== "bar")')));
  });

  it('should support multiple comparisons with ||', async () => {
    assert((await whence('1 !== 2 || 5 === 5')));
    assert((await whence('(1 !== 2) || (5 === 5)')));
    assert((await whence('(1 !== 2) || (5 === 5) || ("foo" !== "bar")')));
  });

  it('should support multiple comparisons with || and &&', async () => {
    assert((await whence('(1 !== 2 || 5 === 5) && "foo" !== true')));
    assert((await whence('(1 === 2 || 5 === 5) && "foo" !== true')));
    assert((!(await whence('(1 !== 2) && (0 && 5)'))));
    assert((await whence('(1 !== 2) && (0 || 5)')));
    assert((await whence('(1 !== 2) || (5 === 5) && ("foo" !== "bar")')));
    assert((await whence('(1 !== 2) || ((5 === 5) && ("foo" !== "bar"))')));
    assert((await whence('((1 !== 2) || ((5 === 5) && ("foo" !== "bar")))')));
  });

  it('should support negated conditions', async () => {
    assert(!(await whence('!value', { value: 'abc' })));
    assert((await whence('!!value', { value: 'abc' })));
    assert((await whence('value === "abc"', { value: 'abc' })));
    assert(!(await whence('!!value === false', { value: 'abc' })));
    assert(!(await whence('!value === true', { value: 'abc' })));
    assert((await whence('!!value === true', { value: 'abc' })));
    assert((await whence('!value === false', { value: 'abc' })));
    assert(!(await whence('(value === false)', { value: 'abc' })));
    assert((await whence('!(value === false)', { value: 'abc' })));
    assert(!(await whence('!!(value === false)', { value: 'abc' })));
  });

  it('should support functions', async () => {
    const context = {
      a: 1,
      b: 1,
      c: 'foo',
      isEqual(a, b) {
        return a === b;
      },
      allEqual(...args) {
        // console.log(args)
        return args.every(e => e === args[0]);
      }
    };

    assert(!(await whence('allEqual("foo", "foo", "bar")', context)));
    assert((await whence('allEqual("foo", "foo", "foo")', context)));
    assert((await whence('isEqual("foo", "foo")', context)));
    assert((await whence('isEqual(a, b)', context)));
    assert(!(await whence('isEqual(b, c)', context)));
    assert(!(await whence('allEqual(a, b, c)', context)));
    assert(!(await whence('allEqual(a, b, b, a, b, a, c)', context)));
    assert((await whence('allEqual(isEqual(a, b), isEqual(b, b))', context)));
    assert(!(await whence('allEqual(isEqual(a, b), isEqual(b, c))', context)));
  });

  it('should support multiple comparisons a context', async () => {
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

    assert((await whence('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))', context)));
    assert((await whence('((typeof foo === "string") && (typeof bar !== "string"))', context)));
    assert((await whence('((baz === "qux") && (a <= b) || (c >= d) || (e > f))', context)));
    assert((await whence('((baz === "qux") && ((a != "b") && (c != "d")) || (e != f))', context)));
    assert((await whence('typeof +d.e.f === typeof x.y.z', context)));
    assert((await whence('typeof +d.e.f === typeof 10', context)));
  });
});
