'use strict';

require('mocha');
const assert = require('assert').strict;
const { compile } = require('..');

describe('compile', () => {
  it('should compare numbers', () => {
    assert(compile('9 === 9')());
    assert(!compile('9 === 8')());
    assert(compile('9 > 8')());
    assert(!compile('9 < 8')());
    assert(!compile('9 <= 8')());
    assert(compile('-.1 >= -.2')());
    assert(compile('-0.1 >= -0.2')());
    assert(compile('-1 >= -2')());
    assert(compile('+1 <= +2')());
    assert(compile('9 >= 8')());
    assert(compile('9.1 >= 9.01')());
    assert(compile('-1 === -1')());
  });

  it('should compare booleans', () => {
    assert(compile('false === false')());
    assert(compile('true === true')());

    assert(!compile('true === false')());
    assert(!compile('true===false')());

    assert(!compile('false || false')());
    assert(!compile('false||false')());

    assert(compile('true || false')());
    assert(compile('true||false')());

    assert(compile('true || true')());
    assert(compile('true||true')());

    assert(!compile('false && false')());
    assert(!compile('false&&false')());

    assert(!compile('true && false')());
    assert(!compile('true&&false')());

    assert(compile('true && true')());
    assert(compile('true&&true')());
  });

  it('should compare strings', () => {
    assert(compile('"foo" === "foo"')());
    assert(compile('"bar" === "bar"')());

    assert(!compile('"bar" === "foo"')());
    assert(!compile('"bar"==="foo"')());

    assert(compile('"foo" || "foo"')());
    assert(compile('"foo"||"foo"')());

    assert(compile('"bar" || "foo"')());
    assert(compile('"bar"||"foo"')());

    assert(compile('"bar" || "bar"')());
    assert(compile('"bar"||"bar"')());

    assert(compile('"foo" && "foo"')());
    assert(compile('"foo"&&"foo"')());

    assert(compile('"bar" && "foo"')());
    assert(compile('"bar"&&"foo"')());

    assert(compile('"bar" && "bar"')());
    assert(compile('"bar"&&"bar"')());
  });

  it('should support null and undefined', () => {
    assert.equal(compile('void (0)')(), undefined);
    assert.equal(compile('void (42)')(), undefined);
    assert.equal(compile('void 42')(), undefined);
    assert.equal(compile('void 0')(), undefined);
    assert.equal(compile('undefined')(), undefined);
    assert.equal(compile('null')(), null);
    assert.equal(compile('"null"')(), 'null');
  });

  it('should compare null and undefined', () => {
    assert(compile('undefined === void (0)')());
    assert(compile('undefined === void (42)')());
    assert(compile('undefined === void 42')());
    assert(compile('undefined === void 0')());
    assert(compile('undefined === undefined')());
    assert(compile('null === null')());
    assert(!compile('undefined === null')());
  });

  it('should support unary operators', () => {
    assert.equal(compile('-9')(), -9);
    assert.equal(compile('+9')(), 9);
  });

  it('should use unary operators on nested properties', () => {
    const context = {
      a: { b: { c: '10' } }
    };
    assert.equal(compile('-a.b.c')(context), -10);
  });

  it('should return the type of value', () => {
    assert.equal(compile('typeof 1')(), 'number');
    assert.equal(compile('typeof "1"')(), 'string');
    assert.equal(compile('typeof null')(), 'object');
    assert.equal(compile('typeof "null"')(), 'string');
    assert.equal(compile('typeof true')(), 'boolean');
    assert.equal(compile('typeof false')(), 'boolean');
  });

  it('should do comparisons with typeof', () => {
    assert(compile('typeof 1 === "number"')());
    assert(compile('typeof "foo" === "string"')());
    assert(!compile('typeof "foo" !== "string"')());
    assert(!compile('typeof "bar" === "number"')());
    assert(compile('typeof "baz" !== "number"')());
    assert(compile('typeof "foo" === typeof "baz"')());
    assert(compile('typeof 9 === typeof 10')());
    assert(!compile('typeof 9 === typeof "bar"')());
    assert(!compile('typeof 9 === typeof "baz"')());
    assert(compile('typeof "num" !== typeof -9')());
    assert(compile('typeof "foo" == typeof "baz"')());
    assert(compile('typeof 9 == typeof 10')());
    assert(!compile('typeof 9 == typeof "bar"')());
  });

  it('should compare values with unary operators', () => {
    assert(!compile('typeof -9 === typeof "baz"')());
    assert(!compile('typeof +9 !== typeof -9')());
    assert(compile('+9 !== -9')());
    assert(compile('+9 === +9')());
    assert(compile('-9 === -9')());
    assert(!compile('+9 !== +9')());
    assert(!compile('-9 !== -9')());
  });

  it('should support multiple comparisons with &&', () => {
    assert(compile('1 !== 2 && 5 === 5')());
    assert(compile('(1 !== 2) && (5 === 5)')());
    assert(compile('(1 !== 2) && (5 === 5) && ("foo" !== "bar")')());
  });

  it('should support multiple comparisons with ||', () => {
    assert(compile('1 !== 2 || 5 === 5')());
    assert(compile('(1 !== 2) || (5 === 5)')());
    assert(compile('(1 !== 2) || (5 === 5) || ("foo" !== "bar")')());
  });

  it('should support multiple comparisons with || and &&', () => {
    assert(compile('(1 !== 2 || 5 === 5) && "foo" !== true')());
    assert(compile('(1 === 2 || 5 === 5) && "foo" !== true')());
    assert(!compile('(1 !== 2) && (0 && 5)')());
    assert(compile('(1 !== 2) && (0 || 5)')());
    assert(compile('(1 !== 2) || (5 === 5) && ("foo" !== "bar")')());
    assert(compile('(1 !== 2) || ((5 === 5) && ("foo" !== "bar"))')());
    assert(compile('((1 !== 2) || ((5 === 5) && ("foo" !== "bar")))')());
  });

  it('should support negated conditions', () => {
    assert(!compile('!value')({ value: 'abc' }));
    assert(compile('!!value')({ value: 'abc' }));
    assert(compile('value === "abc"')({ value: 'abc' }));
    assert(!compile('!!value === false')({ value: 'abc' }));
    assert(!compile('!value === true')({ value: 'abc' }));
    assert(compile('!!value === true')({ value: 'abc' }));
    assert(compile('!value === false')({ value: 'abc' }));
    assert(!compile('(value === false)')({ value: 'abc' }));
    assert(compile('!(value === false)')({ value: 'abc' }));
    assert(!compile('!!(value === false)')({ value: 'abc' }));
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
        // console.log(args.join(', ')());
        return args.every(e => e === args[0]);
      }
    };

    assert(!compile('allEqual("foo", "foo", "bar")')(context));
    assert(compile('allEqual("foo", "foo", "foo")')(context));
    assert(compile('isEqual("foo", "foo")')(context));
    assert(compile('isEqual(a, b)')(context));
    assert(!compile('isEqual(b, c)')(context));
    assert(!compile('allEqual(a, b, c)')(context));
    assert(!compile('allEqual(a, b, b, a, b, a, c)')(context));
    assert(compile('allEqual(isEqual(a, b), isEqual(b, b))')(context));
    assert(!compile('allEqual(isEqual(a, b), isEqual(b, c))')(context));
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

    assert(compile('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))')(context));
    assert(compile('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))')(context));
    assert(compile('((typeof foo === "string") && (typeof bar !== "string"))')(context));
    assert(compile('((baz === "qux") && (a <= b) || (c >= d) || (e > f))')(context));
    assert(compile('((baz === "qux") && ((a != "b") && (c != "d")) || (e != f))')(context));
    assert(compile('typeof +d.e.f === typeof x.y.z')(context));
    assert(compile('typeof +d.e.f === typeof 10')(context));
    assert.equal(compile('string || focused.editable')(context), true);
    assert.equal(compile('string && focused.editable')(context), false);
    assert.equal(compile('!!(string && focused.editable)')(context), false);
  });
});
