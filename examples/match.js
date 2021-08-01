'use strict';

const whence = require('..');

const clauses = [
  { when: 'foo === "bar"', result: 1 },
  { when: 'foo === "baz"', result: 2 },
  { when: 'foo === "qux"', result: 3 },
  { when: 'foo === "fez"', result: 4 }
];

(async () => {
  const match = whence.match(clauses, { prop: 'result' });

  console.log(await match({ foo: 'bar' }));
  console.log(await match({ foo: 'baz' }));
  console.log(await match({ foo: 'qux' }));
  console.log(await match({ foo: 'fez' }));
})();
