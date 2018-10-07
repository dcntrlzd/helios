# Helios

Solidity compiler tools for dapp development
* A wrapper around the solc compiler
* Webpack loader using the compiler for importing solidity files
* SOON jest transformer for importing solidity files

## TODO
* Convert to monorepo with a core package, webpack loader package and a jest transformer package

## How to use
* `npm install @dcntrlzd/helios`
* Configure webpack to use helios/loader for sol files
```js
{
  test: /\.sol$/,
  use: { loader: '@dcntrlzd/helios/loader' },
}
```
* To import your solidity files from your dapp just import them with es6 import syntax
```js
  import { SimpleStorage } from '../contracts/SimpleStorage.sol';
```
* To import your solidity files from your tests use the async compile method of `@dcntrlzd/helios/runner`
```js
  import Compiler from '@dcntrlzd/helios/compiler';

  const compiler = new Compiler();
  const { SimpleStorage } = await compiler.compileFile('../contracts/SimpleStorage.sol');
```