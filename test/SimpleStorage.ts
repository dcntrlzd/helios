// import compiler from '../engine/compiler';
// import Session from '../engine/session';
// import * as async from 'async';
// import * as BigNumber from 'bignumber.js';

// process.on('unhandledRejection', r => console.error('ERROR', r));
// const session = new Session();

// session.run((web3) => {
//   let contractInfo;
//   let contract;

//   async.waterfall([
//     (callback) => {
//       compiler('SimpleStorage.sol', '0.4.11')
//         .then(({ SimpleStorage }) => {
//           contractInfo = SimpleStorage;
//           callback(null);
//         });
//     },
//     (callback) => {
//       web3.eth.getAccounts(callback);
//     },
//     (accounts, callback) => {
//       web3.eth.defaultAccount = accounts[0];
//       const { bytecode: data } = contractInfo;
//       return web3.eth.estimateGas({ data }, callback);
//     },
//     (gas, callback) => {
//       const { interface: abi, bytecode: data } = contractInfo;

//       let Contract = web3.eth.contract(JSON.parse(abi));
//       Contract.new({ data, gas }, (err, res) => {
//         if (err) return callback(err, null);
//         if (res.address) return callback(null, res);
//       });
//     },
//     (createdContract, callback) => {
//       contract = createdContract;
//       contract.get(callback);
//     },
//     (value, callback) => {
//       console.log('1st RUN', value.toString());
//       contract.set(10, callback);
//     },
//     (txId, callback) => {
//       contract.get(callback);
//     },
//     (value, callback) => {
//       console.log('2nd RUN', value.toString());
//     },
//   ], (err) => {
//     if (err) console.error(err);
//   })
// })