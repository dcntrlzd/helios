const async = require('async');
const helios = require('../runner');

it('stores & retrieves the value with web3 fully', async () => {
  const from = helios.client.getCurrentAccount();

  const { web3 } = helios.client
  const { SimpleStorage } = await helios.compile('./SimpleStorage.sol');

  const contract = await helios.client.deployContract(SimpleStorage);

  const firstValue = await contract.methods.get().call();
  expect(Number(firstValue)).toBe(0);

  await contract.methods.set(10).send({ from });

  const secondValue = await contract.methods.get().call();
  expect(Number(secondValue)).toBe(10);
});
