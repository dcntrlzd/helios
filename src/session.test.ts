import TestRPC = require('ganache-core');
import Session from './session';

describe('Session', () => {
  const provider = TestRPC.provider();
  let session;

  beforeEach(async () => {
    session = await Session.create(provider);
  });

  it('can instantiate a new instance', () => {
    expect(session.compiler).toBeTruthy();
    expect(session.compile).toBeTruthy();
    expect(session.web3).toBeTruthy();
  });

  it('getCurrentAccount returns the current account', () => {
    expect(session.getCurrentAccount()).toBeTruthy();
  });

  it('setCurrentAccount sets the current account', async () => {
    const accounts = await session.web3.eth.getAccounts();
    expect(session.getCurrentAccount()).toBe(accounts[0]);
    session.setCurrentAccount(accounts[1]);
    expect(session.getCurrentAccount()).toBe(accounts[1]);
  });

  it('defineContract returns a contract object of a contract on the blockchain');

  it('deployContracts deploys a contract and returns a contract object of it');

  it('snapshot & revert', async () => {
    const [from, to] = await session.web3.eth.getAccounts();
    const initialBalance = await session.web3.eth.getBalance(from);
    const snapshotId = await session.snapshot();
    expect(snapshotId).toBeTruthy();

    await session.web3.eth.sendTransaction({
      to,
      value: session.web3.utils.toWei('2.5', 'ether');
    });

    const updatedBalance = await session.web3.eth.getBalance(from);
    expect(updatedBalance).not.toBe(initialBalance);

    await session.revert(snapshotId);

    const revertedBalance = await session.web3.eth.getBalance(from);
    expect(revertedBalance).not.toBe(updatedBalance);
    expect(revertedBalance).toBe(initialBalance);
  });
});