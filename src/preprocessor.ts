import compiler from './compiler';

export = {
  process(src: string, path: string) {
    if (!path.endsWith('.sol')) return src;
    const data = compiler.process(src);

    return `module.exports = ${JSON.stringify(data)}`;
  }
};