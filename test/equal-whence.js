'use strict';

const { strict: assert } = require('assert');
const whence = require('..');

describe('equality with whence()', () => {
  describe('primitives', () => {
    it('should compare strings', async () => {
      assert(await whence('foo', 'foo'));
      assert(!await whence('foo', 'bar'));
    });

    it('should compare booleans', async () => {
      assert(await whence(true, {}));
      assert(!await whence(false, {}));
      assert(await whence(true, true));
      assert(!await whence(true, false));
      assert(await whence(false, false));
    });

    it('should compare null and undefined', async () => {
      assert(await whence(null, null));
      assert(!await whence(null, undefined));
      assert(await whence(undefined, undefined));
    });

    it('should compare numbers', async () => {
      assert(await whence(0, 0));
      assert(await whence(1, 1));
      assert(!await whence(1, 2));
      assert(!await whence(0, 1));
    });

    it('should match object properties with string name', async () => {
      assert(await whence('foo', { foo: true }));
      assert(await whence('foo', { foo: [] }));
      assert(await whence('foo', { foo: [1] }));
      assert(!await whence('foo', { foo: false }));
      assert(!await whence('foo', { bar: true }));
    });

    it('should match object properties with symbol name', async () => {
      const foo = Symbol('foo');
      assert(await whence(foo, { [foo]: true }));
      assert(await whence(foo, { [foo]: true }));
      assert(await whence(foo, { [foo]: [] }));
      assert(await whence(foo, { [foo]: [1] }));
      assert(!await whence(foo, { [foo]: false }));
    });
  });

  describe('arrays', () => {
    it('should return true when every value in the array is in the context', async () => {
      const key = Symbol(':key');
      const context = { foo: true, bar: false, baz: 'qux', [key]: true };
      assert(!await whence(['foo', 'bar', key], context));
      assert(await whence(['foo', 'baz', key], context));
    });
  });

  describe('objects', () => {
    it('should return true when every value in the object is in the context', async () => {
      const context = { foo: true, bar: false, baz: 'qux' };
      assert(await whence({ foo: true }, context));
      assert(await whence({ bar: false }, context));
      assert(await whence({ bar: false, baz: 'qux' }, context));
      assert(!await whence({ bar: false, baz: 'wrong' }, context));
      assert(!await whence({ bar: false, other: 'wrong' }, context));

      assert(await whence({ baz: 'qux' }, context));
      assert(!await whence({ baz: 'fez' }, context));
      assert(await whence({ foo: 'bar' }, { foo: 'bar' }));
      assert(!await whence({ foo: 'bar' }, { foo: 'baz' }));
      assert(await whence({ foo: 'bar', baz: 'qux' }, { foo: 'bar', baz: 'qux' }));
      assert(!await whence({ foo: 'bar', baz: 'qux' }, { foo: 'bar' }));
    });

    it('should work for deeply nested values', async () => {
      const context = { a: { b: { c: { d: 'efg' } } } };
      assert(await whence({ a: { b: { c: { d: 'efg' } } } }, context));
      assert(!await whence({ a: { b: { c: { d: 'efg', extra: true } } } }, context));
      assert(!await whence({ a: { b: { c: { d: 'efgh' } } } }, context));
    });
  });

  describe('booleans', () => {
    it('should return true equal `true`', async () => {
      assert.equal(await whence(true), true);
      assert.equal(await whence(true), true);
    });

    it('should return true equal `"true"`', async () => {
      assert.equal(await whence('true'), true);
      assert.equal(await whence('true'), true);
    });

    it('should return true equal `false`', async () => {
      assert.equal(await whence(false), false);
      assert.equal(await whence(false), false);
    });

    it('should return false equal `false`', async () => {
      assert.equal(await whence('false'), false);
      assert.equal(await whence('false'), false);
    });
  });

  describe('conditionals', () => {
    it('should support conditionals', async () => {
      assert.equal(await whence('9 > 1'), true);
      assert.equal(await whence('9 < 1'), false);
    });

    it('should support conditionals with variables', async () => {
      assert.equal(await whence('a > b', { a: 9, b: 1 }), true);
      assert.equal(await whence('a < b', { a: 9, b: 1 }), false);
    });
  });

  describe('objects', () => {
    it('should support objects', async () => {
      assert.equal(await whence({ a: 9 }, { a: 9, b: 1 }), true);
      assert.equal(await whence({ a: 8 }, { a: 9, b: 1 }), false);
    });
  });

  describe('dates', () => {
    it('should support dates', async () => {
      assert.equal(await whence(new Date(), new Date()), true);
      assert.equal(await whence(new Date('2020-12-17T03:24:00'), new Date('2020-12-17T03:24:00')), true);
      assert.equal(await whence(new Date('2020-12-17T03:24:00'), new Date('2020-11-17T03:24:00')), false);
    });
  });

  describe('undefined', () => {
    it('should return true equal undefined', async () => {
      assert.equal(await whence(undefined), true);
    });

    it('should return false equal "undefined"', async () => {
      assert.equal(await whence('undefined'), false);
    });
  });

  describe('null', () => {
    it('should return false equal null', async () => {
      assert.equal(await whence(null), false);
    });

    it('should return false equal "null"', async () => {
      assert.equal(await whence('null'), false);
    });
  });
});
