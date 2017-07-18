let keys: keyof Map<number>;

type BlockID = string | number;

// web3.eth methods matching /^(get|is|send|sign|call)([A-Z].*)?$/
export default class Client {
  getSyncing() {

  }

  isSyncing() {

  }

  getCoinbase() {

  }

  getHashrate() {

  }

  getGasPrice() {

  }

  getAccounts() {

  }

  getMining() {

  }

  getBlockNumber() {

  }

  getBalance(address: string) {

  }

  getStorageAt(address: string, position: number) {

  }

  getCode(address: string) {

  }

  getBlock(hashOrNumber: BlockID, returnTransactionObjects?: boolean) {

  }

  getBlockTransactionCount(hashOrNumber: BlockID) {

  }

  getUncle(hashOrNumber: BlockID, returnTransactionObjects?: boolean) {

  }

  getBlockUncleCount(hashOrNumber: BlockID) {

  }

  getTransaction(hash: string) {

  }

  getTransactionFromBlock(hashOrNumber: BlockID, indexNumber: number) {

  }

  getTransactionReceipt(hash: string) {

  }

  getTransactionCount(address: string) {

  }

  sendTransaction(object) {

  }

  sendRawTransaction(object) {

  }

  sign(object) {

  }

  call(object) {

  }

  estimateGas(object) {

  }
}

