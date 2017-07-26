# Helios

Loosely opinionated solidity contract development library.
* compiles with https://github.com/ethereum/solc-js
* runs with https://github.com/ethereumjs/ethereumjs-testrpc

## Library Structure
* compiler (done)
* session/runner (done)
  * Runs tests in jest or any test runner
* client (wip)
  * Provides a prettier web3 interface with promises
  * Also used for deploying contracts etc.
* loader (done)
  * Webpack loader for reading sol files
* state/migrations (not there yet)
  * Runs the migrations code
  * Provides an interface for storing the state as configs
  * Such as the address of your migration/manager script

## TODO
* tslint
* use step handler of the vm to debug the contract
  * Reading states etc. inside the steps
* Migration logic
  * Every migration should decide if it has to run or not
  * So no migration contract provided by the framework (unlike truffle) but every dev has to come up with their own
* App wide state/config storage (for storing contract addresses etc.)
  * might be a json

## Nice to Have
* cache the engine instance between runtimes to save some time (depends on the test runner configuration)
* more tests
