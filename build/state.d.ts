export interface IStateOptions {
    path?: string;
}
export default class State {
    private state;
    private path;
    constructor(options?: IStateOptions);
    getState(networkId: any): object;
    setState(networkId: any, state: object): void;
    private persist();
}
