import * as TestRPC from 'ethereumjs-testrpc';
import * as Web3 from 'web3';

interface ISessionOptions {
  logger: any;
}

// TODO: Refactor to be a basic utility for providing a provider instance and a compiler

export default class Session {
  public provider: any;
  public web3: Web3;

  constructor(options?: ISessionOptions) {
    // TODO: create a state instance
    // TODO: proxy setState/getState methods with networkId param
    // TODO: create a compiler instance (private)
    // TODO: proxy compile method
    // TODO: create a client instance (private)

    if (process.env.HELIOS_NODE_URL) {
       this.provider = new Web3.providers.HttpProvider(process.env.HELIOS_NODE_URL);
    } else {
      this.provider = TestRPC.provider(options);
    }

    this.web3 = new Web3(this.provider);
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
      this.web3.currentProvider.sendAsync(payload, (err, res) => {
        if (!err) {
          resolve(res);
          return;
        }
        reject(err);
      });
    });
  }
}
