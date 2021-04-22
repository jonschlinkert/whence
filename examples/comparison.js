'use strict';

const { compile, evaluate, parse, whence } = require('..');

const time = () => {
  const start = process.hrtime.bigint();
  return () => {
    const end = process.hrtime.bigint();
    const diff = Number(end - start);
    return (diff / 1e6).toFixed(2) + 'ms';
  };
};

const fixtures = [
  '9 === 9',
  '9 === 8',
  '9 > 8',
  '9 < 8',
  '9 <= 8',
  '-.1 >= -.2',
  '-0.1 >= -0.2',
  '-1 >= -2',
  '+1 <= +2',
  '9 >= 8',
  '9.1 >= 9.01',
  '-1 === -1',

  'false === false',
  'true === false',
  'true === true',

  'false || false',
  'true || false',
  'true || true',

  'false||false',
  'true||false',
  'true||true',

  'false && false',
  'true && false',
  'true && true',

  'false&&false',
  'true&&false',
  'true&&true',

  'a === void (0)',
  'a === void (42)',
  'a === void 42',
  'a === void 0',
  'a === undefined',
  'a === null',

  'undef !== true',
  'undef !== false',
  'undef === true',
  'undef === false',

  'bool !== true',
  'bool !== false',
  'bool === true',
  'bool === false',

  '((typeof foo === "string") && ((baz === qux) || (a <= b) || (c >= d) || (e > f)))',
  '((typeof foo === "string") && ((baz === "qux") || (a <= b) || (c >= d) || (e > f)))',
  '((typeof foo === "string") && (typeof bar !== "string"))',
  '((baz === "qux") && (a <= b) || (c >= d) || (e > f))',
  '((baz === "qux") && ((a != "b") && (c != "d")) || (e != f))',

  'typeof +d.e.f === typeof x.y.z',
  'typeof +d.e.f === typeof 10',

  'typeof foo !== "string"',
  'typeof bar !== "string"',
  'typeof bar === "number"',
  'typeof baz === "number"',
  'typeof foo === typeof baz',
  'typeof 9 === typeof 10',
  'typeof 9 === typeof bar',
  'typeof 9 === typeof baz',
  'typeof -9 === typeof baz',
  'typeof num !== typeof -9',
  'typeof +num !== typeof -9',

  'typeof foo != "string"',
  'typeof bar != "string"',
  'typeof bar == "number"',
  'typeof baz == "number"',
  'typeof foo == typeof baz',
  'typeof 9 == typeof 10',
  'typeof 9 == typeof bar',
  'typeof 9 == typeof baz',
  'typeof -9 == typeof baz',
  'typeof num != typeof -9',
  'typeof +num != typeof -9',

  'process.platform === "linux"',
  'process.platform === "darwin"',
  'process.platform === "win32"',

  'platform === "linux"',
  'platform === "darwin"',
  'platform === "win32"',

  'process.platform==="linux"',
  'process.platform==="darwin"',
  'process.platform==="win32"',

  'platform==="linux"',
  'platform==="darwin"',
  'platform==="win32"',

  'process.platform=="linux"',
  'process.platform=="darwin"',
  'process.platform=="win32"',

  'platform=="linux"',
  'platform=="darwin"',
  'platform=="win32"',
  'platform',
  '!platform',
  '!!platform',
  '!!platform === false',
  '!platform === true',
  '!!platform === true',
  '!platform === false',
  '!(platform === false)',
  '!!(platform === false)',
  'typeof focused.items === "array"',
  'string || focused.type === "editable"',
  'allEqual("foo", "foo", "bar")',
  'allEqual("foo", "foo", "foo")',
  'isEqual("foo", "foo")',
  'isEqual(a, b)',
  'allEqual(a, b, c)',
  'allEqual(a, b, b, a, b, a, c)',
  'allEqual(isEqual(a, b), isEqual(b, b))',
  'allEqual(isEqual(a, b), isEqual(b, c))',
  'prompt.submitted && item === focused && !item.isEmpty()',
  'isEqual("foo", c)',
];

const resolve = value => {
  return typeof value === 'function' ? value() : value;
};

const focused = { items: [], type: 'editable', isEmpty: () => true };
const item = focused;
const context = {
  a: 1,
  b: 1,
  c: 'foo',
  foo: 'This is foo!',
  bar: 8,
  baz: 'qux',
  bool: true,
  num: '-9',
  d: { e: { f: '21' } },
  x: { y: { z: 42 } },
  focused,
  item,
  string: true,
  process,
  prompt: { submitted: true },
  isEqual(a, b) {
    return resolve(a) === resolve(b);
  },
  allEqual(...args) {
    // console.log(args)
    // const arr = args.map(e => {
    //   console.log(e)
    //   return typeof e === 'function' ? e.call(context) : e;
    // });
    // return arr.every(e => e === arr[0]);
    return args.every(e => resolve(e) === resolve(args[0]));
  },
  platform: process.platform,
  env: process.env,
};

/**
 * Contexts and variables to consider:
 * - item
 * - index
 * - cursor
 * - line
 * - tabstop (number)
 * - variable (string)
 * - field type - placeholder, transform, variable, etc.
 * - prompt type? - array, string, etc. Or input, choices, etc. Or both.
 * - inside (node or prompt type)
 * - focused
 * - platform
 * - process
 * - env
 * - argv
 *
 * Consider adding helpers to the context to be eval'd
 */

const elapsed = time();
const failed = [];
let count = 0;

const test = (input, locals) => {
  const a = whence(input, { boolean: true })({ ...context, ...locals });
  const b = evaluate(input, context, { boolean: true });
  const c = compile(input, { boolean: true })(context);
  const result = [a, b, c];
  count += 3;

  if (!result.every(e => a === e)) {
    console.log('Failed', [input, a, b, c]);
    failed.push([input, a, b, c]);
  }
};

for (let fixture of fixtures) {
  test(fixture, { a: 8, b: 8 });
  test(fixture, { a: 9, b: 9 });
  // test(fixture, { a: 10, b: 9 });
  // console.log(elapsed());
}

// console.log(whence('string')(context))
// console.log(whence('focused.type')(context))
// console.log(whence('focused.type === "editable"')(context))
// console.log(whence('string || focused.type === "editable" && bool')(context))

console.log('Passed:', (count / 3) - failed.length);
console.log('Failed:', failed.length);
console.log('Total', elapsed());

console.log(whence('"before" + JSON.stringify(include("package.json")) + "after"')())