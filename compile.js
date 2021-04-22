'use strict';

const fs = require('fs');
const path = require('path');

const wrap = input => {
  if (/[$#{]/.test(input) && !input.startsWith('`') && !input.endsWith('`')) {
    return `\`${input}\``;
  }
  return input;
};

const compile = (input = '', options = {}) => {
  return (context = {}) => {
    if (options.helpers) {
      for (const key of Object.keys(options.helpers)) {
        const fn = context[key];

        if (typeof fn === 'function') {
          context[key] = (...args) => fn.call(context, ...args);
          continue;
        }

        if (fn === void 0) {
          context[key] = (...args) => options.helpers[key].call(context, ...args);
        }
      }
    }

    context.compile = (str, opts) => compile(str, { ...options, ...opts });
    context.render = (str, locals, opts) => {
      return context.compile(str, opts)({ ...context, ...locals });
    };
    context.renderSync = (str, locals, opts) => {
      return compile.sync(str, opts)({ ...context, ...locals });
    };
    context.include = (filename, locals) => {
      const filepath = path.resolve(options.cwd || process.cwd(), filename);
      return context.render(fs.readFileSync(filepath, 'utf8'), locals);
    };

    return new Promise(async (resolve, reject) => {
      try {
        const output = wrap(input)
          .replace(/(?<!(?<!\\)\\)#{/g, '${')
          .replace(/(?<!(?<!\\)\\)\${(?:\s*await)?\s*/g, '${await ');

        const keys = Object.keys(context);
        const values = Object.values(context);

        // eslint-disable-next-line no-new-func
        const fn = Function(keys, `'use strict';return ((async() => ${output}))()`);
        const result = await fn.call(context, ...values);
        resolve(options.boolean ? Boolean(result) : result);
      } catch (err) {
        if (options.strictErrors !== false || !err.message.includes('is not defined')) {
          err.input = input;
          err.context = context;
          reject(err);
        } else {
          resolve(options.boolean ? false : void 0);
        }
      }
    });
  };
};

compile.sync = (input, options = {}) => {
  return (context = {}) => {
    if (options.helpers) {
      for (const key of Object.keys(options.helpers)) {
        if (context[key] === void 0) {
          context[key] = (...args) => options.helpers[key].call(context, ...args);
        }
      }
    }

    context.compile = (str, opts) => compile.sync(str, { ...options, ...opts });
    context.render = (str, locals, opts) => {
      return context.compile(str, opts)({ ...context, ...locals });
    };

    context.include = (filename, locals) => {
      const filepath = path.resolve(options.cwd || process.cwd(), filename);
      return context.render(fs.readFileSync(filepath, 'utf8'), locals);
    };

    const keys = Object.keys(context);
    const values = Object.values(context);

    try {
      const output = wrap(input);
      // eslint-disable-next-line no-new-func
      const fn = Function(keys, `'use strict';return ${output}`);
      const result = fn.call(context, ...values);
      return options.boolean ? Boolean(result) : result;
    } catch (err) {
      if (options.strictErrors !== false || !err.message.includes('is not defined')) {
        err.input = input;
        err.context = context;
        throw err;
      }
      return options.boolean ? false : void 0;
    }
  };
};

module.exports = compile;
