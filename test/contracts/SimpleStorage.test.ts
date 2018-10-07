import { provider, compiler } from '../runner';
import * as ethers from 'ethers';

describe('SimpleStorage', () => {
  let factory;
  let accounts;

  beforeAll(async () => {
    accounts = await provider.listAccounts();
    const { SimpleStorage } = await compiler.compileFile('./SimpleStorage.sol');

    factory = new ethers.ContractFactory(SimpleStorage.abi, SimpleStorage.data, provider.getSigner());
  });

  it('stores & retrieves the value with web3 fully', async () => {
    const contract = await factory.deploy();
    await contract.deployed();

    const firstValue = await contract.functions.get();
    expect(Number(firstValue)).toBe(0);

    const tx = await contract.functions.set(10);
    await tx.wait();

    const secondValue = await contract.functions.get();
    expect(Number(secondValue)).toBe(10);
  });
});