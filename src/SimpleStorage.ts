import loader from '../engine/loader';
import compiler from '../engine/compiler';
import session from '../engine/session';

// loader('0.4.11').then((solc) => {
//   return compiler('SimpleStorage.sol', solc);
// }).then(({ SimpleStorage }) => {
//   console.log(SimpleStorage);
// }).catch((errors) => console.error(errors));

session();

// NOTES:
// * VM API:
//   * Wallet = { privateKey: string, address: WalletAddress }
//   * WalletDetails = { balance: number, txHistory: Tx[] }
//   * vm.loadContracts(Owner, { [ContractName]: CompiledContractStruct }): { [ContractName]: ContractAddress }
//   * vm.createWallet(Owner, initialBalance): Wallet
//   * vm.inspectWallet(WalletAddress): WalletDetails
//   * vm.executeContract(Owner, ContractAddress, Arguments): ?

// TODO:
// * Create a vm instance
// * Setup initial state
// * Create contracts in the vm instance
// * execute the contracts

// NICETOHAVE:
// * cache the engine instance between runtimes to save some time