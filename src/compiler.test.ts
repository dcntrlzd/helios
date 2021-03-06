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

  it('can compile a contract', async () => {
    const compiler = new Compiler();
    const contractMap = await compiler.compileFile('../test/contracts/SimpleStorage.sol');

    expect(contractMap).toMatchSnapshot();
  });

  it('can compile a contract with imports', async () => {
    const compiler = new Compiler();
    const contractMap = await compiler.compileFile('../test/contracts/HandsOnToken.sol');

    expect(contractMap).toMatchSnapshot();
  });

  it('can compile a contract with deep imports', async () => {
    const compiler = new Compiler();
    const contractMap = await compiler.compileFile('../test/contracts/Tree.sol');

    expect(contractMap).toMatchSnapshot();
  });
});
