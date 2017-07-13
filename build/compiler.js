"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var loader_1 = require("./loader");
function loadContract(file) {
    return fs.readFileSync(file).toString();
}
exports.loadContract = loadContract;
function compiler(file, version) {
    return loader_1.default(version).then(function (engine) { return new Promise(function (resolve, reject) {
        var source = loadContract(file);
        var result = engine.compile(source);
        if (result.errors)
            return reject(result.errors);
        var contracts = result.contracts;
        var API = Object.keys(contracts).reduce(function (acc, key) {
            // compiled contract names start with a colon character
            // so we remove it to make it easier to use (thorugh desconstructors especially)
            var contractName = key.replace(/^:/, '');
            return Object.assign(acc, (_a = {}, _a[contractName] = contracts[key], _a));
            var _a;
        }, {});
        return resolve(API, result);
    }); });
}
exports.default = compiler;
