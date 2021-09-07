'use strict';

const { strict: assert } = require('assert');
const { compile } = require('..');

describe('compile', () => {
  describe('async', () => {
    it('should compare numbers', async () => {
      assert(await compile('9 === 9')());
      assert(!await compile('9 === 8')());
      assert(await compile('9 > 8')());
      assert(!await compile('9 < 8')());
      assert(!await compile('9 <= 8')());
      assert(await compile('-.1 >= -.2')());
      assert(await compile('-0.1 >= -0.2')());
      assert(await compile('-1 >= -2')());
      assert(await compile('+1 <= +2')());
      assert(await compile('9 >= 8')());
      assert(await compile('9.1 >= 9.01')());
      assert(await compile('-1 === -1')());
    });

    it('should compare booleans', async () => {
      assert(await compile('false === false')());
      assert(await compile('true === true')());

      assert(!await compile('true === false')());
      assert(!await compile('true===false')());

      assert(!await compile('false || false')());
      assert(!await compile('false||false')());

      assert(await compile('true || false')());
      assert(await compile('true||false')());

      assert(await compile('true || true')());
      assert(await compile('true||true')());

      assert(!await compile('false && false')());
      assert(!await compile('false&&false')());

      assert(!await compile('true && false')());
      assert(!await compile('true&&false')());

      assert(await compile('true && true')());
      assert(await compile('true&&true')());
    });

    it('should compare strings', async () => {
      assert(await compile('"foo" === "foo"')());
      assert(await compile('"bar" === "bar"')());

      assert(!await compile('"bar" === "foo"')());
      assert(!await compile('"bar"==="foo"')());

      assert(await compile('"foo" || "foo"')());
      assert(await compile('"foo"||"foo"')());

      assert(await compile('"bar" || "foo"')());
      assert(await compile('"bar"||"foo"')());

      assert(await compile('"bar" || "bar"')());
      assert(await compile('"bar"||"bar"')());

      assert(await compile('"foo" && "foo"')());
      assert(await compile('"foo"&&"foo"')());

      assert(await compile('"bar" && "foo"')());
      assert(await compile('"bar"&&"foo"')());

      assert(await compile('"bar" && "bar"')());
      assert(await compile('"bar"&&"bar"')());
    });

    it('should support null and undefined', async () => {
      assert.equal(await compile('void (0)')(), undefined);
      assert.equal(await compile('void (42)')(), undefined);
      assert.equal(await compile('void 42')(), undefined);
      assert.equal(await compile('void 0')(), undefined);
      assert.equal(await compile('undefined')(), undefined);
      assert.equal(await compile('null')(), null);
      assert.equal(await compile('"null"')(), 'null');
    });

    it('should compare null and undefined', async () => {
      assert(await compile('undefined === void (0)')());
      assert(await compile('undefined === void (42)')());
      assert(await compile('undefined === void 42')());
      assert(await compile('undefined === void 0')());
      assert(await compile('undefined === undefined')());
      assert(await compile('null === null')());
      assert(!await compile('undefined === null')());
    });

    it('should support unary operators', async () => {
      assert.equal(await compile('-9')(), -9);
      assert.equal(await compile('+9')(), 9);
    });

    it('should use unary operators on nested properties', async () => {
      assert.equal(await compile('-a.b.c')({ a: { b: { c: '10' } } }), -10);
      assert.equal(await compile('-a.b.c')({ a: { b: { c: '-1' } } }), 1);
    });

    it('should return the type of value', async () => {
      assert.equal(await compile('typeof 1')(), 'number');
      assert.equal(await compile('typeof "1"')(), 'string');
      assert.equal(await compile('typeof null')(), 'object');
      assert.equal(await compile('typeof "null"')(), 'string');
      assert.equal(await compile('typeof true')(), 'boolean');
      assert.equal(await compile('typeof false')(), 'boolean');
    });

    it('should do comparisons with typeof', async () => {
      assert(await compile('typeof 1 === "number"')());
      assert(await compile('typeof "foo" === "string"')());
      assert(!await compile('typeof "foo" !== "string"')());
      assert(!await compile('typeof "bar" === "number"')());
      assert(await compile('typeof "baz" !== "number"')());
      assert(await compile('typeof "foo" === typeof "baz"')());
      assert(await compile('typeof 9 === typeof 10')());
      assert(!await compile('typeof 9 === typeof "bar"')());
      assert(!await compile('typeof 9 === typeof "baz"')());
      assert(await compile('typeof "num" !== typeof -9')());
      assert(await compile('typeof "foo" == typeof "baz"')());
      assert(await compile('typeof 9 == typeof 10')());
      assert(!await compile('typeof 9 == typeof "bar"')());
    });

    it('should compare values with unary operators', async () => {
      assert(!await compile('typeof -9 === typeof "baz"')());
      assert(!await compile('typeof +9 !== typeof -9')());
      assert(await compile('+9 !== -9')());
      assert(await compile('+9 === +9')());
      assert(await compile('-9 === -9')());
      assert(!await compile('+9 !== +9')());
      assert(!await compile('-9 !== -9')());
    });

    it('should support multiple comparisons with &&', async () => {
      assert(await compile('1 !== 2 && 5 === 5')());
      assert(await compile('(1 !== 2) && (5 === 5)')());
      assert(await compile('(1 !== 2) && (5 === 5) && ("foo" !== "bar")')());
    });

    it('should support multiple comparisons with ||', async () => {
      assert(await compile('1 !== 2 || 5 === 5')());
      assert(await compile('(1 !== 2) || (5 === 5)')());
      assert(await compile('(1 !== 2) || (5 === 5) || ("foo" !== "bar")')());
    });

    it('should support multiple comparisons with || and &&', async () => {
      assert(await compile('(1 !== 2 || 5 === 5) && "foo" !== true')());
      assert(await compile('(1 === 2 || 5 === 5) && "foo" !== true')());
      assert(!await compile('(1 !== 2) && (0 && 5)')());
      assert(await compile('(1 !== 2) && (0 || 5)')());
      assert(await compile('(1 !== 2) || (5 === 5) && ("foo" !== "bar")')());
      assert(await compile('(1 !== 2) || ((5 === 5) && ("foo" !== "bar"))')());
      assert(await compile('((1 !== 2) || ((5 === 5) && ("foo" !== "bar")))')());
    });

    it('should support negated conditions', async () => {
      assert(!await compile('!value')({ value: 'abc' }));
      assert(await compile('!!value')({ value: 'abc' }));
      assert(await compile('value === "abc"')({ value: 'abc' }));
      assert(!await compile('!!value === false')({ value: 'abc' }));
      assert(!await compile('!value === true')({ value: 'abc' }));
      assert(await compile('!!value === true')({ value: 'abc' }));
      assert(await compile('!value === false')({ value: 'abc' }));
      assert(!await compile('(value === false)')({ value: 'abc' }));
      assert(await compile('!(value === false)')({ value: 'abc' }));
      assert(!await compile('!!(value === false)')({ value: 'abc' }));
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
          return args.every(e => e === args[0]);
        }
      };

      assert(!await compile('allEqual("foo", "foo", "bar")', { functions: true })(context));
      assert(await compile('allEqual("foo", "foo", "foo")', { functions: true })(context));
      assert(await compile('isEqual("foo", "foo")', { functions: true })(context));
      assert(await compile('isEqual(a, b)', { functions: true })(context));
      assert(!await compile('isEqual(b, c)', { functions: true })(context));
      assert(!await compile('allEqual(a, b, c)', { functions: true })(context));
      assert(!await compile('allEqual(a, b, b, a, b, a, c)', { functions: true })(context));
      assert(await compile('allEqual(isEqual(a, b), isEqual(b, b))', { functions: true })(context));
      assert(!await compile('allEqual(isEqual(a, b), isEqual(b, c))', { functions: true })(context));
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
        x: { y: { z: 42 } },
        focused: { editable: true },
        string: false
      };

      assert(await compile('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))')(context));
      assert(await compile('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))')(context));
      assert(await compile('((typeof foo === "string") && (typeof bar !== "string"))')(context));
      assert(await compile('((baz === "qux") && (a <= b) || (c >= d) || (e > f))')(context));
      assert(await compile('((baz === "qux") && ((a != "b") && (c != "d")) || (e != f))')(context));
      assert(await compile('typeof +d.e.f === typeof x.y.z')(context));
      assert(await compile('typeof +d.e.f === typeof 10')(context));
      assert.equal(await compile('string || focused.editable')(context), true);
      assert.equal(await compile('string && focused.editable')(context), false);
      assert.equal(await compile('!!(string && focused.editable)')(context), false);
    });
  });

  describe('sync', () => {
    it('should compare numbers', () => {
      assert(compile.sync('9 === 9')());
      assert(!compile.sync('9 === 8')());
      assert(compile.sync('9 > 8')());
      assert(!compile.sync('9 < 8')());
      assert(!compile.sync('9 <= 8')());
      assert(compile.sync('-.1 >= -.2')());
      assert(compile.sync('-0.1 >= -0.2')());
      assert(compile.sync('-1 >= -2')());
      assert(compile.sync('+1 <= +2')());
      assert(compile.sync('9 >= 8')());
      assert(compile.sync('9.1 >= 9.01')());
      assert(compile.sync('-1 === -1')());
    });

    it('should compare booleans', () => {
      assert(compile.sync('false === false')());
      assert(compile.sync('true === true')());

      assert(!compile.sync('true === false')());
      assert(!compile.sync('true===false')());

      assert(!compile.sync('false || false')());
      assert(!compile.sync('false||false')());

      assert(compile.sync('true || false')());
      assert(compile.sync('true||false')());

      assert(compile.sync('true || true')());
      assert(compile.sync('true||true')());

      assert(!compile.sync('false && false')());
      assert(!compile.sync('false&&false')());

      assert(!compile.sync('true && false')());
      assert(!compile.sync('true&&false')());

      assert(compile.sync('true && true')());
      assert(compile.sync('true&&true')());
    });

    it('should compare strings', () => {
      assert(compile.sync('"foo" === "foo"')());
      assert(compile.sync('"bar" === "bar"')());

      assert(!compile.sync('"bar" === "foo"')());
      assert(!compile.sync('"bar"==="foo"')());

      assert(compile.sync('"foo" || "foo"')());
      assert(compile.sync('"foo"||"foo"')());

      assert(compile.sync('"bar" || "foo"')());
      assert(compile.sync('"bar"||"foo"')());

      assert(compile.sync('"bar" || "bar"')());
      assert(compile.sync('"bar"||"bar"')());

      assert(compile.sync('"foo" && "foo"')());
      assert(compile.sync('"foo"&&"foo"')());

      assert(compile.sync('"bar" && "foo"')());
      assert(compile.sync('"bar"&&"foo"')());

      assert(compile.sync('"bar" && "bar"')());
      assert(compile.sync('"bar"&&"bar"')());
    });

    it('should support null and undefined', () => {
      assert.equal(compile.sync('void (0)')(), undefined);
      assert.equal(compile.sync('void (42)')(), undefined);
      assert.equal(compile.sync('void 42')(), undefined);
      assert.equal(compile.sync('void 0')(), undefined);
      assert.equal(compile.sync('undefined')(), undefined);
      assert.equal(compile.sync('null')(), null);
      assert.equal(compile.sync('"null"')(), 'null');
    });

    it('should compare null and undefined', () => {
      assert(compile.sync('undefined === void (0)')());
      assert(compile.sync('undefined === void (42)')());
      assert(compile.sync('undefined === void 42')());
      assert(compile.sync('undefined === void 0')());
      assert(compile.sync('undefined === undefined')());
      assert(compile.sync('null === null')());
      assert(!compile.sync('undefined === null')());
    });

    it('should support unary operators', () => {
      assert.equal(compile.sync('-9')(), -9);
      assert.equal(compile.sync('+9')(), 9);
    });

    it('should use unary operators on nested properties', () => {
      assert.equal(compile.sync('-a.b.c')({ a: { b: { c: '10' } } }), -10);
      assert.equal(compile.sync('-a.b.c')({ a: { b: { c: '-1' } } }), 1);
    });

    it('should return the type of value', () => {
      assert.equal(compile.sync('typeof 1')(), 'number');
      assert.equal(compile.sync('typeof "1"')(), 'string');
      assert.equal(compile.sync('typeof null')(), 'object');
      assert.equal(compile.sync('typeof "null"')(), 'string');
      assert.equal(compile.sync('typeof true')(), 'boolean');
      assert.equal(compile.sync('typeof false')(), 'boolean');
    });

    it('should do comparisons with typeof', () => {
      assert(compile.sync('typeof 1 === "number"')());
      assert(compile.sync('typeof "foo" === "string"')());
      assert(!compile.sync('typeof "foo" !== "string"')());
      assert(!compile.sync('typeof "bar" === "number"')());
      assert(compile.sync('typeof "baz" !== "number"')());
      assert(compile.sync('typeof "foo" === typeof "baz"')());
      assert(compile.sync('typeof 9 === typeof 10')());
      assert(!compile.sync('typeof 9 === typeof "bar"')());
      assert(!compile.sync('typeof 9 === typeof "baz"')());
      assert(compile.sync('typeof "num" !== typeof -9')());
      assert(compile.sync('typeof "foo" == typeof "baz"')());
      assert(compile.sync('typeof 9 == typeof 10')());
      assert(!compile.sync('typeof 9 == typeof "bar"')());
    });

    it('should compare values with unary operators', () => {
      assert(!compile.sync('typeof -9 === typeof "baz"')());
      assert(!compile.sync('typeof +9 !== typeof -9')());
      assert(compile.sync('+9 !== -9')());
      assert(compile.sync('+9 === +9')());
      assert(compile.sync('-9 === -9')());
      assert(!compile.sync('+9 !== +9')());
      assert(!compile.sync('-9 !== -9')());
    });

    it('should support multiple comparisons with &&', () => {
      assert(compile.sync('1 !== 2 && 5 === 5')());
      assert(compile.sync('(1 !== 2) && (5 === 5)')());
      assert(compile.sync('(1 !== 2) && (5 === 5) && ("foo" !== "bar")')());
    });

    it('should support multiple comparisons with ||', () => {
      assert(compile.sync('1 !== 2 || 5 === 5')());
      assert(compile.sync('(1 !== 2) || (5 === 5)')());
      assert(compile.sync('(1 !== 2) || (5 === 5) || ("foo" !== "bar")')());
    });

    it('should support multiple comparisons with || and &&', () => {
      assert(compile.sync('(1 !== 2 || 5 === 5) && "foo" !== true')());
      assert(compile.sync('(1 === 2 || 5 === 5) && "foo" !== true')());
      assert(!compile.sync('(1 !== 2) && (0 && 5)')());
      assert(compile.sync('(1 !== 2) && (0 || 5)')());
      assert(compile.sync('(1 !== 2) || (5 === 5) && ("foo" !== "bar")')());
      assert(compile.sync('(1 !== 2) || ((5 === 5) && ("foo" !== "bar"))')());
      assert(compile.sync('((1 !== 2) || ((5 === 5) && ("foo" !== "bar")))')());
    });

    it('should support negated conditions', () => {
      assert(!compile.sync('!value')({ value: 'abc' }));
      assert(compile.sync('!!value')({ value: 'abc' }));
      assert(compile.sync('value === "abc"')({ value: 'abc' }));
      assert(!compile.sync('!!value === false')({ value: 'abc' }));
      assert(!compile.sync('!value === true')({ value: 'abc' }));
      assert(compile.sync('!!value === true')({ value: 'abc' }));
      assert(compile.sync('!value === false')({ value: 'abc' }));
      assert(!compile.sync('(value === false)')({ value: 'abc' }));
      assert(compile.sync('!(value === false)')({ value: 'abc' }));
      assert(!compile.sync('!!(value === false)')({ value: 'abc' }));
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
          return args.every(e => e === args[0]);
        }
      };

      assert(!compile.sync('allEqual("foo", "foo", "bar")', { functions: true })(context));
      assert(compile.sync('allEqual("foo", "foo", "foo")', { functions: true })(context));
      assert(compile.sync('isEqual("foo", "foo")', { functions: true })(context));
      assert(compile.sync('isEqual(a, b)', { functions: true })(context));
      assert(!compile.sync('isEqual(b, c)', { functions: true })(context));
      assert(!compile.sync('allEqual(a, b, c)', { functions: true })(context));
      assert(!compile.sync('allEqual(a, b, b, a, b, a, c)', { functions: true })(context));
      assert(compile.sync('allEqual(isEqual(a, b), isEqual(b, b))', { functions: true })(context));
      assert(!compile.sync('allEqual(isEqual(a, b), isEqual(b, c))', { functions: true })(context));
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

      assert(compile.sync('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))')(context));
      assert(compile.sync('((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))')(context));
      assert(compile.sync('((typeof foo === "string") && (typeof bar !== "string"))')(context));
      assert(compile.sync('((baz === "qux") && (a <= b) || (c >= d) || (e > f))')(context));
      assert(compile.sync('((baz === "qux") && ((a != "b") && (c != "d")) || (e != f))')(context));
      assert(compile.sync('typeof +d.e.f === typeof x.y.z')(context));
      assert(compile.sync('typeof +d.e.f === typeof 10')(context));
      assert.equal(compile.sync('string || focused.editable')(context), true);
      assert.equal(compile.sync('string && focused.editable')(context), false);
      assert.equal(compile.sync('!!(string && focused.editable)')(context), false);
    });
  });
});
