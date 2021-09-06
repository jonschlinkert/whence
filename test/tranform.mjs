import { strict as assert } from 'assert';
import { transform } from '../index.mjs';

describe('transform', () => {
  describe('explicitly enabled operators', () => {
    it('should enable "and"', () => {
      const opts = { booleanLogicalOperators: ['and'] };
      assert.equal(transform('a and b', opts), 'a && b');
      assert.equal(transform('a and b or c', opts), 'a && b or c');
    });

    it('should enable "or"', () => {
      const opts = { booleanLogicalOperators: ['or'] };
      assert.equal(transform('a and b', opts), 'a and b');
      assert.equal(transform('a and b or c', opts), 'a and b || c');
    });

    it('should enable "and" and "or"', () => {
      const opts = { booleanLogicalOperators: ['and', 'or'] };
      assert.equal(transform('a and b', opts), 'a && b');
      assert.equal(transform('a and b or c', opts), 'a && b || c');
    });
  });

  describe('"or" and "and"', () => {
    it('should transform and to &&', () => {
      assert.equal(transform('a and b'), 'a && b');
      assert.equal(transform('a and b and c'), 'a && b && c');
    });

    it('should transform or to ||', () => {
      assert.equal(transform('a or b'), 'a || b');
      assert.equal(transform('a or b or c'), 'a || b || c');
    });

    it('should transform "or" and "and"', () => {
      assert.equal(transform('a or b and c'), 'a || b && c');
      assert.equal(transform('a or b and c or d'), 'a || b && c || d');
    });

    it('should not transform words in literals', () => {
      assert.equal(transform('a or "b and c"'), 'a || "b and c"');
      assert.equal(transform('a or "b and c" or d'), 'a || "b and c" || d');
    });

    it('should recognize variables named "or" and "and"', () => {
      assert.equal(transform('or or and'), 'or || and');
      assert.equal(transform('and or or'), 'and || or');
      assert.equal(transform('and or and'), 'and || and');
      assert.equal(transform('and and and'), 'and && and');
      assert.equal(transform('or and or'), 'or && or');
      assert.equal(transform('or and and'), 'or && and');
      assert.equal(transform('and and or'), 'and && or');
      assert.equal(transform('and and or or and'), 'and && or || and');
      assert.equal(transform('or and and and or'), 'or && and && or');
      assert.equal(transform('a.b.c and d.e.f'), 'a.b.c && d.e.f');
    });

    it('should recognize parentheses', () => {
      assert.equal(transform('a or (b and c)'), 'a || (b && c)');
      assert.equal(transform('a or !(b and !c)'), 'a || !(b && !c)');
      assert.equal(transform('a or (b and c) or d'), 'a || (b && c) || d');
      assert.equal(transform('a or (!b and !c) or d'), 'a || (!b && !c) || d');
    });

    it('should retain whitespace', () => {
      assert.equal(transform('a  or  b  and  c'), 'a  ||  b  &&  c');
      assert.equal(transform('a   or   b   and   c   or   d'), 'a   ||   b   &&   c   ||   d');
    });
  });

  describe('"is", "isnt", "not" and "is not"', () => {
    it('should transform "is" to "==="', () => {
      assert.equal(transform('a is b'), 'a === b');
      assert.equal(transform('a is b and c is d'), 'a === b && c === d');
    });

    it('should transform "is not" to "!=="', () => {
      assert.equal(transform('a is not b'), 'a !== b');
      assert.equal(transform('a is not b and c is not d'), 'a !== b && c !== d');
    });

    it('should transform "isnt" to "!=="', () => {
      assert.equal(transform('a isnt b'), 'a !== b');
      assert.equal(transform('a isnt b and c isnt d'), 'a !== b && c !== d');
    });

    it('should transform "not" to "!"', () => {
      assert.equal(transform('not a'), '!a');
      assert.equal(transform('not a and not b'), '!a && !b');
    });

    it('should transform conditions with "defined" to "undefined"', () => {
      assert.equal(transform('1 is defined'), '1 !== undefined');
      assert.equal(transform('1 is not defined'), '1 === undefined');
      assert.equal(transform('1 isnt defined'), '1 === undefined');
      assert.equal(transform('1 !== defined'), '1 === undefined');
      assert.equal(transform('1 === defined'), '1 !== undefined');
      assert.equal(transform('1 is not null'), '1 !== null');
    });

    it('should recognize variables versus operators', () => {
      assert.equal(transform('is isnt not'), 'is !== not');
      assert.equal(transform('is or not'), 'is || not');
      assert.equal(transform('is or not not'), 'is || !not');
      assert.equal(transform('is or is not a'), 'is || !a');
      assert.equal(transform('is or a'), 'is || a');
      assert.equal(transform('not a or b'), '!a || b');
      assert.equal(transform('not a and not b'), '!a && !b');
    });
  });
});
