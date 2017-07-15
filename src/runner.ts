import * as jasmine2 from 'jest-jasmine2';
import Session from './session';
import compiler from './compiler';

function run(callback: (any) => void) {
  const session = new Session();
  return session.run(callback);
}

function sync(context, method, ...args) {
  return new Promise((resolve: Function, reject: Function) => {
    args.push((err, ...results) => {
      if (err) return reject(err);
      resolve(...results);
    });

    method.bind(context)(...args);
  });
}

function deploy(Contract, ...args) {
  return new Promise((resolve, reject) => {
    const contract = Contract.new(...args, (err, res) => {
      if (err) return reject(err);
      if (res.address) return resolve(res);
    });
  });
}

export = function runner(globalConfig, config, environment, runtime, testPath) {
  environment.global.eth = { run, sync, deploy };
  return jasmine2(globalConfig, config, environment, runtime, testPath);
}

