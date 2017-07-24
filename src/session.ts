import * as TestRPC from 'ethereumjs-testrpc';
import * as Web3 from 'web3';
import { CompiledContract, CompiledContractMap } from './compiler';
import Client from './client';

type SessionOptions = {
  logger: any,
};

type DeployOptions = {
  contractName?: string,
  from?: string,
  gas?: number,
  gasPrice?: number,
};

export default class Session {
  public provider: any;
  public web3: Web3;
  public client: Client;

  public DEPLOYMENT_GAS = 3141592;
  public DEPLOYMENT_GAS_PRICE = 100000000000;

  constructor(options?: SessionOptions) {
    if (process.env.TESTRPC_URL) {
       this.provider = new Web3.providers.HttpProvider(process.env.TESTRPC_URL);
    } else {
      this.provider = TestRPC.provider(options);
    }

    this.web3 = new Web3(this.provider);
    this.client = new Client(this.web3);
  }

  private send(method: string, ...params: any[]): Promise<any> {
    const payload: Object = { method, jsonrpc: '2.0', id: new Date().getTime() };
    if (params.length > 0) Object.assign(payload, { params });

    return new Promise((resolve, reject) => {
      this.web3.currentProvider.sendAsync(payload, (err, res) => {
        if (!err) return resolve(res);
        reject(err);
      });
    });
  }

  public deploy<C>(compiledContract: CompiledContract, options: DeployOptions = {}, ...args): Promise<Web3.Contract<C>> {
    const { from, gas = this.DEPLOYMENT_GAS, gasPrice = this.DEPLOYMENT_GAS_PRICE } = options;
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
          if (res.address) return resolve(res);
        }
      ];

      contract.new(...deployArguments);
    });
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
    console.log('ATTACHING DEBUGGER');
    if (!this.provider.manager.state.blockchain.vm) throw new Error('VM not ready yet');
    // HARDCORE DEBUGGER:
    this.provider.manager.state.blockchain.vm.on('step', callback);
  }
}
