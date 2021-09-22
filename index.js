'use strict';

const babel = require('@babel/parser');
const expression = require('eval-estree-expression');
const { evaluate } = expression;

const isAST = value => isObject(value) && hasOwnProperty.call(value, 'type');

const isObject = value => {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
};

const isPrimitive = value => {
  return value == null || (typeof value !== 'object' && typeof value !== 'function');
};

const LITERALS = {
  'undefined': undefined,
  'null': null,
  'true': true,
  'false': false
};

/**
 * Returns true if the given value is truthy, or the `value` ("left") is
 * equal to or contained within the `context` ("right") value. This method is
 * used by the `whence()` function (the main export), but you can use this
 * method directly if you don't want the values to be evaluated.
 *
 * @name equal
 * @param {any} `value` The value to test.
 * @param {Object} `context` The value to compare against.
 * @param {[type]} `parent`
 * @return {Boolean} Returns true or false.
 * @api public
 */

const equal = (value, context, options = {}) => {
  const eq = (a, b, parent, depth = 0) => {
    if (a === b) return true;

    if (a === 'undefined' || a === 'null') {
      return a === b;
    }

    if (typeof a === 'boolean' && (!parent || parent === context)) {
      return typeof b === 'boolean' ? a === b : a;
    }

    if ((a === 'true' || a === 'false') && (!parent || parent === context)) {
      return a === 'true';
    }

    // only call function values at the root
    if (typeof a === 'function' && depth === 0) {
      return a.call(b, b, options);
    }

    if (typeof a === 'string' && (isObject(b) && b === context || (depth === 0 && context === undefined))) {
      if (options.castBoolean === false || (b && hasOwnProperty.call(b, a))) {
        return Boolean(b[a]);
      }

      return whence.sync(a, b, options);
    }

    if (isPrimitive(a) && isObject(b)) {
      return Boolean(b[a]);
    }

    if (isPrimitive(a) && Array.isArray(b)) {
      return b.includes(a);
    }

    if (a instanceof RegExp) {
      return !(b instanceof RegExp) ? false : a.toString() === b.toString();
    }

    if (a instanceof Date) {
      return !(b instanceof Date) ? false : a.toString() === b.toString();
    }

    if (a instanceof Set) {
      return b instanceof Set && eq([...a], [...b], a, depth + 1);
    }

    if (a instanceof Map) {
      return b instanceof Map && [...a].every(([k, v]) => eq(v, b.get(k), a, depth + 1));
    }

    if (Array.isArray(a)) {
      if (isObject(b)) {
        return a.every(ele => eq(ele, b, a, depth + 1));
      }

      if (Array.isArray(b)) {
        return a.every((ele, i) => eq(ele, b[i], a, depth + 1));
      }
    }

    if (isObject(a)) {
      return isObject(b) && Object.entries(a).every(([k, v]) => eq(v, b[k], a, depth + 1));
    }

    return false;
  };

  return eq(value, context);
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
 * //   value: Node { type: 'Identifier', name: 'platform' },
 * //   operator: '===',
 * //   context: Node {
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

const whence = async (source, context, options = {}) => {
  if (isAST(source)) {
    return compile(source, options)(context);
  }

  if (typeof source !== 'string' || (isPrimitive(context) && context !== undefined)) {
    return equal(source, context, options);
  }

  if (hasOwnProperty.call(LITERALS, source)) {
    return options.castBoolean !== false ? Boolean(LITERALS[source]) : LITERALS[source];
  }

  const result = compile(source, options)(context);
  return options.castBoolean !== false ? Boolean(await result) : result;
};

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

const whenceSync = (source, context, options = {}) => {
  if (isAST(source)) {
    return compile.sync(source, options)(context);
  }

  if (typeof source !== 'string' || (isPrimitive(context) && context !== undefined)) {
    return equal(source, context, options);
  }

  if (hasOwnProperty.call(LITERALS, source)) {
    return options.castBoolean !== false ? Boolean(LITERALS[source]) : LITERALS[source];
  }

  const result = compile.sync(source, options)(context);
  return options.castBoolean !== false ? Boolean(result) : result;
};

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
  const opts = { strictVariables: false, booleanLogicalOperators: true, ...options };
  const ast = parse(source, opts);

  return context => {
    return evaluate(ast, context, opts);
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
  const opts = { strictVariables: false, booleanLogicalOperators: true, ...options };
  const ast = parse(source, opts);

  return context => {
    return evaluate.sync(ast, context, opts);
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
