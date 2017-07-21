import * as Web3 from 'web3';
import { BigNumber } from 'bignumber.js';
import { CompiledContract } from './compiler';

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

type DeployOptions = {
  contractName?: string,
  from?: string,
  gas?: number,
  gasPrice?: number,
  args?: any[],
};

export default class Client {
  private web3: Web3;

  public METHOD_PATTERN = /^(get|is|send|sign|call)([A-Z].*)?$/;
  public DEPLOYMENT_GAS = 3141592;
  public DEPLOYMENT_GAS_PRICE = 100000000000;

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

  public getCurrentAccount(): string {
    return this.web3.eth.defaultAccount;
  }

  public setCurrentAccount(account: string): void {
    this.web3.eth.defaultAccount = account;
  }

  public defineContract<C>(compiledContract: CompiledContract, address: string): Promise<Web3.Contract<C>> {
    return new Promise<Web3.Contract<C>>((resolve, reject) => {
      const { abi, data } = compiledContract;
      const contract = this.web3.eth.contract<any>(abi);
      resolve(this.promisifyContract(contract.at(address)));
    });
  }

  public deployContract<C>(compiledContract: CompiledContract, options: DeployOptions = {}): Promise<Web3.Contract<C>> {
    const {
      from,
      args = [],
      gas = this.DEPLOYMENT_GAS,
      gasPrice = this.DEPLOYMENT_GAS_PRICE
    } = options;

    return new Promise<Web3.Contract<C>>((resolve, reject) => {
      const { abi, data } = compiledContract;
      const contract = this.web3.eth.contract<any>(abi);
      const deployOptions = { data, gas, gasPrice };

      if (from) Object.assign(deployOptions, { from });

      const deployArguments = [
        ...args,
        deployOptions,
        (err: any, res: Web3.Contract<C>) => {
          if (err) return reject(err);
          if (res.address) return resolve(this.promisifyContract(res));
        }
      ];

      contract.new(...deployArguments);
    });
  }

  private promisifyContract<C>(baseContract: Web3.Contract<C>): Web3.Contract<C> {
    const contract = { ...baseContract };

    contract.abi.forEach((abiItem: Web3.AbiDefinition) => {
      const { name } = abiItem;
      const method = contract[name];
      if (!method) return;

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
      }

      boundMethod(...baseArgs.concat([callback]));
    });
  }
}

