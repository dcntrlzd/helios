const tsc = require('typescript');
const path = require('path');

const tsConfig = require(path.resolve(__dirname, '../tsconfig.json'));

module.exports = {
  process(src, path) {
    if (path.endsWith('.ts')) {
      return tsc.transpile(src, tsConfig.compilerOptions, path, []);
    }
    return src;
  },
};
