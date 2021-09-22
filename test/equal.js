'use strict';

const { strict: assert } = require('assert');
const { equal } = require('..');

describe('equal', () => {
  describe('primitives', () => {
    it('should compare strings', () => {
      assert(equal('foo', 'foo'));
      assert(!equal('foo', 'bar'));
    });

    it('should compare booleans', () => {
      assert(equal(true, {}));
      assert(!equal(false, {}));
      assert(equal(true, true));
      assert(!equal(true, false));
      assert(equal(false, false));
    });

    it('should compare null and undefined', () => {
      assert(equal(null, null));
      assert(!equal(null, undefined));
      assert(equal(undefined, undefined));
    });

    it('should compare numbers', () => {
      assert(equal(0, 0));
      assert(equal(1, 1));
      assert(!equal(1, 2));
      assert(!equal(0, 1));
    });

    it('should match object properties with string name', () => {
      assert(equal('foo', { foo: true }));
      assert(equal('foo', { foo: [] }));
      assert(equal('foo', { foo: [1] }));
      assert(!equal('foo', { foo: false }));
      assert(!equal('foo', { bar: true }));
    });

    it('should match object properties with symbol name', () => {
      const foo = Symbol('foo');
      assert(equal(foo, { [foo]: true }));
      assert(equal(foo, { [foo]: true }));
      assert(equal(foo, { [foo]: [] }));
      assert(equal(foo, { [foo]: [1] }));
      assert(!equal(foo, { [foo]: false }));
    });
  });

  describe('arrays', () => {
    it('should return true when every value in the array is in the context', () => {
      const key = Symbol(':key');
      const context = { foo: true, bar: false, baz: 'qux', [key]: true };
      assert(!equal(['foo', 'bar', key], context));
      assert(equal(['foo', 'baz', key], context));
    });
  });

  describe('objects', () => {
    it('should return true when every value in the object is in the context', () => {
      const context = { foo: true, bar: false, baz: 'qux' };
      assert(equal({ foo: true }, context));
      assert(equal({ bar: false }, context));
      assert(equal({ bar: false, baz: 'qux' }, context));
      assert(!equal({ bar: false, baz: 'wrong' }, context));
      assert(!equal({ bar: false, other: 'wrong' }, context));

      assert(equal({ baz: 'qux' }, context));
      assert(!equal({ baz: 'fez' }, context));
      assert(equal({ foo: 'bar' }, { foo: 'bar' }));
      assert(!equal({ foo: 'bar' }, { foo: 'baz' }));
      assert(equal({ foo: 'bar', baz: 'qux' }, { foo: 'bar', baz: 'qux' }));
      assert(!equal({ foo: 'bar', baz: 'qux' }, { foo: 'bar' }));
    });

    it('should work for deeply nested values', () => {
      const context = { a: { b: { c: { d: 'efg' } } } };
      assert(equal({ a: { b: { c: { d: 'efg' } } } }, context));
      assert(!equal({ a: { b: { c: { d: 'efg', extra: true } } } }, context));
      assert(!equal({ a: { b: { c: { d: 'efgh' } } } }, context));
    });
  });

  describe('booleans', () => {
    it('should return true equal `true`', async () => {
      assert.equal(await equal(true), true);
      assert.equal(await equal(true), true);
    });

    it('should return true equal `"true"`', async () => {
      assert.equal(await equal('true'), true);
      assert.equal(await equal('true'), true);
    });

    it('should return true equal `false`', async () => {
      assert.equal(await equal(false), false);
      assert.equal(await equal(false), false);
    });

    it('should return false equal `false`', async () => {
      assert.equal(await equal('false'), false);
      assert.equal(await equal('false'), false);
    });
  });

  describe('conditionals', () => {
    it('should support conditionals', async () => {
      assert.equal(await equal('9 > 1'), true);
      assert.equal(await equal('9 < 1'), false);
    });

    it('should support conditionals with variables', async () => {
      assert.equal(await equal('a > b', { a: 9, b: 1 }), true);
      assert.equal(await equal('a < b', { a: 9, b: 1 }), false);
    });
  });

  describe('objects', () => {
    it('should support objects', async () => {
      assert.equal(await equal({ a: 9 }, { a: 9, b: 1 }), true);
      assert.equal(await equal({ a: 8 }, { a: 9, b: 1 }), false);
    });
  });

  describe('dates', () => {
    it('should support dates', async () => {
      assert.equal(await equal(new Date(), new Date()), true);
      assert.equal(await equal(new Date('2020-12-17T03:24:00'), new Date('2020-12-17T03:24:00')), true);
      assert.equal(await equal(new Date('2020-12-17T03:24:00'), new Date('2020-11-17T03:24:00')), false);
    });
  });

  describe('undefined', () => {
    it('should return true equal undefined', async () => {
      assert.equal(await equal(undefined), true);
    });

    it('should return false equal "undefined"', async () => {
      assert.equal(await equal('undefined'), false);
    });
  });

  describe('null', () => {
    it('should return false equal null', async () => {
      assert.equal(await equal(null), false);
    });

    it('should return false equal "null"', async () => {
      assert.equal(await equal('null'), false);
    });
  });
});
