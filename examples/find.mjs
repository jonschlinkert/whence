'use strict';

const whence = require('..');

const clauses = [
  { when: 'foo === "bar"', result: 1 },
  { when: 'foo === "baz"', result: 2 },
  { when: 'foo === "qux"', result: 3 },
  { when: 'foo === "fez"', result: 4 }
];

console.log(whence.find(clauses, { foo: 'bar' }, { prop: 'result' }));
console.log(whence.find(clauses, { foo: 'baz' }, { prop: 'result' }));
console.log(whence.find(clauses, { foo: 'qux' }, { prop: 'result' }));
console.log(whence.find(clauses, { foo: 'fez' }, { prop: 'result' }));
