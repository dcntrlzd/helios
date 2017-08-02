import * as TestRPC from 'ethereumjs-testrpc';
import * as Web3 from 'web3';

import Client from './client';
import Compiler from './compiler';
import State from './state';

interface ISessionOptions {
  statePath?: string;
  provider?: any;
}

export default class Session {
  public static create(options: ISessionOptions): Promise<Session> {
    return new Promise((resolve) => new Session(options, resolve));
  }

  public client: Client;
  public promise: Promise<any>;
  public compile: (path: string) => Promise<any>;

  private provider: any;
  private state: State;
  private compiler: Compiler;
  private networkId: number;

  public constructor(options: ISessionOptions = {}, callback?: (Session) => void) {
    const { provider, statePath } = options;

    if (provider) {
      this.provider = provider;
    } else if (process.env.HELIOS_NODE_URL) {
      this.provider = new Web3.providers.HttpProvider(process.env.HELIOS_NODE_URL);
    } else {
      this.provider = TestRPC.provider(options);
    }

    this.client = new Client(this.provider);
    this.state = new State(statePath);

    this.compiler = new Compiler();
    this.compile = this.compiler.compile.bind(this.compiler);

    this.promise = new Promise((resolve) => {
      this.client.web3.version.getNetwork((error, networkId) => {
        if (error) {
          throw new Error('Cannot fetch network id');
        }
        this.networkId = networkId;
        if (callback) {
          callback(this);
        }
        resolve();
      });
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
    // HARDCORE DEBUGGER:
    this.provider.manager.state.blockchain.vm.on('step', callback);
  }

  private send(method: string, ...params: any[]): Promise<any> {
    const payload: object = { method, jsonrpc: '2.0', id: new Date().getTime() };
    if (params.length > 0) {
      Object.assign(payload, { params });
    }

    return new Promise((resolve, reject) => {
      this.provider.sendAsync(payload, (err, res) => {
        if (!err) {
          resolve(res);
          return;
        }
        reject(err);
      });
    });
  }
}
