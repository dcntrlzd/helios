import * as fs from 'fs';

export interface IStateOptions {
  path?: string;
}

export default class State {
  private state: object;
  private path: string;

  constructor(options: IStateOptions = {}) {
    const { path } = options;
    this.path = path;

    if (this.path) {
      try {
        const rawState = fs.readFileSync(path);
        this.state = JSON.parse(rawState.toString());
      } catch (e) {
        this.state = {};
      }
      this.persist();
    } else {
      this.state = {};
    }
  }

  public getState(networkId: any): object {
    return this.state[networkId.toString()] || {};
  }

  public setState(networkId: any, state: object): void {
    const networkState = this.getState(networkId);
    this.state[networkId.toString()] = Object.assign(networkState, state);
    this.persist();
  }

  private persist() {
    if (this.path) {
      fs.writeFileSync(this.path, JSON.stringify(this.state));
    }
  }
}
