"use strict";
const loaderUtils = require("loader-utils");
const compiler_1 = require("./compiler");
// Loader for Webpack
function loader(source) {
    const options = loaderUtils.getOptions(this);
    const compiler = new compiler_1.default(options);
    const callback = this.async();
    compiler_1.default.resolveImports(source, (importPath) => {
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
        const sourceWithImports = importList.reduce((acc, { match, source: importSource }) => {
            return acc.replace(match, importSource);
        }, source);
        const data = compiler.process(sourceWithImports, options);
        callback(null, `module.exports = ${JSON.stringify(data)}`);
    }).catch((err) => {
        callback(err);
    });
}
module.exports = loader;
