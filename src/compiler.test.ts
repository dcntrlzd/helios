import * as async from 'async';
import * as fs from 'fs';
import * as os from 'os';

import Compiler from './compiler';

describe('Compiler', () => {
  it('Set the cacheDir if not present', () => {
    const compiler = new Compiler();

    expect(compiler.cacheDir).toMatch(new RegExp(`${os.tmpdir()}.*`));
    expect(compiler.cacheDir).toMatch(Compiler.TMP_NAME);

    expect(fs.statSync(compiler.cacheDir)).toBeTruthy();
  });

  it('can compile a contract', () => {
    const compiler = new Compiler();
    const contractMap = compiler.compile("../test/SimpleStorage.sol");

    expect(contractMap).toMatchSnapshot();
  });
});
