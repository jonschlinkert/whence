/* eslint-disable no-case-declarations */
'use strict';

const typeOf = require('kind-of');

const isObject = value => typeOf(value) === 'object';
const isPrimitive = value => {
  return value == null || (typeof value !== 'object' && typeof value !== 'function');
};

const wrap = (input, context = {}) => {
  if (/[$#{]/.test(input) && !input.startsWith('`') && !input.endsWith('`')) {
    return `\`${input}\``;
  }

  return input;
};

// eslint-disable-next-line no-unused-vars
const isEqual = (valueA, valueB) => {
  const equal = (a, b) => {
    if (a === b) return true;

    if (isPrimitive(a)) {
      if (isObject(b) && b === valueB) {
        let expected = b[a];

        if (typeof a === 'string' && a.startsWith('!')) {
          a = a.slice(1);
          expected = b[a];

          if (typeof expected === 'boolean') {
            expected = !expected;
          }
        }

        return expected === true;
      }

      return false;
    }

    if (isObject(a)) {
      if (!isObject(b)) return false;
      for (const [key, value] of Object.entries(a)) {
        if (!equal(value, b[key])) {
          return false;
        }
      }
      return true;
    }

    if (Array.isArray(a)) {
      if (Array.isArray(b)) {
        return a.every((value, i) => equal(value, b[i]));
      }

      return a.every(value => equal(value, b));
    }

    if (typeOf(a) !== typeOf(b)) {
      return false;
    }

    // other checks could be done here
    return true;
  };

  return equal(valueA, valueB);
};

const compile = (input, options = {}) => {
  if (input === 'undefined') return () => undefined;
  if (input === 'null') return () => null;

  const output = typeof input === 'string' ? wrap(input) : input;

  if (typeof output !== 'string' || /^[a-z_]+$/.test(output)) {
    return context => isEqual(output, context);
  }

  return (context = {}) => {
    const { helpers } = options;

    if (helpers) {
      for (const key of Object.keys(helpers)) {
        const helper = [context[key], helpers[key]].find(v => typeof v === 'function');
        context[key] = (...args) => helper.call(context, ...args);
      }
    }

    const assign = (context, locals) => {
      if (typeof context[Symbol.iterator] === 'function') {
        context = Object.assign(...context);
      }
      return { ...context, ...locals };
    };

    context.compile = (str, opts) => compile(str, { ...options, ...opts });
    context.render = (str, locals, opts) => {
      return context.compile(str, opts)(assign(context, locals));
    };

    try {
      if (typeof context[Symbol.iterator] === 'function') {
        context = Object.assign(...context);
      }

      const keys = Object.keys(context);
      const values = Object.values(context);
      // eslint-disable-next-line no-new-func
      const render = Function(keys, `'use strict';return ${output}`);
      const result = render.call(context, ...values);
      return options.boolean ? Boolean(result) : result;
    } catch (err) {
      if (options.strictErrors !== false || !err.message.includes('is not defined')) {
        err.input = input;
        err.wrapped = output;
        err.context = context;
        throw err;
      }
      return options.boolean ? false : void 0;
    }
  };
};

const whence = (input, context, options) => {
  return compile(input, options)(context);
};

whence.isEqual = isEqual;
whence.compile = compile;
module.exports = whence;
