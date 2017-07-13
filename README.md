* compile with https://github.com/ethereum/solc-js (solc)
* run with https://github.com/ethereumjs/ethereumjs-vm
* Jest fails to run solc properly so nodemon as the runner
* check out https://github.com/ethereumjs/ethereumjs-vm/blob/master/examples/run-blockchain/index.js for running stuff on ethereumvm
* use step handler of the vm to debug the contract

# eth-vm-js notes

* Create blokchainDB to store the blockchain
* Trie structure is used for storing the global state
* VM is supplied with the state (trie inst.) and blockchain
* genesis block can be generated but the generate function in readme is not so clear and examples rely on testdata.json
* setupPreConditions sets the initial state in the storageTrie
* Trie has to be examined
* test-data contents has to be examined// NOTES:

# VM API
* Wallet = { privateKey: string, address: WalletAddress }
* WalletDetails = { balance: number, txHistory: Tx[] }
* vm.loadContracts(Owner, { [ContractName]: CompiledContractStruct }): { [ContractName]: ContractAddress }
* vm.createWallet(Owner, initialBalance): Wallet
* vm.inspectWallet(WalletAddress): WalletDetails
* vm.executeContract(Owner, ContractAddress, Arguments): ?

# TODO:
* Create a vm instance
* Setup initial state
* Create contracts in the vm instance
* execute the contracts

# NICETOHAVE:
* cache the engine instance between runtimes to save some time