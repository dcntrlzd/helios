import * as loaderUtils from 'loader-utils';

import Compiler from './compiler';

// Loader for Webpack
function loader(source: string) {
  const options = Object.assign(
    { includeData: false },
    loaderUtils.getOptions(this) || {},
  );

  const compiler = new Compiler(options);
  const callback = this.async();

  const importResolver = (path, context): Promise<string> => {
    return new Promise((resolve, reject) => {
      this.resolve(context, path, (err, result) => {
        if (err) {
          reject(err);
          return;
        }
        this.addDependency(result);
        resolve(this.fs.readFileSync(result).toString());
      });
    });
  };

  compiler.compile(source, this.context, importResolver).then((data) => {
    callback(null, `module.exports = ${JSON.stringify(data)}`);
  }).catch((err) => {
    callback(err);
  });
}

export = loader;
