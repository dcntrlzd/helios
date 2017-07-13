import * as jasmine2 from 'jest-jasmine2';

import compiler from './compiler.js';

export = function runner(globalConfig, config, environment, runtime, testPath) {
  environment.global.compile = compiler;
  return jasmine2(globalConfig, config, environment, runtime, testPath);
}