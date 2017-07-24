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
      const rawData = fs.readFileSync(path.join(this.cacheDir, `${checksum}.json`));
      return JSON.parse(rawData.toString());
    } catch(e) {
      return null;
    }
  }

  private writeToCache(contents: any): string {
    try {
      const json = JSON.stringify(contents);
      const checksum = this.getChecksum(json);
      const filePath = path.join(this.cacheDir, `${checksum}.json`)
      fs.writeFileSync(filePath, json);
      return checksum;
    } catch (e) {
      return null;
    }
  }

  public compile(relativePath: string): CompiledContractMap {
    const begin = Date.now();

    const [selfCall, fnCall] = callsite();
    const refPath = path.dirname(fnCall.getFileName());
    const contractPath = path.resolve(refPath, relativePath);

    const source = fs.readFileSync(contractPath).toString();
    const checksum = this.getChecksum(source);

    const cacheEntry = this.readFromCache(checksum);
    if (cacheEntry) return cacheEntry;

    const compiledContractMap = Compiler.process(source);
    this.writeToCache(compiledContractMap);

    console.log('MEASURE', relativePath, Date.now() - begin);

    return compiledContractMap;
  }
}
