
import * as Web3 from 'web3';

import Client from './client';
import Compiler, { ICompilerOptions } from './compiler';
import State, { IStateOptions } from './state';

interface ISessionOptions {
  statePath?: string;
  compiler?: ICompilerOptions;
  state?: IStateOptions;
}

export default class Session {
  public static create(provider: any, options: ISessionOptions): Promise<Session> {
    return new Promise((resolve) => new Session(provider, options, resolve));
  }

  public client: Client;
  public promise: Promise<any>;
  public compile: (path: string) => Promise<any>;

  private provider: any;
  private state: State;
  private compiler: Compiler;
  private networkId: string;

  public constructor(provider: any, options: ISessionOptions = {}, callback?: (Session) => void) {
    if (provider) {
      this.provider = provider;
    } else if (process.env.HELIOS_NODE_URL) {
      this.provider = new Web3.providers.HttpProvider(process.env.HELIOS_NODE_URL);
    } else {
      throw new Error('No provider supplied for the session');
    }

    this.client = new Client(this.provider);
    this.state = new State(options.state);

    this.compiler = new Compiler(options.compiler);
    this.compile = this.compiler.compile.bind(this.compiler);

    this.promise = Promise.all([
      this.client.getNetwork().then((networkId) => {
        this.networkId = networkId;
      }),
      this.client.getAccounts().then(([account]) => {
        this.client.setCurrentAccount(account);
      }),
    ]).then(() => {
      if (callback) {
        callback(this);
      }
    });
  }

  public getState(): object {
    if (!this.networkId) {
      throw new Error('Cannot read state before networkId is set');
    }
    return this.state.getState(this.networkId);
  }

  public setState(state: object) {
    if (!this.networkId) {
      throw new Error('Cannot write state before networkId is set');
    }
    this.state.setState(this.networkId, state);
  }

  public snapshot(): Promise<any> {
    return this.send('evm_snapshot').then(({ result }) => {
      return result;
    });
  }

  public revert(snapshotId: string): Promise<any> {
    return this.send('evm_revert', snapshotId);
  }

  public attachDebugger(callback): void {
    if (!this.provider.manager.state.blockchain.vm) {
      throw new Error('VM not ready yet');
    }
    // TODO: Implement debuger
    this.provider.manager.state.blockchain.vm.on('step', callback);
  }

  private send(method: string, ...params: any[]): Promise<any> {
    const payload: object = { method, jsonrpc: '2.0', id: new Date().getTime() };
    if (params.length > 0) {
      Object.assign(payload, { params });
    }

    return new Promise((resolve, reject) => {
      this.provider.send(payload, (err, res) => {
        if (!err) {
          resolve(res);
          return;
        }
        reject(err);
      });
    });
  }
}
