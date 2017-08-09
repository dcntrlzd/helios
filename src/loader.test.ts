import * as path from 'path';
import * as webpack from 'webpack';
import MemoryFileSystem = require('memory-fs');
import heliosLoader = require('./loader');

function runWebpack(entry: string, options: object = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const fs = new MemoryFileSystem();
    const compiler: any = webpack({
      cache: true,
      context: __dirname,
      devtool: false,
      entry,
      module: {
        rules: [
           {
            test: /\.sol$/,
            use: { loader: '@dcntrlzd/helios/loader', options },
           },
        ],
      },
      resolveLoader: {
        alias: {
          '@dcntrlzd/helios/loader': path.resolve(__dirname, './loader'),
        },
        extensions: ['.js', '.json', '.ts'],
      },
    });
    compiler.outputFileSystem = fs;
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
        return;
      }

      const info = stats.toJson();
      if (stats.hasErrors()) {
        reject(info.errors);
        return;
      }

      resolve(info);
    });
  });
}

it('compiles a basic solidity contract using the loader', () => {
  return runWebpack('../test/contracts/SimpleStorage.sol').then((info) => {
    expect(info.modules[0].source).toMatchSnapshot();
  });
});

it('loader handles includeData compileOption', () => {
  return runWebpack('../test/contracts/SimpleStorage.sol', { includeData: false }).then((info) => {
    expect(info.modules[0].source).toMatchSnapshot();
  });
});

it('compiles a solidity contract with imports using the loader', () => {
  return runWebpack('../test/contracts/HandsOnToken.sol').then((info) => {
    // TODO: check for file dependencies
    expect(info.modules[0].source).toMatchSnapshot();
  });
});

it('compiles a solidity contract with deep imports using the loader', () => {
  return runWebpack('../test/contracts/Tree.sol').then((info) => {
    // TODO: check for file dependencies
    expect(info.modules[0].source).toMatchSnapshot();
  });
});
