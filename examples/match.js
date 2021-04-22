'use strict';

const whence = require('..');

const clauses = [
  { when: 'foo === "bar"', result: 1 },
  { when: 'foo === "baz"', result: 2 },
  { when: 'foo === "qux"', result: 3 },
  { when: 'foo === "fez"', result: 4 }
];

const match = whence.match(clauses, { prop: 'result' });

console.log(match({ foo: 'bar' }));
console.log(match({ foo: 'baz' }));
console.log(match({ foo: 'qux' }));
console.log(match({ foo: 'fez' }));
