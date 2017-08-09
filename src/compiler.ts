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

type IImportResolver = (importPath: string, importContext: string) => Promise<string>;

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

export interface ICompilerOptions {
  cacheDir?: string;
}

let solc;

export default class Compiler {
  public static TMP_NAME= 'helios';

  public static async resolveImports(
    source: string,
    context: string,
    importResolver: IImportResolver,
  ): Promise<string> {
    const importPattern = /import\s+("(.*)"|'(.*)');/ig;
    const importList = [];
    const resolvers = [];

    let groups = importPattern.exec(source);

    while (groups) {
      const importPath = groups[2] || groups[3];
      const match = groups[0];

      resolvers.push(
        importResolver(importPath, context)
          .then((importSource) => {
            const importContext = path.resolve(context, path.dirname(importPath));
            return Compiler.resolveImports(importSource, importContext, importResolver);
          })
          .then((resolvedImportSource) => {
            importList.push({
              match,
              path: importPath,
              source: resolvedImportSource,
            });
          }),
     );

      groups = importPattern.exec(source);
    }

    await Promise.all(resolvers);

    return importList.reduce((acc, { match, source: importSource }) => {
      return acc.replace(match, importSource);
    }, source);
  }

  private static getChecksum(str, algorithm = 'md5') {
    return crypto
      .createHash(algorithm)
      .update(str, 'utf8')
      .digest('hex')
      .toString();
  }

  public cacheDir: string;

  constructor(options: ICompilerOptions = {}) {
    const { cacheDir } = options;
    this.cacheDir = cacheDir ? cacheDir : this.defaultCacheDir();

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

  public async compileFile(relativePath: string): Promise<ICompiledContractMap> {
    const [selfCall, fnCall] = callsite();
    const refPath = path.dirname(fnCall.getFileName());
    const sourcePath = path.resolve(refPath, relativePath);
    const context = path.dirname(sourcePath);

    const source: string = fs.readFileSync(sourcePath).toString();
    return this.compile(source, context, this.fsResolver);
  }

  public async compile(
    source: string,
    context: string,
    importResolver: IImportResolver,
    options?: ICompileOptions,
  ): Promise<ICompiledContractMap> {
    const sourceWithImports = await Compiler.resolveImports(source, context, importResolver);

    return this.process(sourceWithImports, options);
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

  private fsResolver(importPath: string, importContext: string): Promise<string> {
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
