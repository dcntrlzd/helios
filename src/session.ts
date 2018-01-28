import Web3 from 'web3';
import Client from './client';
import Compiler, { ICompiledContract, ICompilerOptions } from './compiler';

export interface ISessionOptions {
  statePath?: string;
  compiler?: ICompilerOptions;
}

export default class Session {
  public static create(provider: any, options: ISessionOptions): Promise<Session> {
    return new Promise((resolve) => new Session(provider, options, resolve));
  }

  public client: Client;
  public promise: Promise<any>;
  public compile: (path: string) => Promise<any>;

  private provider: any;
  private compiler: Compiler;
  private networkId: number;

  public constructor(provider: any, options: ISessionOptions = {}, callback?: (Session) => void) {
    if (provider) {
      this.provider = provider;
    } else {
      throw new Error('No provider supplied for the session');
    }

    this.compiler = new Compiler(options.compiler);
    this.compile = this.compiler.compileFile.bind(this.compiler);

    this.promise = Client.create(this.provider).then((client) => {
      this.client = client;
      return this.client.getNetwork();
    }).then((networkId) => {
      this.networkId = networkId;
    }).then(() => {
       if (callback) {
         callback(this);
       }
    });
  }

  public async deployContract({ abi, data }: ICompiledContract, options = {}): Promise<any> {
    const { web3 } = this.client;
    const from = web3.eth.defaultAccount;

    return (new web3.eth.Contract(abi))
      .deploy({ data, arguments: [] })
      .send({ from, ...options });
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
    this.provider.manager.state.blockchain.vm.on('step', callback);
  }

  public send(method: string, ...params: any[]): Promise<any> {
    const payload: object = { method, jsonrpc: '2.0', id: new Date().getTime() };
    if (params.length > 0) {
      Object.assign(payload, { params });
    }

    return new Promise((resolve, reject) => {
      const sender = this.provider.sendAsync ? this.provider.sendAsync : this.provider.send;
      sender.call(this.provider, payload, (err, res) => {
        if (!err) {
          resolve(res);
          return;
        }
        reject(err);
      });
    });
  }
}
