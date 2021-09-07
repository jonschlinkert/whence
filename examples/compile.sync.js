'use strict';

const { compile } = require('..');

const fn = compile.sync('type === "foo"');

console.log(fn({ type: 'foo' })); //=> true
console.log(fn({ type: 'bar' })); //=> false

