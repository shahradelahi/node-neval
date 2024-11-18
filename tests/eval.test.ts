import { expect } from 'chai';

import { neval, nevalFile } from '@/index';

describe('Eval', () => {
  async function sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function plus(a: number, b: number) {
    // ❌ CAUTION: Since the "plus" is injected into the context, it includes the "console" and "process" objects,
    // making them available in the eval context. Be cautious about what you're injecting.
    // console.log(Object.keys(process.env));
    await sleep(1e3); // This works too!
    return a + b;
  }

  it('should eval code', () => {
    const result = neval('1 + 1', { strictGlobal: [] });
    expect(result).to.eq(2);
  });

  it('should inject context', async () => {
    expect(() => neval('plus(1, 2)')).to.throw('plus is not defined');
    const result = await neval('plus(1, 2)', { context: { plus } });
    expect(result).to.eq(3);
  });

  it('should read sample from file and eval', async () => {
    const result = await nevalFile('tests/fixtures/eval-sample.js', { context: { sleep } });
    expect(result).to.eq(3);
  });

  it('should not access unsafe context', () => {
    const fn1 = () => neval('process.env', { context: { sleep } });
    expect(fn1).to.throw('process is not defined');

    const fn2 = () => neval(`fetch('https://example.com')`);
    expect(fn2).to.throw('fetch is not defined');

    const fn3 = () => neval(`WebAssembly.compileStreaming({})`);
    expect(fn3).to.throw('Cannot access properties of "WebAssembly" in sandbox environment');

    const fn4 = () => neval(`console.log(1 + 1)`);
    expect(fn4).to.throw('Cannot access properties of "console" in sandbox environment');
  });

  it('should fetch using injected context', async () => {
    const result = await neval(
      `\
    fetch('https://cloudflare.com/cdn-cgi/trace/', { method: 'HEAD' })
       .then((resp) => resp.statusText);
    `,
      { context: { fetch } }
    );
    expect(result).to.eq('OK');
  });

  it('should remove "Math" from safe global and face error', () => {
    const result = neval('Math.PI');
    expect(result).to.eq(3.141592653589793);
    expect(() => neval('Math.PI', { strictGlobal: ['Math'] })).to.throw(
      'Cannot access properties of "Math" in sandbox environment'
    );
  });

  it('should reach the timeout', async () => {
    expect(() =>
      neval('sleep(100)', {
        timeout: 1,
        context: { sleep: async () => await sleep(1e3) },
      })
    ).to.throw('Script execution timed out after 1ms');
  });

  it('should run async function', async () => {
    const result = await neval(
      `\
    async function sleep(ms){ return new Promise((resolve) => setTimeout(resolve, ms)); }
    sleep(10);
    Array.from(String('9'+6)).reverse().join('');
    `,
      {
        context: { setTimeout },
      }
    );
    expect(result).to.eq('69');
  });

  it('should run async function 2', async () => {
    const fn = () => neval('async function main() { return 1 + 1; }; main();');
    const result = await fn();
    expect(result).to.eq(2);
  });

  it('should override "console" context', async () => {
    const fn = () =>
      neval('async function main() { return console.log(1 + 1); }; main();', {
        context: {
          console: {
            log: (v: number) => v,
          },
        },
      });
    const result = await fn();
    expect(result).to.eq(2);
  });
});

describe('Security', () => {
  const context = {
    setTimeout,
    setInterval,
    fetch,
    console: new Proxy(
      {},
      {
        get: () => 'no console',
      }
    ),
  };

  it('CVE-2023-37903', async () => {
    expect(neval('typeof process')).to.eq('undefined');
    expect(neval('typeof require')).to.eq('undefined');

    const asser = expect(
      await nevalFile('tests/fixtures/CVE-2023-37903.js', { context })
        .then((v) => v)
        .catch((e) => new Error(e))
    );
    asser.be.instanceof(Error);
    asser.have.property(
      'message',
      'EvalError: Cannot access properties of "WebAssembly" in sandbox environment'
    );
  });

  it('CVE-2023-32313', async () => {
    const asser = expect(
      await nevalFile('tests/fixtures/CVE-2023-32313.js', { context })
        .then((v) => v)
        .catch((e) => new Error(e))
    );

    asser.be.instanceof(Error);
    asser.have.property(
      'message',
      "TypeError: Cannot read properties of undefined (reading 'colors')"
    );
  });
});
