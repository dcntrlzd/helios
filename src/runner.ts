import Session from './session';
import Compiler from './compiler';

let session = new Session();
let compiler = new Compiler();

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

export = {
  compile: compiler.compile.bind(compiler),
  deploy: session.deploy.bind(session),
  client: session.client,
  session,
};

