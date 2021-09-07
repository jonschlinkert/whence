'use strict';

const whence = require('..');

(async () => {
  console.log('=== async usage');
  console.log(await whence('amount > 100', { amount: 101 }));
  console.log(await whence('a < b && c > d', { a: 0, b: 1, c: 3, d: 2 }));
  console.log(await whence('platform === "darwin"', { platform: process.platform }));

  console.log('=== sync usage');
  console.log(whence.sync('amount > 100', { amount: 101 }));
  console.log(whence.sync('a < b && c > d', { a: 0, b: 1, c: 3, d: 2 }));
  console.log(whence.sync('platform === "darwin"', { platform: process.platform }));
})();

