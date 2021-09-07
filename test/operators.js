'use strict';

const { strict: assert } = require('assert');
const e = require('..');

describe('operators', () => {
  describe('in', () => {
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
});
