import { BigNumber } from 'bignumber.js';
import { Contract } from 'web3/types.d';

import Web3Type from 'web3';
import Web3 = require('web3');
import { Manager as RequestManager } from 'web3-core-requestmanager';

import Compiler, { ICompiledContract, ICompilerOptions } from './compiler';

export interface ISessionOptions {
  statePath?: string;
  compiler?: ICompilerOptions;
}

export interface IDeployOptions {
  contractName?: string;
  from?: string;
  gas?: number;
  gasPrice?: number;
  args?: any[];
}

interface IRequestParams {
  method: string;
  params?: any[];
}

interface IRequestManager {
  send: (data: IRequestParams, callback: (error: Error, result: any) => any) => void;
}

export default class Session {
  public static create(provider: any, options: ISessionOptions): Promise<Session> {
    return new Promise((resolve) => new Session(provider, options, resolve));
  }

  public DEPLOYMENT_GAS = 3141592;
  public DEPLOYMENT_GAS_PRICE = 100000000000;

  public promise: Promise<any>;
  public web3: Web3Type;
  public compile: (path: string) => Promise<any>;

  private provider: any;
  private compiler: Compiler;
  private requestManager: IRequestManager;

  public constructor(provider: any, options: ISessionOptions = {}, callback?: (Session) => void) {
    if (provider) {
      this.provider = provider;
    } else {
      throw new Error('No provider supplied for the session');
    }

    this.compiler = new Compiler(options.compiler);
    this.compile = this.compiler.compileFile.bind(this.compiler);
    this.web3 = (new (Web3 as any)(this.provider)) as Web3Type;

    this.promise = this.web3.eth.getAccounts()
      .then(([account]) => {
        this.setCurrentAccount(account);
        return this.web3.eth.net.getId();
      })
      .then(() => {
         if (callback) {
           callback(this);
         }
      });
  }

  public getCurrentAccount(): string {
    return this.web3.eth.defaultAccount;
  }

  public setCurrentAccount(account: string): void {
    this.web3.eth.defaultAccount = account;
  }

  public async defineContract(
    { abi }: ICompiledContract,
    address: string,
  ): Promise<Contract> {
    return new this.web3.eth.Contract(abi, address, {
      from: this.getCurrentAccount(),
    });
  }

  public async deployContract(
    { abi, data }: ICompiledContract,
    options: IDeployOptions = {},
  ): Promise<Contract> {
    const optionsWithDefaults = {
      args: [],
      from: this.getCurrentAccount(),
      gas: this.DEPLOYMENT_GAS,
      gasPrice: this.DEPLOYMENT_GAS_PRICE,
      ...options,
    };

    const { args } = optionsWithDefaults;

    const contract = await (new this.web3.eth.Contract(abi))
      .deploy({ data, arguments: args })
      .send(optionsWithDefaults);

    (contract as any).setProvider(this.web3.currentProvider);

    return contract;
  }

  public async snapshot(): Promise<any> {
    const snapshotId = await this.send({ method: 'evm_snapshot' });
    return this.web3.utils.toDecimal(snapshotId);
  }

  public async  revert(snapshotId: string): Promise<any> {
    const params = [this.web3.utils.toHex(snapshotId)];
    return this.send({ method: 'evm_revert', params });
  }

  private getRequestManager(): IRequestManager {
    if (this.requestManager) { return this.requestManager; }
    this.requestManager = new RequestManager(this.provider);
    return this.requestManager;
  }

  private send(data: IRequestParams): Promise<any> {
    return new Promise((resolve, reject) => {
      this.getRequestManager().send(data, (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      });
    });
  }

  // public attachDebugger(callback): void {
  //   if (!this.provider.manager.state.blockchain.vm) {
  //     throw new Error('VM not ready yet');
  //   }
  //   this.provider.manager.state.blockchain.vm.on('step', callback);
  // }
}
