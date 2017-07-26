import Session from './session';
import Compiler from './compiler';
import Client from './client';

const session = new Session();
const compiler = new Compiler();
const client = new Client(session.web3);
const compile = compiler.compile.bind(compiler);

declare const beforeEach: (any) => void;
declare const afterEach: (any) => void;

if (typeof beforeEach !== 'undefined' && typeof afterEach !== 'undefined') {
  let snapshotId;

  beforeEach(async () => {
    snapshotId = await session.snapshot();
  });

  afterEach(async () => {
    if (snapshotId) await session.revert(snapshotId);
  });
}

export = { compile, client, session };

