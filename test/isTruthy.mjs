import { strict as assert } from 'assert';
import { isTruthy } from '../index.mjs';

describe('isTruthy', () => {
  describe('primitives', () => {
    it('should compare strings', () => {
      assert(isTruthy('foo', 'foo'));
      assert(!isTruthy('foo', 'bar'));
    });

    it('should compare booleans', () => {
      assert(isTruthy(true, true));
      assert(!isTruthy(true, false));
      assert(isTruthy(false, false));
    });

    it('should compare null and undefined', () => {
      assert(isTruthy(null, null));
      assert(!isTruthy(null, undefined));
      assert(isTruthy(undefined, undefined));
    });

    it('should compare numbers', () => {
      assert(isTruthy(0, 0));
      assert(isTruthy(1, 1));
      assert(!isTruthy(1, 2));
      assert(!isTruthy(0, 1));
    });

    it('should match object properties with string name', () => {
      assert(isTruthy('foo', { foo: true }));
      assert(isTruthy('foo', { foo: [] }));
      assert(isTruthy('foo', { foo: [1] }));
      assert(!isTruthy('foo', { foo: false }));
      assert(!isTruthy('foo', { bar: true }));
    });

    it('should match object properties with symbol name', () => {
      const foo = Symbol('foo');
      assert(isTruthy(foo, { [foo]: true }));
      assert(isTruthy(foo, { [foo]: true }));
      assert(isTruthy(foo, { [foo]: [] }));
      assert(isTruthy(foo, { [foo]: [1] }));
      assert(!isTruthy(foo, { [foo]: false }));
    });
  });

  describe('arrays', () => {
    it('should return true when every value in the array is in the context', () => {
      const key = Symbol(':key');
      const context = { foo: true, bar: false, baz: 'qux', [key]: true };
      assert(!isTruthy(['foo', 'bar', key], context));
      assert(isTruthy(['foo', 'baz', key], context));
    });
  });

  describe('objects', () => {
    it('should return true when every value in the object is in the context', () => {
      const context = { foo: true, bar: false, baz: 'qux' };
      assert(isTruthy({ foo: true }, context));
      assert(isTruthy({ bar: false }, context));
      assert(isTruthy({ bar: false, baz: 'qux' }, context));
      assert(!isTruthy({ bar: false, baz: 'wrong' }, context));
      assert(!isTruthy({ bar: false, other: 'wrong' }, context));
      assert(isTruthy({ baz: 'qux' }, context));
      assert(!isTruthy({ baz: 'fez' }, context));
    });

    it('should work for deeply nested values', () => {
      const context = { a: { b: { c: { d: 'efg' } } } };
      assert(isTruthy({ a: { b: { c: { d: 'efg' } } } }, context));
      assert(!isTruthy({ a: { b: { c: { d: 'efg', extra: true } } } }, context));
      assert(!isTruthy({ a: { b: { c: { d: 'efgh' } } } }, context));
    });
  });
});
