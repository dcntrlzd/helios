const Session = require('../src/session').default;
const TestRPC = require('ganache-core');
const Web3 = require('web3');

const provider = process.env.ETHEREUM_NODE_URL ? 
  new Web3.providers.HttpProvider(process.env.ETHEREUM_NODE_URL) :
  TestRPC.provider();
const session = new Session(provider);

const testrpcSnapshotEnabled = process.env.ETHEREUM_NODE_SNAPSHOT === 'true';

let snapshotId;

beforeAll(() => {
  return session.promise;
});

beforeEach(async () => {
  if (testrpcSnapshotEnabled) {
    snapshotId = await session.snapshot();
  }
});

afterEach(async () => {
  if (!testrpcSnapshotEnabled) {
    return
  } else if (snapshotId) {
    await session.revert(snapshotId);
  }
});

module.exports = session;
