import compiler from './compiler';
import * as loaderUtils from 'loader-utils';

type Preprocessor = { (src: string): string; process: (src: string, path: string) => string; };

// Loader for Webpack
function preprocessor(src) {
  const options = loaderUtils.getOptions(this);
  const data = compiler.process(src, options);
  return `module.exports = ${JSON.stringify(data)}`;
}

// Preprocessor for Jest
const process = (src: string, path: string) => {
  if (!path.endsWith('.sol')) return src;
  return preprocessor(src);
}

export = Object.assign(preprocessor, { process }) as Preprocessor;