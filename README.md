# whence [![NPM version](https://img.shields.io/npm/v/whence.svg?style=flat)](https://www.npmjs.com/package/whence) [![NPM monthly downloads](https://img.shields.io/npm/dm/whence.svg?style=flat)](https://npmjs.org/package/whence) [![NPM total downloads](https://img.shields.io/npm/dt/whence.svg?style=flat)](https://npmjs.org/package/whence)  [![Tests](https://github.com/jonschlinkert/whence/actions/workflows/test.yml/badge.svg)](https://github.com/jonschlinkert/whence/actions/workflows/test.yml)

> Whence safely evaluates user-defined conditional expressions, allowing you to add context awareness to your apps and frameworks. Useful for evaluating expressions in config files, prompts, key bindings, completions, templates, and many other user cases.

Please consider following this project's author, [Jon Schlinkert](https://github.com/jonschlinkert), and consider starring the project to show your :heart: and support.

## Install

Install with [npm](https://www.npmjs.com/) (requires [Node.js](https://nodejs.org/en/) >=14):

```sh
$ npm install --save whence
```

## What is whence?

This libarary doest returneth true if thine 'when' clause doest matcheth the granted context object.

### Seriously though, what does this library do?

Whence uses [eval-estree-expression](https://github.com/jonschlinkert/eval-estree-expression) to _safely evaluate_ user-defined conditional expressions, sometimes referred to as "when" clauses.

### Why do I need this?

Add _context awareness_ to your apps and frameworks.

Conditional expressions are useful in config files, creating prompts, determining key bindings, filtering suggestions and completions, variables in templates and snippets, and many other user cases.

It's even more useful when those conditional expressions can be evaluated safely.

**Example: configuration files**

For example, when authoring configuration files for workflows, pipelines, builds, and so on, it's common for developers to define expressions with conditionals to determine if or when a job, task, or step should run based on environment variables, etc. These configurations are typically defined using YAML, JSON or a similar data format, which means that conditional expressions must be written as strings, booleans, or numbers. Whence makes it safe and easy to evalue these expressions.

**Other use cases**

* Templates and snippets - Use whence to conditionally render files, sections, or variables
* Completions and suggestions - Use whence to filter completions and suggestions in your text editor or prompt system
* Key bindings - [VS Code](https://code.visualstudio.com/api/references/when-clause-contexts) and other text editors use `when` clauses or something similar to determine the keybindings to use when a key is pressed.

### How safe is it?

No assignment operators, functions, or function calls are allowed by default to make it as safe as possible to evaluate user-defined expressions. To accomplish this, `whence` uses the [eval-estree-expression](https://github.com/jonschlinkert/eval-estree-expression) library, which takes an [estree](https://github.com/estree/estree) expression from [@babel/parser][], [esprima](http://esprima.org), [acorn](https://github.com/acornjs/acorn), or any similar library that parses and returns a valid `estree` expression.

### Why another "eval" library?

**What we found**

Every other eval library I found had one of the following shortcomings:

* Uses `eval` or Node's `vm` or something similar to evaluate code. This is to risky, or too heavy for our use cases.
* Functions are either the primary use case or are supported by default. We don't want users to be able to define functions in their config files.
* Naive attempts to sanitize code before evaluating it
* Brittle, incomplete, hand-rolled parsers

**What whence does differently**

* Whence takes a valid [estree][] _expression_ AST
* Functions are not supported by default, although you can enable function support (See the [eval-estree-expression](https://github.com/jonschlinkert/eval-estree-expression) docs for more details)
* Special care was taken in [eval-estree-expression](https://github.com/jonschlinkert/eval-estree-expression) to disallow assignment operators, functions, or other potentially malicious code, like setting `__proto__`, `constructor`, `prototype`, or `undefined` as a property name on nested properties.

## Usage

```js
const whence = require('whence');

// async usage
console.log(await whence('amount > 100', { amount: 101 }));
console.log(await whence('a < b && c > d', { a: 0, b: 1, c: 3, d: 2 }));
console.log(await whence('platform === "darwin"', { platform: process.platform }));

// sync usage
console.log(whence.sync('amount > 100', { amount: 101 }));
console.log(whence.sync('a < b && c > d', { a: 0, b: 1, c: 3, d: 2 }));
console.log(whence.sync('platform === "darwin"', { platform: process.platform }));
```

See [eval-estree-expression](https://github.com/jonschlinkert/eval-estree-expression) and the `eval-estree-expression` unit tests for many more examples of the types of expressions that are supported.

## API

### [equal](index.js#L25)

Returns true if the given value is truthy, or the `left` value is contained within
the `right` value.

**Params**

* `left` **{any}**: The value to test.
* `right` **{Object}**: The value to compare against.
* `parent` **{[type](https://github.com/medikoo/type)}**
* `returns` **{Boolean}**: Returns true or false.

### [parse](index.js#L85)

Parses the given expression string with [@babel/parser][] and returns and AST. You may also an [estree][]-compatible expression AST.

**Params**

* `source` **{String}**: Expression string or an [estree][]-compatible expression AST.
* `options` **{Object}**
* `returns` **{Object}**

**Example**

```js
const { parse } = require('whence');

console.log(parse('platform === "darwin"'));
// Resuls in something like this:
// Node {
//   type: 'BinaryExpression',
//   left: Node { type: 'Identifier', name: 'platform' },
//   operator: '===',
//   right: Node {
//     type: 'StringLiteral',
//     extra: { rawValue: 'darwin', raw: '"darwin"' },
//     value: 'darwin'
//   }
// }
```

### [whence](index.js#L118)

Asynchronously evaluates the given expression and returns a boolean.

**Params**

* `source` **{String|Object}**: Expression string or an [estree][]-compatible expression AST.
* `context` **{Object}**
* `options` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
const whence = require('whence');

console.log(await whence('10 < 20')); //=> true
console.log(whence.sync('10 < 20')); //=> true
```

### [whenceSync](index.js#L136)

Synchronous version of [whence](#whence). Aliased as `whence.sync()`.

**Params**

* `source` **{String|Object}**: Expression string or an [estree][]-compatible expression AST.
* `context` **{Object}**
* `options` **{Object}**
* `returns` **{Boolean}**

**Example**

```js
const { whenceSync } = require('whence');

console.log(whenceSync('10 < 20')); //=> true
```

### [compile](index.js#L155)

Compiles the given expression and returns an async function.

**Params**

* `source` **{String|Object}**: Expression string or an [estree][]-compatible expression AST.
* `options` **{Object}**
* `returns` **{Function}**: Returns a function that takes a `context` object.

**Example**

```js
const { compile } = require('whence');
const fn = compile('type === "foo"');

console.log(await fn({ type: 'foo' })); //=> true
console.log(await fn({ type: 'bar' })); //=> false
```

### [compileSync](index.js#L180)

Synchronous version of [compile](#compile). This method is also alias as `.compile.sync()`.

**Params**

* `source` **{String|Object}**: Expression string or an [estree][]-compatible expression AST.
* `options` **{Object}**
* `returns` **{Function}**: Returns a function that takes a `context` object.

**Example**

```js
const { compile } = require('whence');
const fn = compile.sync('type === "foo"');

console.log(fn({ type: 'foo' })); //=> true
console.log(fn({ type: 'bar' })); //=> false
```

## Options

Supports all options from [eval-estree-expression](https://github.com/jonschlinkert/eval-estree-expression) along with the following `whence` options.

## Examples

## About

<details>
<summary><strong>Contributing</strong></summary>

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](../../issues/new).

</details>

<details>
<summary><strong>Running Tests</strong></summary>

Running and reviewing unit tests is a great way to get familiarized with a library and its API. You can install dependencies and run tests with the following command:

```sh
$ npm install && npm test
```

</details>

<details>
<summary><strong>Building docs</strong></summary>

_(This project's readme.md is generated by [verb](https://github.com/verbose/verb-generate-readme), please don't edit the readme directly. Any changes to the readme must be made in the [.verb.md](.verb.md) readme template.)_

To generate the readme, run the following command:

```sh
$ npm install -g verbose/verb#dev verb-generate-readme && verb
```

</details>

### Author

**Jon Schlinkert**

* [GitHub Profile](https://github.com/jonschlinkert)
* [Twitter Profile](https://twitter.com/jonschlinkert)
* [LinkedIn Profile](https://linkedin.com/in/jonschlinkert)

### License

Copyright © 2021, [Jon Schlinkert](https://github.com/jonschlinkert).
Released under the [MIT License](LICENSE).

***

_This file was generated by [verb-generate-readme](https://github.com/verbose/verb-generate-readme), v0.8.0, on September 07, 2021._