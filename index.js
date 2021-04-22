'use strict';

const kFn = Symbol('when');
const compile = require('./compile');

const isObject = val => val !== null && typeof val === 'object' && !Array.isArray(val);

const isEqual = (a, b) => {
  if (!a && !b) return true;
  if (!a && b || a && !b) return false;
  if (!isObject(a) || !isObject(b)) return false;
  for (const k of Object.keys(a)) {
    if (isObject(a[k]) && isObject(b[k])) {
      if (!isEqual(a[k], b[k])) {
        return false;
      }
    } else if (a[k] !== b[k]) {
      return false;
    }
  }
  return true;
};

const whence = (input, context, options = {}) => {
  return whence.compile(input, options)(context);
};

whence.precompile = (clause, options = {}) => {
  if (Array.isArray(clause)) {
    return clause.map(ele => whence.precompile(ele, options));
  }

  clause[kFn] = whence(clause.when, options);
  return clause;
};

whence.evaluate = (input, context, options) => whence(input, context, options);

whence.is = (input, context, options) => {
  return whence.evaluate(input, context, { ...options, boolean: true });
};

whence.find = (clauses = [], context, options = {}) => {
  for (const ele of [].concat(clauses)) {
    const clause = ele[kFn] || (ele[kFn] = whence(ele.when, options));
    const value = clause(context);
    if (value) {
      return (options.prop && isObject(value)) ? value[options.prop] : value;
    }
  }
};

whence.resolve = (clauses = [], options) => {
  return (context, props = []) => {
    const prop = options && options.prop;
    const keys = new Set([].concat(props));
    const seen = new Set();
    const values = {};

    for (const ele of [].concat(clauses)) {
      if ((keys.size > 0 && !keys.has(ele.key)) || seen.has(ele.key)) continue;

      const clause = ele[kFn] || (ele[kFn] = whence(ele.when, options));
      const value = clause(context);

      if (value !== void 0) {
        seen.add(ele.key);
        values[ele.key] = (prop && isObject(value)) ? value[prop] : value;
      }
    }
    return values;
  };
};

whence.hydrate = (clauses = [], options) => {
  return (context, props = []) => {
    const prop = options && options.prop;
    const keys = new Set([].concat(props));
    const seen = new Set();
    const values = {};

    for (const ele of [].concat(clauses)) {
      if ((keys.size > 0 && !keys.has(ele.key)) || seen.has(ele.key)) continue;

      const clause = ele[kFn] || (ele[kFn] = whence(ele.when, options));
      const value = clause(context);

      if (value !== void 0) {
        seen.add(ele.key);
        values[ele.key] = (prop && isObject(value)) ? value[prop] : value;
      }
    }
    return values;
  };
};

whence.match = (clauses = [], options) => {
  whence.precompile(clauses, options);
  return context => whence.find(clauses, context, options);
};

whence.compare = (input, options) => {
  if (input === void 0) return () => true;
  if (typeof input === 'boolean') return () => input;
  if (typeof input === 'function') return input;
  if (isObject(input)) {
    if (input.when != null) {
      input[kFn] = whence.compile(input.when, options);
    }
    if (input.skip != null) {
      input[kFn] = context => !whence.compile(input.skip, options)(context);
    }
    if (typeof input[kFn] === 'function') {
      return input[kFn];
    }
    return context => isEqual(input, context);
  }

  if (typeof input === 'string') {
    return whence.compile(input, options);
  }
};

whence.compile = (input, options = {}) => {
  if (typeof input !== 'string') {
    return whence.compare(input, options);
  }
  if (options.sync === true) {
    return whence.compileSync(input, options);
  }
  return compile(input, options);
};

whence.compileSync = (input, options = {}) => {
  // if (typeof input !== 'string') {
  //   return whence.compare(input, options);
  // }
  return compile.sync(input, { sync: true, ...options });
};

whence.compileSync = compile.sync;
whence.whence = whence;
module.exports = whence;


// const resolve = whence(clauses, options);
// console.log(resolve(context, ['name', 'username']));
