import * as loaderUtils from 'loader-utils';
import * as path from 'path';
import * as fs from 'fs';

import Compiler from './compiler';

// Loader for Webpack
function loader(source: string) {
  const options = loaderUtils.getOptions(this);

  const sourceWithImports = Compiler.buildImportList(source, (importPath) => {
    const fullPath = path.resolve(this.context, importPath);
    this.addDependency(fullPath);
    // TODO: Use this.resolve/this.loadModule instead of readFile
    // * https://webpack.js.org/development/how-to-write-a-loader/#resolve-dependencies
    // * https://github.com/webpack-contrib/less-loader/blob/a3f9601c9439471f7f0ce9b4a59ba4cf9e178c43/src/createWebpackLessPlugin.js
    // * https://webpack.js.org/api/loaders/#this-loadmodule

    // const request = loaderUtils.urlToRequest(importPath, this.context);
    // this.loadModule(fullPath, console.log);
    // this.resolve(this.context, request);
    return fs.readFileSync(fullPath).toString();
  }).reduce((acc, importDirective) => {
    return acc.replace(importDirective.match, importDirective.source)
  }, source);

  const data = Compiler.process(sourceWithImports, options);
  return `module.exports = ${JSON.stringify(data)}`;
}

export = loader;
