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
    static async resolveImports(source, context, importResolver, ignoreImports = []) {
        const importPattern = /import\s+("(.*)"|'(.*)');/ig;
        const importList = [];
        let groups = importPattern.exec(source);
        while (groups) {
            const importPath = groups[2] || groups[3];
            const match = groups[0];
            const absImportPath = path.resolve(context, importPath);
            const importSource = await importResolver(importPath, context);
            const importContext = path.dirname(absImportPath);
            let resolvedImportSource = '';
            if (!ignoreImports.includes(absImportPath)) {
                resolvedImportSource = await Compiler
                    .resolveImports(importSource, importContext, importResolver, ignoreImports);
                ignoreImports.push(absImportPath);
            }
            importList.push({
                match,
                path: absImportPath,
                source: resolvedImportSource,
            });
            groups = importPattern.exec(source);
        }
        return importList.reduce((acc, { match, source: importSource }) => {
            return acc.replace(match, importSource);
        }, source);
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
    async compileFile(relativePath) {
        const [selfCall, fnCall] = callsite();
        const refPath = path.dirname(fnCall.getFileName());
        const sourcePath = path.resolve(refPath, relativePath);
        const context = path.dirname(sourcePath);
        const source = fs.readFileSync(sourcePath).toString();
        return this.compile(source, context, this.fsResolver);
    }
    async compile(source, context, importResolver, options) {
        const sourceWithImports = await Compiler.resolveImports(source, context, importResolver);
        return this.process(sourceWithImports, options);
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
    fsResolver(importPath, importContext) {
        return new Promise((resolve, reject) => {
            const filePath = path.resolve(importContext, importPath);
            fs.readFile(filePath, (err, fileContents) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(fileContents.toString());
            });
        });
    }
}
Compiler.TMP_NAME = 'helios';
exports.default = Compiler;
