import { BigNumber } from 'bignumber.js';
import Web3 = require('web3');
import { ICompiledContract } from './compiler';
import { IWeb3Contract, Web3AbiDefinition } from './web3-declarations';

export type BlockID = string | number;

export interface ISyncObject {
  startingBlock: number;
  currentBlock: number;
  highestBlock: number;
}

export interface ITransaction {
  hash: string;
  nonce: number;
  blockHash: string;
  blockNumber: number;
  transactionIndex: number;
  from: string;
  to: string;
  value: BigNumber;
  gasPrice: BigNumber;
  gas: number;
  input: string;
}

export interface ITransactionReceipt {
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
  from: string;
  to: string;
  cumulativeGasUsed: number;
  gasUsed: number;
  contractAddress: string;
  logs: any[];
}

export interface IBlock {
  number: number;
  hash: string;
  parentHash: string;
  nonce: string;
  sha3Uncles: string;
  logsBloom: string;
  transactionsRoot: string;
  stateRoot: string;
  miner: string;
  difficulty: BigNumber;
  totalDifficulty: BigNumber;
  extraData: string;
  size: number;
  gasLimit: number;
  gasUsed: number;
  timestamp: number;
  transactions: ITransaction[];
  uncles: IBlock[];
}

export interface IDeployOptions {
  contractName?: string;
  from?: string;
  gas?: number;
  gasPrice?: number;
  args?: any[];
}

export default class Client {
  public METHOD_PATTERN = /^(get|is|send|sign|call)([A-Z].*)?$/;
  public DEPLOYMENT_GAS = 3141592;
  public DEPLOYMENT_GAS_PRICE = 100000000000;

  // API for typescript:
  // wrapped web3.eth methods matching METHOD_PATTERN
  public getSyncing: () => Promise<boolean | ISyncObject>;
  public isSyncing: () => Promise<boolean | ISyncObject>;
  public getCoinbase: () => Promise<string>;
  public getHashrate: () => Promise<number>;
  public getGasPrice: () => Promise<BigNumber>;
  public getAccounts: () => Promise<string[]>;
  public getMining: () => Promise<boolean>;
  public getBlockNumber: () => Promise<number>;
  public getBalance: (address: string) => Promise<BigNumber>;
  public getStorageAt: (address: string, position: number) => Promise<string>;
  public getCode: (address: string) => Promise<string>;
  public getBlock: (hashOrNumber: BlockID, returnTransactionObjects?: boolean) => Promise<IBlock>;
  public getBlockTransactionCount: (hashOrNumber: BlockID) => Promise<number>;
  public getUncle: (hashOrNumber: BlockID, returnTransactionObjects?: boolean) => Promise<IBlock>;
  public getBlockUncleCount: (hashOrNumber: BlockID) => Promise<number>;
  public getTransaction: (hash: string) => Promise<ITransaction>;
  public getTransactionFromBlock: (hashOrNumber: BlockID, indexNumber: number) => Promise<ITransaction>;
  public getTransactionReceipt: (hash: string) => Promise<ITransactionReceipt>;
  public getTransactionCount: (address: string) => Promise<number>;
  public sendTransaction: (object: any) => Promise<string>;
  public sendRawTransaction: (object: any) => Promise<string>;
  public sign: (object: any) => Promise<string>;
  public call: (object: any) => Promise<string>;
  public estimateGas: (object: any) => Promise<number>;

  public web3: any;

  constructor(provider: any) {
    this.web3 = new Web3(provider);

    Object.keys(this.web3.eth).filter((methodName) => {
      return this.METHOD_PATTERN.test(methodName);
    }).forEach((methodName) => {
      const method = this.web3.eth[methodName];
      if (!method) {
        throw new Error(`${methodName} method not found in the supplied web3 client.`);
      }

      this[methodName] = this.promisify(method, this.web3.eth);
    });
  }

  public isConnected(): string {
    return this.web3.isConnected();
  }

  public getNetwork(): Promise<string> {
    return this.promisify(this.web3.version.getNetwork, this.web3.version)();
  }

  public getCurrentAccount(): string {
    return this.web3.eth.defaultAccount;
  }

  public setCurrentAccount(account: string): void {
    this.web3.eth.defaultAccount = account;
  }

  public defineContract<C>(
    compiledContract: ICompiledContract,
    address: string,
  ): Promise<IWeb3Contract<C>> {
    return new Promise<IWeb3Contract<C>>((resolve, reject) => {
      const { abi, data } = compiledContract;
      const contract = this.web3.eth.contract(abi);
      resolve(this.promisifyContract(contract.at(address)));
    });
  }

  public deployContract<C>(
    compiledContract: ICompiledContract,
    options: IDeployOptions = {},
  ): Promise<IWeb3Contract<C>> {
    const {
      from,
      args = [],
      gas = this.DEPLOYMENT_GAS,
      gasPrice = this.DEPLOYMENT_GAS_PRICE,
    } = options;

    return new Promise<IWeb3Contract<C>>((resolve, reject) => {
      const { abi, data } = compiledContract;
      const contract = this.web3.eth.contract(abi);
      const deployOptions = { data, gas, gasPrice };

      if (from) {
        Object.assign(deployOptions, { from });
      }

      const deployArguments = [
        ...args,
        deployOptions,
        (err: any, res: IWeb3Contract<C>): void => {
          if (err) {
            reject(err);
            return;
          } else if (res.address) {
            resolve(this.promisifyContract(res));
            return ;
          }
        },
      ];

      contract.new(...deployArguments);
    });
  }

  private promisifyContract<C>(baseContract: IWeb3Contract<C>): IWeb3Contract<C> {
    const contract = { ...baseContract };

    contract.abi.forEach((abiItem: Web3AbiDefinition) => {
      const { name, type } = abiItem;
      const method = contract[name];
      if (!method || type !== 'function' ) {
        return;
      }

      contract[name] = this.promisify(method, contract);
    });

    return contract;
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
      };

      boundMethod(...baseArgs.concat([callback]));
    });
  }
}
