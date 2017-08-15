import Client from './client';
import { ICompilerOptions } from './compiler';
import { IStateOptions } from './state';
export interface ISessionOptions {
    statePath?: string;
    compiler?: ICompilerOptions;
    state?: IStateOptions;
}
export default class Session {
    static create(provider: any, options: ISessionOptions): Promise<Session>;
    client: Client;
    promise: Promise<any>;
    compile: (path: string) => Promise<any>;
    private provider;
    private state;
    private compiler;
    private networkId;
    constructor(provider: any, options?: ISessionOptions, callback?: (Session) => void);
    getState(): object;
    setState(state: object): void;
    snapshot(): Promise<any>;
    revert(snapshotId: string): Promise<any>;
    attachDebugger(callback: any): void;
    private send(method, ...params);
}
