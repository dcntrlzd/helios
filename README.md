* compile with https://github.com/ethereum/solc-js (solc)
* run with https://github.com/ethereumjs/ethereumjs-testrpc

# FW structure
* session/test-runner
  * Runs tests in jest or any test runner
* client
  * Provides a prettier web3 interface with promises
  * Also used for deploying contracts etc.
* loader
  * Webpack loader for reading sol files
* state/migrations
  * Runs the migrations code
  * Provides an interface for storing the state as configs
  * Such as the address of your migration/manager script

# TODO:
* webpack loader
* switch to flow from typescript
* linter
* use step handler of the vm to debug the contract
  * Reading states etc. inside the steps
* Migration logic
  * Every migration should decide if it has to run or not
  * So no migration contract provided by the framework but every dev has to come up with their own
* App wide state storage 
  * might be a json


# Stuff to improve
* cache the engine instance between runtimes to save some time (depends on the test runner configuration)