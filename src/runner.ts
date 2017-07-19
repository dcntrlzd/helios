import * as jasmine2 from 'jest-jasmine2';
import Session from './session';
import compiler from './compiler';

let session = new Session();

declare const beforeEach: (any) => void;
declare const afterEach: (any) => void;

if (typeof beforeEach !== undefined && typeof afterEach !== undefined) {
  let snapshotId;

  beforeEach(async () => {
    snapshotId = await session.snapshot();
  });

  afterEach(async () => {
    if (snapshotId) await session.revert(snapshotId);
  });
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


export = {
  sync,
  deploy: session.deploy.bind(session),
  client: session.client,
  session,
};

