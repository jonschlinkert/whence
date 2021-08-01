'use strict';

const assert = require('assert').strict;
const { isEqual } = require('..');

describe('is-equal', () => {
  describe('primitives', () => {
    it('should return true when two primitives are equal', () => {
      assert(isEqual(0, 0));
      assert(isEqual(1, 1));
      assert(!isEqual(1, 2));
      assert(!isEqual(0, 1));

      assert(isEqual('foo', 'foo'));
      assert(!isEqual('foo', 'bar'));

      assert(isEqual(null, null));
      assert(!isEqual(null, undefined));
    });

    it('should match a primitive on the context', () => {
      assert(isEqual('foo', { foo: true }));
      assert(!isEqual('foo', { bar: true }));
    });
  });

  describe('arrays', () => {
    it('should return true when every value in the first array is in the context', () => {
      const context = {
        foo: true,
        bar: false,
        baz: 'qux'
      };

      assert(!isEqual(['foo', 'bar'], context));
      assert(isEqual(['foo', '!bar'], context));
      assert(!isEqual(['foo', 'baz'], context));
    });

    it('should return true when a primitive matches the context', () => {
      assert(isEqual('foo', { foo: true }));
      assert(!isEqual('foo', { bar: true }));
    });
  });

  describe('objects', () => {
    it('should return true when every value in the first array is in the context', () => {
      const context = {
        foo: true,
        bar: false,
        baz: 'qux'
      };

      assert(isEqual({ foo: true }, context));
      assert(isEqual({ bar: false }, context));
      assert(!isEqual({ bar: false, other: 'wrong' }, context));
      assert(isEqual({ baz: 'qux' }, context));
      assert(!isEqual({ baz: 'fez' }, context));
    });

    it('should work for deeply nested values', () => {
      const context = {
        a: { b: { c: { d: 'efg' } } }
      };

      assert(isEqual({ a: { b: { c: { d: 'efg' } } } }, context));
      assert(!isEqual({ a: { b: { c: { d: 'efg', extra: true } } } }, context));
      assert(!isEqual({ a: { b: { c: { d: 'efgh' } } } }, context));
    });
  });
});
