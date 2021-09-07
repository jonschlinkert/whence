'use strict';

const { parse } = require('..');
const inspect = require('eval-estree-expression/lib/inspect');

console.log(inspect(parse('platform === "darwin"')));
