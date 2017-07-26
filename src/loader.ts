import * as loaderUtils from 'loader-utils';
import * as path from 'path';
import * as fs from 'fs';

import Compiler from './compiler';

// Loader for Webpack
function loader(source: string) {
  const options = loaderUtils.getOptions(this);
  const compiler = new Compiler(options);
  const callback = this.async();

  Compiler.resolveImports(source, (importPath) => {
    return new Promise((resolve, reject) => {
      this.resolve(this.context, importPath, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        this.addDependency(result);
        resolve(this.fs.readFileSync(result).toString());
      });
    });
  }).then((importList) => {
    let sourceWithImports = importList.reduce((acc, {match, source}) => {
      return acc.replace(match, source);
    }, source);
    const data = compiler.process(sourceWithImports, options);
    callback(null, `module.exports = ${JSON.stringify(data)}`);
  }).catch((err) => {
    callback(err);
  });
}

export = loader;
