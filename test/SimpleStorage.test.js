const async = require('async');
const { default: Session } = require('../dist/session');

const { SimpleStorage } = require('./SimpleStorage.sol');

it ('can run with async/await', async () => {
  expect.assertions(2);

  const { abi, data } = SimpleStorage;
  const { web3 } = new Session();
  const gas = await eth.sync(web3.eth, web3.eth.estimateGas, { data })
  const [account] = await eth.sync(web3.eth, web3.eth.getAccounts)
  web3.eth.defaultAccount = account;
  
  const SimpleStorageContract = web3.eth.contract(abi);
  const contract = await eth.deploy(SimpleStorageContract, { data, gas: gas * 2 });

  expect((await eth.sync(contract, contract.get)).toNumber()).toBe(0);
  await eth.sync(contract, contract.set, 10);
  expect((await eth.sync(contract, contract.get)).toNumber()).toBe(10);
});

it('stores & retrieves the value', (done) => {
  (new Session()).run((web3) => {
    async.waterfall([
      (callback) => {
        web3.eth.estimateGas({ data: SimpleStorage.data }, callback)
      },
      (gas, callback) => {
        const { abi, data } = SimpleStorage;

        web3.eth.contract(abi).new({ data, gas: gas * 2 }, (err, res) => {
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
      if (error) throw new Error(error);
      done();
    });
  });
});