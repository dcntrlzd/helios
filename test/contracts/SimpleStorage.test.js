const { session, compiler } = require('../runner');

describe('SimpleStorage', () => {
  let ScheduledDistribution;
  let accounts;
  let web3;

  beforeEach(() => {
    web3 = session.web3;
  });

  it('stores & retrieves the value with web3 fully', async () => {
    const from = session.getCurrentAccount();
    const { SimpleStorage } = await compiler.compileFile('./SimpleStorage.sol');

    const contract = await session.deployContract(SimpleStorage);
    const firstValue = await contract.methods.get().call();
    expect(Number(firstValue)).toBe(0);

    await contract.methods.set(10).send({ from });

    const secondValue = await contract.methods.get().call();
    expect(Number(secondValue)).toBe(10);
  });

  // TODO: Check and update depending on the open issues once this test fails
  // https://github.com/ethereumjs/testrpc/issues/243
  // https://github.com/ethereum/web3.js/issues/392
  it('can sign and recover (IMPLEMENT WHEN IT FAILS)', async () => {
    const address = session.getCurrentAccount();
    const message = "HELLO WORLD";

    const messageHash = web3.eth.accounts.hashMessage(message);
    const signature = await web3.eth.sign(message, address);

    const recoveredAddress = web3.eth.accounts.recover(messageHash, signature);
    expect(address).not.toBe(recoveredAddress);
  })
})