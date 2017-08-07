"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const callsite = require("callsite");
const crypto = require("crypto");
const fs = require("fs");
const mkdirp = require("mkdirp");
const os = require("os");
const path = require("path");
const process = require("process");
let solc;
class Compiler {
    constructor(options = {}) {
        const { cacheDir } = options;
        this.cacheDir = cacheDir ? cacheDir : this.defaultCacheDir();
        // create the cacheDir if not present or accessible
        try {
            fs.accessSync(this.cacheDir);
        }
        catch (e) {
            mkdirp.sync(this.cacheDir);
        }
    }
    static async resolveImports(source, importResolver) {
        const importPattern = /import\s+("(.*)"|'(.*)');/ig;
        const importList = [];
        const resolvers = [];
        let groups = importPattern.exec(source);
        while (groups) {
            const importPath = groups[2] || groups[3];
            const match = groups[0];
            resolvers.push(importResolver(importPath).then((importSource) => {
                importList.push({
                    match,
                    path: importPath,
                    source: importSource,
                });
            }));
            groups = importPattern.exec(source);
        }
        await Promise.all(resolvers);
        return importList;
    }
    static getChecksum(str, algorithm = 'md5') {
        return crypto
            .createHash(algorithm)
            .update(str, 'utf8')
            .digest('hex')
            .toString();
    }
    process(source, options) {
        const checksum = Compiler.getChecksum(source);
        let contracts = this.readFromCache(checksum);
        if (!contracts) {
            // Only require when it's needed to shave some init time
            solc = solc ? solc : require('solc');
            const result = solc.compile(source);
            if (result.errors) {
                throw new Error(result.errors);
            }
            contracts = result.contracts;
            this.writeToCache(checksum, contracts);
        }
        const { includeData = true } = (options || {});
        const compiledContractMap = Object.keys(contracts).reduce((acc, key) => {
            // compiled contract names start with a colon character
            // so we remove it to make it easier to use (through desconstructors especially)
            const contractName = key.replace(/^:/, '');
            const { interface: rawAbi, bytecode: data, gasEstimates } = contracts[key];
            const compiledContract = { abi: JSON.parse(rawAbi), gasEstimates };
            if (includeData) {
                Object.assign(compiledContract, { data });
            }
            return Object.assign(acc, { [contractName]: compiledContract });
        }, {});
        return compiledContractMap;
    }
    async compile(relativePath, importResolver) {
        const [selfCall, fnCall] = callsite();
        const refPath = path.dirname(fnCall.getFileName());
        const contractPath = path.resolve(refPath, relativePath);
        const source = fs.readFileSync(contractPath).toString();
        importResolver = importResolver ? importResolver : this.buildFSResolver(contractPath);
        const importList = await Compiler.resolveImports(source, importResolver);
        const sourceWithImports = importList.reduce((acc, { match, source: importSource }) => {
            return acc.replace(match, importSource);
        }, source);
        return this.process(sourceWithImports);
    }
    defaultCacheDir() {
        const { getuid } = process;
        if (getuid == null) {
            return path.join(os.tmpdir(), Compiler.TMP_NAME);
        }
        // On some platforms tmpdir() is `/tmp`, causing conflicts between different
        // users and permission issues. Adding an additional subdivision by UID can
        // help.
        return path.join(os.tmpdir(), Compiler.TMP_NAME + '_' + getuid.call(process).toString(36));
    }
    readFromCache(checksum) {
        try {
            const filePath = path.join(this.cacheDir, `${checksum}.json`);
            const rawData = fs.readFileSync(filePath);
            return JSON.parse(rawData.toString());
        }
        catch (e) {
            return null;
        }
    }
    writeToCache(checksum, contents) {
        const json = JSON.stringify(contents);
        const filePath = path.join(this.cacheDir, `${checksum}.json`);
        fs.writeFileSync(filePath, json);
        return checksum;
    }
    buildFSResolver(contractPath) {
        const basePath = path.dirname(contractPath);
        return (importPath) => {
            return new Promise((resolve, reject) => {
                const filePath = path.resolve(basePath, importPath);
                fs.readFile(filePath, (err, fileContents) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(fileContents.toString());
                });
            });
        };
    }
}
Compiler.TMP_NAME = 'helios';
exports.default = Compiler;
