# Helios

Loosely opinionated solidity contract development library.
* compiles with https://github.com/ethereum/solc-js
* runs with https://github.com/ethereumjs/ethereumjs-testrpc

## Library Structure
* compiler (done)
  * Compiles sol files with solc
  * Allows imports
* session/runner (done)
  * Runs tests in jest or any test runner
* client (wip)
  * Provides a prettier web3 interface with promises
  * Also used for deploying contracts etc.
  * To be replaced with web3 when 1.0.0 with promises lands
  * Deployment functions might become a new component called deployer
* loader (done)
  * Webpack loader for reading sol files
* state/migrations (done)
  * Runs the migrations code
  * Provides an interface for storing the state as configs
  * Such as the address of your migration/manager script
  * Every migration should decide if it has to run or not
  * So no migration contract provided by the framework (unlike truffle) but every dev has to come up with their own

## How to use
* `npm install https://github.com/dcntrlzd/helios`
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
  import eth from '@dcntrlzd/helios/runner';

  const { SimpleStorage } = await eth.compile('../contracts/SimpleStorage.sol');
```

## TODO
* detailed documentation
* complete tests & coverage report
* Move includeData setting to the ICompilerOptions and get rid of ICompileOptions

## Nice to Have
* prettier & json5 for state (de)serialization to make it version control friendly.
* cache the engine instance between runtimes to save some time (depends on the test runner configuration).
* use step handler of the vm to debug the contract.
  * Reading states etc. inside the steps.
