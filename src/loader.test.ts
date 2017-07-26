import * as webpack from 'webpack';
import * as path from 'path';

const MemoryFileSystem = require('memory-fs');
const heliosLoader = require('./loader');

let originalTimeout;

beforeEach(function() {
  originalTimeout = jasmine.DEFAULT_TIMEOUT_INTERVAL;
  jasmine.DEFAULT_TIMEOUT_INTERVAL = 60 * 5 * 1000;
});

afterEach(function() {
  jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
});

function runWebpack(entry: string, options: Object = {}): Promise<any> {
  return new Promise((resolve, reject) => {
    const fs = new MemoryFileSystem();
    const compiler: any = webpack({
      cache: true,
      devtool: false,
      context: __dirname,
      entry,
      module: {
        rules: [
           {
            test: /\.sol$/,
            use: { loader: '@dcntrlzd/helios/loader', options },
           }
        ]
      },
      resolveLoader: {
        extensions: ['.js', '.json', '.ts'],
        alias: {
          '@dcntrlzd/helios/loader': path.resolve(__dirname, './loader')
        }
      }
    });
    compiler.outputFileSystem = fs;
    compiler.run((err, stats) => {
      if (err) return reject(err);

      const info = stats.toJson();
      if (stats.hasErrors()) return reject(info.errors);

      resolve(info);
    });
  });
}

it('compiles a basic solidity contract using the loader', () => {
  return runWebpack('../test/SimpleStorage.sol').then((info) => {
    expect(info.modules[0].source).toMatchSnapshot();
  });
});

it('loader handles includeData compileOption', () => {
  return runWebpack('../test/SimpleStorage.sol', { includeData: false }).then((info) => {
    expect(info.modules[0].source).toMatchSnapshot();
  });
});

it('compiles a solidity contract with imports using the loader', () => {
  return runWebpack('../test/HandsOnToken.sol').then((info) => {
    // TODO: check for file dependencies
    expect(info.modules[0].source).toMatchSnapshot();
  });
});
