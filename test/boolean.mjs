import { strict as assert } from 'assert';
import spy from './support/spy.mjs';
import e from '../index.mjs';

describe('evaluate', () => {
  describe('or operator', () => {
    it('1 or 0', () => {
      assert.equal(e.sync('1 or 0', {}, { booleanLogicalOperators: true }), true);
    });

    it('1 or 1', () => {
      assert.equal(e.sync('1 or 1', {}, { booleanLogicalOperators: true }), true);
    });

    it('0 or 0', () => {
      assert.equal(e.sync('0 or 0', {}, { booleanLogicalOperators: true }), false);
    });

    it('0 or 1', () => {
      assert.equal(e.sync('0 or 1', {}, { booleanLogicalOperators: true }), true);
    });

    it('0 or 1 or 0', () => {
      assert.equal(e.sync('0 or 1 or 0', {}, { booleanLogicalOperators: true }), true);
    });

    it('1 or 1 or 0', () => {
      assert.equal(e.sync('1 or 1 or 0', {}, { booleanLogicalOperators: true }), true);
    });

    it('skips right when left is true', () => {
      const notCalled = spy(() => false);
      const opts = { functions: true, booleanLogicalOperators: true };

      assert.equal(e.sync('true or notCalled()', { notCalled }, opts), true);
      assert.equal(notCalled.called, false);
    });

    it('evaluates right when left is false', () => {
      const called = spy(() => true);
      const opts = { functions: true, booleanLogicalOperators: true };

      assert.equal(e.sync('false or called()', { called }, opts), true);
      assert.equal(called.called, true);
    });
  });

  describe('in operator', () => {
    it('"a" in ["a", "b"]', () => {
      assert.equal(e.sync('"a" in toto', { 'toto': ['a', 'b'] }), true);
    });

    it('"a" in ["b", "a"]', () => {
      assert.equal(e.sync('"a" in toto', { 'toto': ['b', 'a'] }), true);
    });

    it('3 in [4, 3]', () => {
      assert.equal(e.sync('3 in toto', { 'toto': [4, 3] }), true);
    });

    it('"c" in ["a", "b"]', () => {
      assert.equal(e.sync('"c" in toto', { 'toto': ['a', 'b'] }), false);
    });

    it('"c" in ["b", "a"]', () => {
      assert.equal(e.sync('"c" in toto', { 'toto': ['b', 'a'] }), false);
    });

    it('3 in [1, 2]', () => {
      assert.equal(e.sync('3 in toto', { 'toto': [1, 2] }), false);
    });
  });

  describe('not operator', () => {
    it('not 1', () => {
      assert.equal(e.sync('not 1', {}, { notExpression: true }), false);
    });

    it('not true', () => {
      assert.equal(e.sync('not true', {}, { notExpression: true }), false);
    });

    it('not 0', () => {
      assert.equal(e.sync('not 0', {}, { notExpression: true }), true);
    });

    it('not false', () => {
      assert.equal(e.sync('not false', {}, { notExpression: true }), true);
    });

    it('not 4', () => {
      assert.equal(e.sync('not 4', {}, { notExpression: true }), false);
    });

    it('1 and not 0', () => {
      assert.equal(e.sync('1 and not 0', {}, { notExpression: true }), true);
      assert.equal(e.sync('1 and not 1', {}, { notExpression: true }), false);
    });

    it('0 or not 1', () => {
      assert.equal(e.sync('0 or not 0', {}, { notExpression: true }), true);
      assert.equal(e.sync('a or not b', { a : false, b: null }, { notExpression: true }), true);
      assert.equal(e.sync('a or not b', { a : false, b: true }, { notExpression: true }), false);
    });

    it('not "0"', () => {
      assert.equal(e.sync('not "0"', {}, { notExpression: true }), false);
    });

    it('not "', () => {
      assert.equal(e.sync('not ""', {}, { notExpression: true }), true);
    });
  });
});
