import * as callsite from 'callsite';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as os from 'os';
import * as path from 'path';
import * as process from 'process';
import * as Web3 from 'web3';

interface IGasEstimates {
  creation: [number, number];
  external: { [method: string]: number };
  internal: { [method: string]: number };
}

type IImportResolver = (importPath: string) => Promise<string>;

interface IImportDirective {
  path: string;
  match: string;
  source: string;
}

interface ICompileOptions {
  includeData?: boolean;
}

export interface ICompiledContract {
  abi: Web3.ContractAbi;
  data: string;
  gasEstimates: IGasEstimates;
}

export interface ICompiledContractMap {
  [contractName: string]: ICompiledContract;
}

interface ICompilerOptions {
  cacheDir?: string;
}

let solc;

export default class Compiler {
  public static TMP_NAME= 'helios';

  public static async resolveImports(source: string, importResolver: IImportResolver): Promise<IImportDirective[]> {
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

  private static getChecksum(str, algorithm = 'md5') {
    return crypto
      .createHash(algorithm)
      .update(str, 'utf8')
      .digest('hex')
      .toString();
  }

  public cacheDir: string;

  constructor(options?: ICompilerOptions) {
    const cacheDir = (options && options.cacheDir) ? options.cacheDir : this.defaultCacheDir();
    this.cacheDir = cacheDir;

    // create the cacheDir if not present or accessible
    try {
      fs.accessSync(this.cacheDir);
    } catch (e) {
      mkdirp.sync(this.cacheDir);
    }
  }

  public process(source: string, options?: ICompileOptions): ICompiledContractMap {
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
      const compiledContract = { abi: JSON.parse(rawAbi) as Web3.ContractAbi, gasEstimates };
      if (includeData) {
        Object.assign(compiledContract, { data });
      }

      return Object.assign(acc, { [contractName]: compiledContract });
    }, {});

    return compiledContractMap;
  }

  public async compile(relativePath: string, importResolver?: IImportResolver): Promise<ICompiledContractMap> {
    const [selfCall, fnCall] = callsite();
    const refPath = path.dirname(fnCall.getFileName());
    const contractPath = path.resolve(refPath, relativePath);

    const source: string = fs.readFileSync(contractPath).toString();
    importResolver = importResolver ? importResolver : this.buildFSResolver(contractPath);

    const importList = await Compiler.resolveImports(source, importResolver);

    const sourceWithImports = importList.reduce((acc, { match, source: importSource }) => {
      return acc.replace(match, importSource);
    }, source);

    return this.process(sourceWithImports);
  }

  private defaultCacheDir(): string {
    const { getuid } = process;
    if (getuid == null) {
      return path.join(os.tmpdir(), Compiler.TMP_NAME);
    }
    // On some platforms tmpdir() is `/tmp`, causing conflicts between different
    // users and permission issues. Adding an additional subdivision by UID can
    // help.
    return path.join(os.tmpdir(), Compiler.TMP_NAME + '_' + getuid.call(process).toString(36));
  }

  private readFromCache(checksum: string): any {
    try {
      const filePath = path.join(this.cacheDir, `${checksum}.json`);
      const rawData = fs.readFileSync(filePath);
      return JSON.parse(rawData.toString());
    } catch (e) {
      return null;
    }
  }

  private writeToCache(checksum: string, contents: any): string {
    const json = JSON.stringify(contents);
    const filePath = path.join(this.cacheDir, `${checksum}.json`);
    fs.writeFileSync(filePath, json);
    return checksum;
  }

  private buildFSResolver(contractPath: string): IImportResolver {
    const basePath = path.dirname(contractPath);
    return (importPath: string) => {
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
