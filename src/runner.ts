import Client from './client';
import Compiler from './compiler';
import Session from './session';

const session = new Session();
const compiler = new Compiler();
const compile = compiler.compile.bind(compiler);

declare const beforeEach: (any) => void;
declare const afterEach: (any) => void;

if (typeof beforeEach !== 'undefined' && typeof afterEach !== 'undefined') {
  let snapshotId;

  beforeAll(() => session.promise);

  beforeEach(async () => {
    snapshotId = await session.snapshot();
  });

  afterEach(async () => {
    if (snapshotId) {
      await session.revert(snapshotId);
    }
  });
}

export = session;
