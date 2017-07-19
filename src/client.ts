import * as Web3 from 'web3';
import { BigNumber } from 'bignumber.js';

type BlockID = string | number;

type SyncObject = {
  startingBlock: number,
  currentBlock: number,
  highestBlock: number,
};

type Transaction = {
  hash: string,
  nonce: number,
  blockHash: string,
  blockNumber: number,
  transactionIndex: number,
  from: string,
  to: string,
  value: BigNumber,
  gasPrice: BigNumber,
  gas: number,
  input: string,
};

type TransactionReceipt = {
  blockHash: string,
  blockNumber: number,
  transactionHash: string,
  transactionIndex: number,
  from: string,
  to: string,
  cumulativeGasUsed: number,
  gasUsed: number,
  contractAddress: string,
  logs: any[],
};

type Block = {
  number: number,
  hash: string,
  parentHash: string,
  nonce: string,
  sha3Uncles: string,
  logsBloom: string,
  transactionsRoot: string,
  stateRoot: string,
  miner: string,
  difficulty: BigNumber,
  totalDifficulty: BigNumber,
  extraData: string,
  size: number,
  gasLimit: number,
  gasUsed: number,
  timestamp: number,
  transactions: Transaction[],
  uncles: Block[],
};

export default class Client {
  private web3: Web3;
  public METHOD_PATTERN = /^(get|is|send|sign|call)([A-Z].*)?$/;

  // API for typescript:
  // wrapped web3.eth methods matching METHOD_PATTERN
  public getSyncing: () => Promise<boolean | SyncObject>;
  public isSyncing: () => Promise<boolean | SyncObject>;
  public getCoinbase: () => Promise<string>;
  public getHashrate: () => Promise<number>;
  public getGasPrice: () => Promise<BigNumber>;
  public getAccounts: () => Promise<string[]>;
  public getMining: () => Promise<boolean>;
  public getBlockNumber: () => Promise<number>;
  public getBalance: (address: string) => Promise<BigNumber>;
  public getStorageAt: (address: string, position: number) => Promise<string>;
  public getCode: (address: string) => Promise<string>;
  public getBlock: (hashOrNumber: BlockID, returnTransactionObjects?: boolean) => Promise<Block>;
  public getBlockTransactionCount: (hashOrNumber: BlockID) => Promise<number>;
  public getUncle: (hashOrNumber: BlockID, returnTransactionObjects?: boolean) => Promise<Block>;
  public getBlockUncleCount: (hashOrNumber: BlockID) => Promise<number>;
  public getTransaction: (hash: string) => Promise<Transaction>;
  public getTransactionFromBlock: (hashOrNumber: BlockID, indexNumber: number) => Promise<Transaction>;
  public getTransactionReceipt: (hash: string) => Promise<TransactionReceipt>;
  public getTransactionCount: (address: string) => Promise<number>;
  public sendTransaction: (object) => Promise<string>;
  public sendRawTransaction: (object) => Promise<string>;
  public sign: (object) => Promise<string>;
  public call: (object) => Promise<string>;
  public estimateGas: (object) => Promise<number>;

  constructor(web3: Web3) {
    this.web3 = web3;

    Object.keys(this.web3.eth).filter((methodName) => {
      return this.METHOD_PATTERN.test(methodName);
    }).forEach((methodName) => {
      const method = this.web3.eth[methodName];
      if (!method) throw new Error(`${methodName} method not found in the supplied web3 client.`);

      this[methodName] = this.promisify(method, this.web3.eth);
    });
  }

  private promisify(method: (...methodArgs: any[]) => any, context: any): (...args) => Promise<any> {
    const boundMethod = method.bind(context);
    return (...baseArgs) => new Promise((resolve, reject) => {
      const callback = (error, result) => {
         if (error) {
           reject(error);
           return;
         }
         resolve(result);
      }

      boundMethod(...baseArgs.concat([callback]));
    });
  }
}

