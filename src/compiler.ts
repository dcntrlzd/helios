import * as fs from 'fs';
import * as process from 'process';
import * as os from 'os';
import * as path from 'path';
import * as crypto from 'crypto';
import * as Web3 from 'web3';
import * as mkdirp from 'mkdirp';
import * as glob from 'glob';
import * as callsite from 'callsite';

type GasEstimates = {
  creation: [number, number],
  external: { [method: string]: number },
  internal: { [method: string]: number },
};

type ImportDirective = {
  path: string,
  source: string,
  match: string,
  checksum: string,
};

type ImportMap = {
  [importId: string]: string
};

type CompileOptions = {
  includeData?: boolean,
};

export type CompiledContract = {
  abi: Web3.ContractAbi,
  data: string,
  gasEstimates: GasEstimates,
};

export type CompiledContractMap = {
  [contractName: string]: CompiledContract
};

type CompilerOptions = {
  cacheDir?: string
};

let solc;

export default class Compiler {
  static TMP_NAME='solist';
  cacheDir: string;

  constructor(options?: CompilerOptions) {
    const cacheDir = (options && options.cacheDir) ? options.cacheDir : this.defaultCacheDir();
    this.cacheDir = cacheDir;

    // create the cacheDir if not present or accessible
    try {
      fs.accessSync(this.cacheDir);
    } catch (e) {
      mkdirp.sync(this.cacheDir);
    }
  }

  private defaultCacheDir(): string {
    const { getuid } = process;
    if (getuid == null) return path.join(os.tmpdir(), Compiler.TMP_NAME);
    // On some platforms tmpdir() is `/tmp`, causing conflicts between different
    // users and permission issues. Adding an additional subdivision by UID can
    // help.
    return path.join(os.tmpdir(), Compiler.TMP_NAME + '_' + getuid.call(process).toString(36));
  }

  private getChecksum(str, algorithm = 'md5') {
    return crypto
      .createHash(algorithm)
      .update(str, 'utf8')
      .digest('hex')
      .toString();
  }

  public static process(source: string, options?: CompileOptions): CompiledContractMap {
    // Only require when it's needed to shave some init time
    if (!solc) solc = require('solc');
    const result = solc.compile(source);

    if (result.errors) throw new Error(result.errors);

    const { contracts } = result;
    const { includeData = true } = (options || {});

    const compiledContractMap = Object.keys(contracts).reduce((acc, key) => {
      // compiled contract names start with a colon character
      // so we remove it to make it easier to use (through desconstructors especially)
      const contractName = key.replace(/^:/, '');

      const { interface: rawAbi, bytecode: data, gasEstimates } = contracts[key];
      const compiledContract = { abi: JSON.parse(rawAbi) as Web3.ContractAbi, gasEstimates };
      if (includeData) Object.assign(compiledContract, { data });

      return Object.assign(acc, { [contractName]: compiledContract });
    }, {});

    return compiledContractMap;
  }

  private readFromCache(checksum: string): CompiledContractMap {
    try {
      const filePath = path.join(this.cacheDir, `${checksum}.json`);
      const rawData = fs.readFileSync(filePath);
      return JSON.parse(rawData.toString());
    } catch(e) {
      return null;
    }
  }

  private writeToCache(checksum: string, contents: any): string {
    const json = JSON.stringify(contents);
    const filePath = path.join(this.cacheDir, `${checksum}.json`)
    fs.writeFileSync(filePath, json);
    return checksum;
  }

  public buildImportList(contractPath: string, source: string): ImportDirective[] {
    const importPattern = /import\s+("(.*)"|'(.*)');/ig;
    const importList = [];
    const basePath = path.dirname(contractPath);

    let groups;

    while (groups = importPattern.exec(source)) {
      const relativePath = groups[2] || groups[3];
      const importPath = path.resolve(basePath, relativePath);
      const match = groups[0];
      const source = fs.readFileSync(importPath).toString();
      const checksum = this.getChecksum(source);

      importList.push({
        match,
        source,
        checksum,
        path: importPath,
      });
    }

    return importList;
  }

  public compile(relativePath: string): CompiledContractMap {
    const [selfCall, fnCall] = callsite();
    const refPath = path.dirname(fnCall.getFileName());
    const contractPath = path.resolve(refPath, relativePath);

    let source: string = fs.readFileSync(contractPath).toString();
    this.buildImportList(contractPath, source).forEach((importDirective) => {
      source = source.replace(importDirective.match, importDirective.source);
    });

    const checksum = this.getChecksum(source);

    const cacheEntry = this.readFromCache(checksum);
    if (cacheEntry) return cacheEntry;

    const compiledContractMap = Compiler.process(source);
    this.writeToCache(checksum, compiledContractMap);

    return compiledContractMap;
  }
}
