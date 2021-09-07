'use strict';

const { compile } = require('..');

const fn = compile('type === "foo"');

(async () => {
  console.log(await fn({ type: 'foo' })); //=> true
  console.log(await fn({ type: 'bar' })); //=> false
})();
