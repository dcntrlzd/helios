const async = require('async');
const eth = require('../dist/runner');
const { default: Session } = require('../dist/session');

const { SimpleStorage } = require('./SimpleStorage.sol');

it ('can run with async/await and solist/client', async () => {
  expect.assertions(2);

  const [account] = await eth.client.getAccounts()
  eth.client.setCurrentAccount(account);
  
  const contract = await eth.client.deployContract(SimpleStorage);

  expect((await contract.get()).toNumber()).toBe(0);
  await contract.set(10);
  expect((await contract.get()).toNumber()).toBe(10);
});

it('stores & retrieves the value with web3 fully', (done) => {
  const { web3 } = eth.session
  async.waterfall([
    // (callback) => {
    //   web3.eth.estimateGas({ data: SimpleStorage.data }, callback)
    // },
    (callback) => {
      const { abi, data } = SimpleStorage;

      web3.eth.contract(abi).new({ data, gas: 4712388 }, (err, res) => {
        if (err) return callback(err, null);
        if (res.address) return callback(null, res);
      });
    },
    (deployedContract, callback) => {
      contract = deployedContract;
      contract.get(callback);
    },
    (value, callback) => {
      expect(value.toNumber()).toBe(0);
      contract.set(10, callback);
    },
    (txId, callback) => {
      contract.get(callback);
    },
    (value, callback) => {
      expect(value.toNumber()).toBe(10);
      callback();
    },
  ], (error) => {
    if (error) throw error;
    done();
  });
});