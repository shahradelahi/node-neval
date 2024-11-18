import { promises } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

import { SAFE_GLOBAL } from '@/constants';
import { defineGlobally } from '@/utils/global';

import { EvalOptions } from './typings';

export function neval(code: any, options: EvalOptions = {}) {
  if (!code) return;
  const { timeout = 1e4, context = {}, bypassGlobal = [], strictGlobal = [] } = options;
  const resultKey = 'SAFE_EVAL_' + Math.floor(Math.random() * 1000000);
  context[resultKey] = undefined;

  bypassGlobal.push(...SAFE_GLOBAL);
  bypassGlobal.push(...Object.keys(context));

  const BypassKey = `__BYPASS_GLOBAL_${Math.floor(Math.random() * 1000000)}`;

  code = code.replace(/`/g, '\\`').replace(/\$/g, '\\$');
  code = [
    String(
      `${BypassKey} = Object.freeze(new Set([${bypassGlobal
        .filter((v) => !(strictGlobal as string[]).includes(v))
        .map((v) => `"${v}"`)
        .join(', ')}]));`
    ),
    String(`\
function throwNotAllowed(property) {
  const error = new Error(
    'Cannot access properties of "' + String(property) + '" in sandbox environment'
  );
  error.name = 'EvalError';
  Error.captureStackTrace(error, throwNotAllowed);
  throw error;
}

Object.getOwnPropertyNames(this ?? {})
  .concat(['constructor'])
  .forEach((key) => {
    if (key === '${BypassKey}') {
      return;
    }
    if (key === 'global' || key === 'globalThis') {
      delete this[key];
      this[key] = new Proxy(
        {},
        {
          get: (_, property) => {
            return this[property];
          },
        }
      );
      return;
    }
    if (key && key in this && typeof this[key] === 'object' && !${BypassKey}.has(key)) {
      this[key] = new Proxy(this[key], {
        get: (_, property) => {
          throwNotAllowed(key);
        },
        set: (_, property) => {
          throwNotAllowed(key);
        },
      });
    }
  });
['global', 'globalThis'].forEach((key) => {
  if (key === 'global' || key === 'globalThis') {
    delete this[key];
    this[key] = new Proxy(
      {},
      {
        get: (_, property) => {
          return this[property];
        },
      }
    );
  }
});`),
    String(`${resultKey} = undefined;`),
    String(`(function(){"use strict"; ${resultKey} = eval?.(String(\`${code}\`)) })();`),
    String(`this.${resultKey} = ${resultKey};`),
  ].join(';\n');

  code = runInNewContext(code, context, {
    timeout,
    breakOnSigint: true,
  });

  return context[resultKey];
}

export async function nevalFile(path: string, options: EvalOptions = {}) {
  const content = await promises.readFile(resolve(path), 'utf-8');
  if (!content || content.length === 0) return;
  return neval(content, options);
}

export function register() {
  defineGlobally('eval', neval);
}
