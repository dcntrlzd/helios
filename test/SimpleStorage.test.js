const async = require('async');

const { SimpleStorage } = eth.compile('test/SimpleStorage.sol');

it('stores & retrieves the value', (done) => {
  eth.run((web3) => {
    async.waterfall([
      (callback) => {
        const { abi, data } = SimpleStorage;

        web3.eth.contract(abi).new({ data }, (err, res) => {
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
      (value) => {
        expect(value.toNumber()).toBe(10);
      },
    ], done);
  });
});