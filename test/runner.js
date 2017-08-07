const Session = require('../src/session').default;
const TestRPC = require('ethereumjs-testrpc');
const provider = process.env.HELIOS_NODE_URL ? null : TestRPC.provider();
const session = new Session(provider);

const testrpcSnapshotEnabled = process.env.HELIOS_SNAPSHOT === 'true';

let snapshotId;

beforeAll(() => session.promise);

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
