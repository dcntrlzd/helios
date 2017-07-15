import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as Web3 from 'web3';
import * as mkdirp from 'mkdirp';
import * as glob from 'glob';

type CompiledContract = {
  [contractName: string]: {
    abi: Web3.ContractAbi,
    data: string
   }
};

type CacheRecord = {
  key: string,
  entry: CacheEntry,
}

type CacheEntry = {
  checksum: string,
  value: CompiledContract,
};

type ContractCache = {
  [contractKey: string]: CacheEntry
};

type CompilerOptions = {
  rootDir: string,
  cacheDir?: string
};

let solc;

export class Compiler {
  cache: ContractCache = {};
  rootDir: string;
  cacheDir: string;

  constructor(options?: CompilerOptions) {
    if (options) this.configure(options);
  }

  public configure(options: CompilerOptions): void {
    const { rootDir, cacheDir = `${rootDir}/.solcache` } = options;
    const shouldRefreshCache = this.cacheDir !== cacheDir;

    this.rootDir = rootDir;
    this.cacheDir = cacheDir;

    if (shouldRefreshCache) this.loadCache();
  }

  private getContractPath(contractKey: string): string {
    if (!this.rootDir) throw new Error('SOL Compiler rootDir is not configured');
    return `${this.rootDir}/${contractKey}`;
  }

  private loadContract(contractKey: string): string {
    const contractPath = this.getContractPath(contractKey);
    return fs.readFileSync(contractPath).toString();
  }

  private getChecksum(str, algorithm = 'md5') {
    return crypto
      .createHash(algorithm)
      .update(str, 'utf8')
      .digest('hex')
      .toString();
  }

  private loadCache() {
    const pattern = path.join(this.cacheDir, '*.json');
    glob.sync(pattern).forEach((cacheFile: string) => {
      const rawCacheRecord = fs.readFileSync(cacheFile).toString();
      const cacheRecord: CacheRecord = JSON.parse(rawCacheRecord);
      
       this.cache[cacheRecord.key] = cacheRecord.entry;
    });
  }

  private cacheEntry(contractKey: string, cacheEntry: CacheEntry) {
    this.cache[contractKey] = cacheEntry;

    const contractCachePath = path.join(this.cacheDir, `${this.getChecksum(contractKey).toString()}.json`);
    mkdirp.sync(path.dirname(contractCachePath));
    fs.writeFileSync(contractCachePath, JSON.stringify({ key: contractKey, entry: cacheEntry }));
  }

  public process(source: string): CompiledContract {
    // Only require when it's needed to shave some init time
    if (!solc) solc = require('solc');
    const result = solc.compile(source);

    if (result.errors) throw new Error(result.errors);

    const { contracts } = result;

    const compiledContract = Object.keys(contracts).reduce((acc, key) => {
      // compiled contract names start with a colon character
      // so we remove it to make it easier to use (thorugh desconstructors especially)
      const contractName = key.replace(/^:/, '');

      const { interface: rawAbi, bytecode: data } = contracts[key];

      return Object.assign(acc, { [contractName]: { abi: JSON.parse(rawAbi) as Web3.ContractAbi, data } });
    }, {});

    return compiledContract;
  }

  public compile(contractKey: string): CompiledContract {
    const source = this.loadContract(contractKey);
    const checksum = this.getChecksum(source);

    const cacheEntry = this.cache[contractKey];
    if (cacheEntry && cacheEntry.checksum === checksum) return cacheEntry.value;

    const compiledContract = this.process(source);
    this.cacheEntry(contractKey, { checksum, value: compiledContract });

    return compiledContract;
  }
}

export default new Compiler();