import { BigNumber } from 'bignumber.js';
import * as Web3 from 'web3';
import { ICompiledContract } from './compiler';
export declare type BlockID = string | number;
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
    METHOD_PATTERN: RegExp;
    DEPLOYMENT_GAS: number;
    DEPLOYMENT_GAS_PRICE: number;
    getSyncing: () => Promise<boolean | ISyncObject>;
    isSyncing: () => Promise<boolean | ISyncObject>;
    getCoinbase: () => Promise<string>;
    getHashrate: () => Promise<number>;
    getGasPrice: () => Promise<BigNumber>;
    getAccounts: () => Promise<string[]>;
    getMining: () => Promise<boolean>;
    getBlockNumber: () => Promise<number>;
    getBalance: (address: string) => Promise<BigNumber>;
    getStorageAt: (address: string, position: number) => Promise<string>;
    getCode: (address: string) => Promise<string>;
    getBlock: (hashOrNumber: BlockID, returnTransactionObjects?: boolean) => Promise<IBlock>;
    getBlockTransactionCount: (hashOrNumber: BlockID) => Promise<number>;
    getUncle: (hashOrNumber: BlockID, returnTransactionObjects?: boolean) => Promise<IBlock>;
    getBlockUncleCount: (hashOrNumber: BlockID) => Promise<number>;
    getTransaction: (hash: string) => Promise<ITransaction>;
    getTransactionFromBlock: (hashOrNumber: BlockID, indexNumber: number) => Promise<ITransaction>;
    getTransactionReceipt: (hash: string) => Promise<ITransactionReceipt>;
    getTransactionCount: (address: string) => Promise<number>;
    sendTransaction: (object) => Promise<string>;
    sendRawTransaction: (object) => Promise<string>;
    sign: (object) => Promise<string>;
    call: (object) => Promise<string>;
    estimateGas: (object) => Promise<number>;
    web3: Web3;
    constructor(provider: any);
    isConnected(): string;
    getNetwork(): Promise<string>;
    getCurrentAccount(): string;
    setCurrentAccount(account: string): void;
    defineContract<C>(compiledContract: ICompiledContract, address: string): Promise<Web3.Contract<C>>;
    deployContract<C>(compiledContract: ICompiledContract, options?: IDeployOptions): Promise<Web3.Contract<C>>;
    private promisifyContract<C>(baseContract);
    private promisify(method, context);
}
