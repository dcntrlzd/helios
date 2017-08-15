import * as Web3 from 'web3';
export interface IGasEstimates {
    creation: [number, number];
    external: {
        [method: string]: number;
    };
    internal: {
        [method: string]: number;
    };
}
export declare type ImportResolver = (importPath: string, importContext: string) => Promise<string>;
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
    includeData?: boolean;
}
export default class Compiler {
    static TMP_NAME: string;
    static resolveImports(source: string, context: string, importResolver: ImportResolver, ignoreImports?: string[]): Promise<string>;
    private static solc;
    private static getChecksum(str, algorithm?);
    cacheDir: string;
    includeData: boolean;
    constructor(options?: ICompilerOptions);
    process(source: string): ICompiledContractMap;
    compileFile(relativePath: string): Promise<ICompiledContractMap>;
    compile(source: string, context: string, importResolver: ImportResolver): Promise<ICompiledContractMap>;
    private defaultCacheDir();
    private readFromCache(checksum);
    private writeToCache(checksum, contents);
    private fsResolver(importPath, importContext);
}
