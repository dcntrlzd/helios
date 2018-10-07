import * as ethers from 'ethers';
import Compiler from '../src/compiler';
import Ganache from 'ganache-core';

export const provider = new ethers.providers.Web3Provider(Ganache.provider());
export const compiler = new Compiler();

let snapshotId;

beforeEach(async () => {
  snapshotId = await provider.send('evm_snapshot', undefined);
});

afterEach(async () => {
  if (snapshotId) await provider.send('evm_revert', snapshotId);
  snapshotId = null;
});

