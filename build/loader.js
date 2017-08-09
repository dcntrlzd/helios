"use strict";
const loaderUtils = require("loader-utils");
const compiler_1 = require("./compiler");
// Loader for Webpack
function loader(source) {
    const options = loaderUtils.getOptions(this);
    const compiler = new compiler_1.default();
    const callback = this.async();
    const importResolver = (path, context) => {
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
    compiler.compile(source, this.context, importResolver, options).then((data) => {
        callback(null, `module.exports = ${JSON.stringify(data)}`);
    }).catch((err) => {
        callback(err);
    });
}
module.exports = loader;
