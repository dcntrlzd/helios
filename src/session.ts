import * as TestRPC from 'ethereumjs-testrpc';
import * as Web3 from 'web3';

type SessionOptions = {
  logger: any,
};

export default class Session {
  private provider: any;
  private web3: Web3;

  constructor(options?: SessionOptions) {
    this.provider = TestRPC.provider(options);
    this.web3 = new Web3();
    this.web3.setProvider(this.provider);
  }

  onStep(callback: Function) {
    if (!this.provider.manager.state.blockchain.vm) throw new Error('VM not ready yet');
    // HARDCORE DEBUGGER:
    this.provider.manager.state.blockchain.vm.on('step', callback);
  }

  run(runner: (web3: Web3) => void) {
    this.web3.eth.getAccounts((error: Error, accounts: string[]) => {
      if (error) throw error;
      const [ account ] = accounts;
      if (!account) throw new Error('No initial account found in blockchain');
      this.web3.eth.defaultAccount = account;
      runner(this.web3);
    });
  }
}