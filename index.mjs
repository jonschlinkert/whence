/* eslint-disable no-case-declarations */

import expression from 'eval-estree-expression';
import babel from '@babel/parser';
import Lexer from './lib/Lexer.mjs';

const { evaluate } = expression;
const { transform } = Lexer;

const isObject = v => v !== null && typeof v === 'object' && !Array.isArray(v);

const isPrimitive = value => {
  return value == null || (typeof value !== 'object' && typeof value !== 'function');
};

const isTruthy = (left, right, parent) => {
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
      return left.every(ele => isTruthy(ele, right, left));
    }

    if (Array.isArray(right)) {
      return left.every((ele, i) => isTruthy(ele, right[i], left));
    }
  }

  if (isObject(left)) {
    return isObject(right) && Object.entries(left).every(([k, v]) => isTruthy(v, right[k], left));
  }

  return false;
};

const parse = (source, options = {}) => {
  if (typeof source === 'string') {
    const input = (options.notExpression || options.booleanLogicalOperators)
      ? transform(source, options)
      : source;

    const ast = babel.parseExpression(input, options);
    return { input, ast, options };
  }

  if (isObject(source) && source.type === 'Program') {
    return { input: '', ast: source.body[0].expression, options };
  }

  if (isObject(source) && source.type) {
    return { input: '', ast: source, options };
  }

  return { input: source, ast: null, options };
};

const whence = (source, context = {}, opts = {}) => {
  if (opts.truthy === true) return isTruthy(source, context);
  const { ast, options } = parse(source, opts);
  return evaluate(ast, context, options);
};

const sync = (source, context = {}, opts = {}) => {
  if (opts.truthy === true) return isTruthy(source, context);
  const { ast, options } = parse(source, opts);
  return evaluate.sync(ast, context, options);
};

const compile = (...args) => {
  const { ast, options } = parse(...args);
  return context => evaluate(ast, context, options);
};

const compileSync = (...args) => {
  const { ast, options } = parse(...args);
  return context => evaluate.sync(ast, context, options);
};

compile.sync = compileSync;
whence.expression = expression;
whence.compile = compile;
whence.compileSync = compileSync;
whence.transform = transform;
whence.isTruthy = isTruthy;
whence.parse = parse;
whence.sync = sync;

export { compile, compileSync, isTruthy, Lexer, parse, sync, transform, whence };
export default whence;
