import * as jasmine2 from 'jest-jasmine2';
import Session from './session';
import Compiler from './compiler';

function run(callback: (any) => void) {
  const session = new Session();
  return session.run(callback);
}

const compiler = new Compiler();

export = function runner(globalConfig, config, environment, runtime, testPath) {
  compiler.configure({ rootDir: config.rootDir });

  environment.global.eth = {
    run,
    compile: compiler.compile.bind(compiler)
  };

  return jasmine2(globalConfig, config, environment, runtime, testPath);
}

