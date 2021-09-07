'use strict';

const babel = require('@babel/parser');
const expression = require('eval-estree-expression');
const { evaluate } = expression;

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

const isPrimitive = value => {
  return value == null || (typeof value !== 'object' && typeof value !== 'function');
};

/**
 * Returns true if the given value is truthy, or the `left` value is contained within
 * the `right` value.
 *
 * @name equal
 * @param {any} `left` The value to test.
 * @param {Object} `right` The value to compare against.
 * @param {[type]} `parent`
 * @return {Boolean} Returns true or false.
 * @api public
 */

const equal = (left, right, parent) => {
  if (left === right) return true;

  if (typeof left === 'boolean' && !parent) {
    if (isPrimitive(right)) return left === right;
    return left;
  }

  if (isPrimitive(left) && isObject(right)) {
    return Boolean(right[left]);
  }

  if (isPrimitive(left) && Array.isArray(right)) {
    return right.includes(left);
  }

  if (Array.isArray(left)) {
    if (isObject(right)) {
      return left.every(ele => equal(ele, right, left));
    }

    if (Array.isArray(right)) {
      return left.every((ele, i) => equal(ele, right[i], left));
    }
  }

  if (isObject(left)) {
    return isObject(right) && Object.entries(left).every(([k, v]) => equal(v, right[k], left));
  }

  return false;
};

/**
 * Parses the given expression string with [@babel/parser][] and returns and AST. You may also
 * an [estree][]-compatible expression AST.
 *
 * ```js
 * const { parse } = require('whence');
 *
 * console.log(parse('platform === "darwin"'));
 * // Resuls in something like this:
 * // Node {
 * //   type: 'BinaryExpression',
 * //   left: Node { type: 'Identifier', name: 'platform' },
 * //   operator: '===',
 * //   right: Node {
 * //     type: 'StringLiteral',
 * //     extra: { rawValue: 'darwin', raw: '"darwin"' },
 * //     value: 'darwin'
 * //   }
 * // }
 * ```
 * @name parse
 * @param {String} `source` Expression string or an [estree][]-compatible expression AST.
 * @param {Object} `options`
 * @return {Object}
 * @api public
 */

const parse = (source, options = {}) => {
  if (typeof source === 'string') {
    return babel.parseExpression(source, options);
  }

  if (isObject(source) && source.type === 'Program') {
    return source.body?.[0]?.expression;
  }

  if (isObject(source) && source.type) {
    return source;
  }

  return null;
};

/**
 * Asynchronously evaluates the given expression and returns a boolean.
 *
 * ```js
 * const whence = require('whence');
 *
 * console.log(await whence('10 < 20')); //=> true
 * console.log(whence.sync('10 < 20')); //=> true
 * ```
 * @name whence
 * @param {String|Object} `source` Expression string or an [estree][]-compatible expression AST.
 * @param {Object} `context`
 * @param {Object} `options`
 * @return {Boolean}
 * @api public
 */

const whence = (source, context = {}, options = {}) => compile(source, options)(context);

/**
 * Synchronous version of [whence](#whence). Aliased as `whence.sync()`.
 *
 * ```js
 * const { whenceSync } = require('whence');
 *
 * console.log(whenceSync('10 < 20')); //=> true
 * ```
 * @name whenceSync
 * @param {String|Object} `source` Expression string or an [estree][]-compatible expression AST.
 * @param {Object} `context`
 * @param {Object} `options`
 * @return {Boolean}
 * @api public
 */

const whenceSync = (source, context = {}, options = {}) => compileSync(source, options)(context);

/**
 * Compiles the given expression and returns an async function.
 *
 * ```js
 * const { compile } = require('whence');
 * const fn = compile('type === "foo"');
 *
 * console.log(await fn({ type: 'foo' })); //=> true
 * console.log(await fn({ type: 'bar' })); //=> false
 * ```
 * @name compile
 * @param {String|Object} `source` Expression string or an [estree][]-compatible expression AST.
 * @param {Object} `options`
 * @return {Function} Returns a function that takes a `context` object.
 * @api public
 */

const compile = (source, options) => {
  const ast = parse(source, options);

  return context => {
    return evaluate(ast, context, options);
  };
};

/**
 * Synchronous version of [compile](#compile). This method is also alias as `.compile.sync()`.
 *
 * ```js
 * const { compile } = require('whence');
 * const fn = compile.sync('type === "foo"');
 *
 * console.log(fn({ type: 'foo' })); //=> true
 * console.log(fn({ type: 'bar' })); //=> false
 * ```
 * @name compileSync
 * @param {String|Object} `source` Expression string or an [estree][]-compatible expression AST.
 * @param {Object} `options`
 * @return {Function} Returns a function that takes a `context` object.
 * @api public
 */

const compileSync = (source, options) => {
  const ast = parse(source, options);

  return context => {
    return evaluate.sync(ast, context, options);
  };
};

compile.sync = compileSync;
whence.compile = compile;
whence.compileSync = compileSync;
whence.equal = equal;
whence.evaluate = evaluate;
whence.expression = expression;
whence.parse = parse;
whence.sync = whenceSync;

module.exports = whence;
