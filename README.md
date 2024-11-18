# node-neval

[![CI](https://github.com/shahradelahi/node-neval/actions/workflows/ci.yml/badge.svg)](https://github.com/shahradelahi/node-neval/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/neval.svg)](https://www.npmjs.com/package/neval)
[![MIT License](https://img.shields.io/badge/License-MIT-blue.svg?style=flat)](/LICENSE)
[![Install Size](https://packagephobia.com/badge?p=neval)](https://packagephobia.com/result?p=neval)

_neval_ is a zero-dependency, lightweight utility for securely evaluating code in a sandboxed environment in Node.js.

---

- [Installation](#-installation)
- [Usage](#-usage)
- [Documentation](#-documentation)
- [Contributing](#-contributing)
- [License](#license)

## 📦 Installation

```bash
npm install neval
```

## 📖 Usage

```typescript
import { neval, nevalFile } from 'neval';

const result = neval('1 + 1');
console.log(result); // 2

const result2 = await nevalFile('./file.js');
console.log(result2); // Whaterever file.js returns

const result3 = await neval(
  `
    async function main() {
        await sleep(1e3); // The "sleep" function will be injected through context
        return 1 + 1;
    }
    main();
`,
  {
    context: {
      sleep: async (ms) => {
        return new Promise((resolve) => setTimeout(resolve, ms));
      },
    },
  }
);
console.log(result3); // Result after 1 second is 2
```

Importing `neval/register` will register the `neval` function on the global object and overrides the `eval` function.

```typescript
import 'neval/register';

console.log(eval('1 + 1')); // 2
```

Why is it important to register it globally? The `neval` is sandboxed and much more secure than just using the `eval` function. Read more about [eval](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval).

## 📚 Documentation

For all configuration options, please see [the API docs](https://www.jsdocs.io/package/neval).

##### API

```typescript
function neval(code: any, options?: EvalOptions): any;
function nevalFile(path: string, options?: EvalOptions): Promise<any>;
function register(): void;
```

## 🤝 Contributing

Want to contribute? Awesome! To show your support is to star the project, or to raise issues on [GitHub](https://github.com/shahradelahi/node-neval)

Thanks again for your support, it is much appreciated! 🙏

## Relevant

- [isolated-vm](https://github.com/laverdet/isolated-vm)

## License

[MIT](/LICENSE) © [Shahrad Elahi](https://github.com/shahradelahi)
