import type { Context } from 'node:vm';

import type { SAFE_GLOBAL } from './constants';

export interface EvalOptions {
  /**
   * This parameter will set the maximum execution time for the code in milliseconds.
   */
  timeout?: number;
  /**
   * If set to false any attempt to compile a WebAssembly module will throw a WebAssembly.CompileError. Default: `false`.
   */
  allowWasm?: boolean;
  /**
   * Inject your own context globals into the sandbox
   *
   * @example
   * ```typescript
   *   function plus(a: number, b: number) {
   *     return a + b;
   *   }
   *
   *   const result = neval('plus(1, 2)', { context: { plus } });
   *   console.log(result); // 3
   * ```
   */
  context?: Context;
  /**
   * Add the key of global variable to bypass it in the sandbox
   *
   * @example
   * bypassGlobal: ['process', 'console']
   */
  bypassGlobal?: string[];
  /**
   * This parameter will make the predefined safe globals inaccessible in the sandbox
   *
   * @example
   * strictGlobal: ['Math']
   */
  strictGlobal?: SafeGlobal[];
}

export type SafeGlobal = (typeof SAFE_GLOBAL)[number];
