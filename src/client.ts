import { BigNumber } from 'bignumber.js';
import * as Web3 from 'web3';
import { ICompiledContract } from './compiler';


export interface IDeployOptions {
  contractName?: string;
  from?: string;
  gas?: number;
  gasPrice?: number;
  args?: any[];
}

export default class Client {
  public static create(provider: any): Promise<Client> {
    return new Promise((resolve) => new Client(provider, resolve));
  }

  public DEPLOYMENT_GAS = 3141592;
  public DEPLOYMENT_GAS_PRICE = 100000000000;

  public web3: Web3;

  constructor(provider: any, callback?: (client: Client) => void) {
    this.web3 = new Web3(provider);

    this.web3.eth.getAccounts().then(([account]) => {
      this.setCurrentAccount(account);
      if (callback) {
        callback(this);
      }
    });
  }

  public isConnected(): string {
    return this.web3.isConnected();
  }

  public getNetwork(): Promise<string> {
    return this.web3.eth.net.getId();
  }

  public getCurrentAccount(): string {
    return this.web3.eth.defaultAccount;
  }

  public setCurrentAccount(account: string): void {
    this.web3.eth.defaultAccount = account;
  }

  public defineContract(
    { abi }: ICompiledContract,
    address: string,
  ): Promise<Web3.Contract> {
    return new this.web3.eth.Contract(abi, address, {
      from: this.getCurrentAccount(),
    });
  }

  public deployContract(
    { abi, data }: ICompiledContract,
    options: IDeployOptions = {},
  ): Promise<Web3.Contract> {
    const optionsWithDefaults = {
      args: [],
      from: this.getCurrentAccount(),
      gas: this.DEPLOYMENT_GAS,
      gasPrice: this.DEPLOYMENT_GAS_PRICE,
      ...options,
    };

    const { args } = optionsWithDefaults;

    return (new this.web3.eth.Contract(abi))
      .deploy({ data, arguments: args })
      .send(optionsWithDefaults);
  }
}
